const mongoose = require('mongoose')
const Booking = require('../models/Booking')
const Showtime = require('../models/Showtime')
const Seat = require('../models/Seat')
const Coupon = require('../models/Coupon')
const Combo = require('../models/Combo')
const seatLock = require('../services/seatLockService')
// Lazy load sockets to avoid circular dependency

/**
 * Tạo booking mới với seat locking
 */
const createBooking = async (userId, { showtimeId, seatIds, concessions = [], couponCode }) => {
  // 1. Validate showtime
  const showtime = await Showtime.findById(showtimeId).populate('room')
  if (!showtime) throw Object.assign(new Error('Showtime not found'), { statusCode: 404 })
  if (showtime.status !== 'scheduled') {
    throw Object.assign(new Error('Showtime is not available'), { statusCode: 400 })
  }
  if (new Date() >= showtime.startTime) {
    throw Object.assign(new Error('Showtime has already started'), { statusCode: 400 })
  }

  // 2. Validate seats thuộc đúng phòng
  const seats = await Seat.find({
    _id: { $in: seatIds },
    room: showtime.room._id,
    status: { $ne: 'inactive' },
  })
  if (seats.length !== seatIds.length) {
    throw Object.assign(new Error('One or more seats are invalid'), { statusCode: 400 })
  }

  // 3. Kiểm tra ghế chưa được đặt trong DB (confirmed booking)
  const existingBooking = await Booking.findOne({
    showtime: showtimeId,
    status: { $in: ['pending', 'confirmed'] },
    'seats.seat': { $in: seatIds },
  })
  if (existingBooking) {
    throw Object.assign(new Error('One or more seats are already booked'), { statusCode: 409 })
  }

  // 4. Lock ghế trên Redis (xử lý race condition)
  const lockResult = await seatLock.lockMultipleSeats(showtimeId, seatIds, userId)
  if (!lockResult.success) {
    throw Object.assign(
      new Error(`Seat is being held by another user, please choose another seat`),
      { statusCode: 409 }
    )
  }

  // 5. Tính giá từng ghế
  const seatPriceMap = {
    standard: showtime.basePrice,
    vip: showtime.basePrice * 1.3,
    couple: showtime.basePrice * 2.2,
  }

  const bookedSeats = seats.map((seat) => ({
    seat: seat._id,
    row: seat.row,
    number: seat.number,
    type: seat.type,
    price: seatPriceMap[seat.type] || showtime.basePrice,
  }))

  const ticketTotal = bookedSeats.reduce((sum, s) => sum + s.price, 0)

  // Tính tiền combo
  let comboTotal = 0;
  const bookingConcessions = [];
  if (concessions && concessions.length > 0) {
    for (const c of concessions) {
      const combo = await Combo.findById(c.comboId);
      if (combo && combo.status === 'active') {
        const linePrice = combo.comboPrice * c.quantity;
        comboTotal += linePrice;
        bookingConcessions.push({
          comboId: combo._id,
          quantity: c.quantity,
          price: combo.comboPrice
        });
      }
    }
  }

  let cartTotal = ticketTotal + comboTotal;
  let discountAmount = 0;
  let couponApplied = null;

  // Tính mã giảm giá
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), status: 'active' });
    if (coupon) {
      const now = new Date();
      if (now >= coupon.startDate && now <= coupon.endDate) {
        if (coupon.usageLimitTotal === null || coupon.usedCount < coupon.usageLimitTotal) {
          if (cartTotal >= coupon.minOrderValue) {
            if (coupon.discountType === 'percent') {
              discountAmount = (cartTotal * coupon.discountValue) / 100;
              if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
                discountAmount = coupon.maxDiscountAmount;
              }
            } else {
              discountAmount = coupon.discountValue;
            }
            if (discountAmount > cartTotal) discountAmount = cartTotal;
            couponApplied = coupon._id;
          }
        }
      }
    }
  }

  const finalTotalAmount = cartTotal - discountAmount;

  // 6. Tạo booking trong DB
  const booking = await Booking.create({
    user: userId,
    showtime: showtimeId,
    seats: bookedSeats,
    concessions: bookingConcessions,
    couponApplied: couponApplied,
    discountAmount: discountAmount,
    totalAmount: finalTotalAmount,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  })

  // Emit realtime: ghế chuyển sang "locked"
  const lockedSeats = seats.map((seat) => ({
    _id: seat._id,
    row: seat.row,
    number: seat.number,
    status: 'locked',
  }))
  const { emitToShowtime, emitBookingCountdown } = require('../sockets')
  emitToShowtime(showtimeId, 'seats_status_changed', {
    showtimeId,
    seats: lockedSeats,
  })

  // Emit countdown cho chính user đó
  emitBookingCountdown(userId.toString(), booking._id.toString(), booking.expiresAt)

  return booking
}

/**
 * Xác nhận booking sau khi thanh toán thành công
 */
const confirmBooking = async (bookingId, userId) => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId })
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 })
  if (booking.status !== 'pending') {
    throw Object.assign(new Error(`Booking is already ${booking.status}`), { statusCode: 400 })
  }
  if (new Date() > booking.expiresAt) {
    throw Object.assign(new Error('Booking has expired'), { statusCode: 400 })
  }

  booking.status = 'confirmed'
  booking.paymentStatus = 'paid'
  booking.expiresAt = undefined;
  await booking.save()

  // Tăng usedCount của coupon nếu có
  if (booking.couponApplied) {
    await Coupon.findByIdAndUpdate(booking.couponApplied, { $inc: { usedCount: 1 } });
  }

  // Giải phóng Redis lock — ghế đã confirmed nên không cần lock nữa
  const seatIds = booking.seats.map((s) => s.seat.toString())
  await seatLock.unlockMultipleSeats(booking.showtime.toString(), seatIds, userId.toString())

  // Emit realtime: ghế chuyển sang "booked"
  const bookedSeats = booking.seats.map((s) => ({
    _id: s.seat,
    row: s.row,
    number: s.number,
    status: 'booked',
  }))
  const { emitToShowtime } = require('../sockets')
  emitToShowtime(booking.showtime.toString(), 'seats_status_changed', {
    showtimeId: booking.showtime.toString(),
    seats: bookedSeats,
  })

  return booking
}

/**
 * Hủy booking
 */
const cancelBooking = async (bookingId, userId) => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId })
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 })
  if (booking.status === 'confirmed') {
    throw Object.assign(new Error('Cannot cancel a confirmed booking'), { statusCode: 400 })
  }

  booking.status = 'cancelled'
  await booking.save()

  // Giải phóng lock
  const seatIds = booking.seats.map((s) => s.seat.toString())
  await seatLock.unlockMultipleSeats(booking.showtime.toString(), seatIds, userId.toString())

  // Emit realtime: ghế về "available"
  const freedSeats = booking.seats.map((s) => ({
    _id: s.seat,
    row: s.row,
    number: s.number,
    status: 'available',
  }))
  const { emitToShowtime } = require('../sockets')
  emitToShowtime(booking.showtime.toString(), 'seats_status_changed', {
    showtimeId: booking.showtime.toString(),
    seats: freedSeats,
  })

  return booking
}

/**
 * Lấy sơ đồ ghế của 1 suất chiếu (kết hợp DB + Redis)
 */
const getSeatMap = async (showtimeId) => {
  const showtime = await Showtime.findById(showtimeId).populate('room')
  if (!showtime) throw Object.assign(new Error('Showtime not found'), { statusCode: 404 })

  // Tất cả ghế của phòng
  const allSeats = await Seat.find({ room: showtime.room._id, status: { $ne: 'inactive' } }).sort({ row: 1, number: 1 })

  // Ghế đã confirmed trong DB
  const confirmedBookings = await Booking.find({
    showtime: showtimeId,
    status: 'confirmed',
  }).select('seats')
  const confirmedSeatIds = new Set(
    confirmedBookings.flatMap((b) => b.seats.map((s) => s.seat.toString()))
  )

  // Ghế đang bị lock trên Redis (pending)
  const lockedSeatIds = new Set(
    await seatLock.getLockedSeatsForShowtime(showtimeId)
  )

  // Map trạng thái từng ghế
  return allSeats.map((seat) => {
    const id = seat._id.toString()
    let status = 'available'
    if (confirmedSeatIds.has(id)) status = 'booked'
    else if (lockedSeatIds.has(id)) status = 'locked' // đang được giữ

    return {
      _id: seat._id,
      row: seat.row,
      number: seat.number,
      type: seat.type,
      spanColumns: seat.spanColumns,
      status: seat.status === 'maintenance' || seat.status === 'broken' ? seat.status : status,
    }
  })
}

/**
 * Lấy booking của user
 */
const getUserBookings = async (userId, { page = 1, limit = 10, status } = {}) => {
  const query = { user: userId }
  if (status) query.status = status

  const skip = (page - 1) * limit
  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('showtime', 'startTime endTime basePrice')
      .populate({ 
        path: 'showtime', 
        populate: [
          { path: 'movie', select: 'title posterUrl' },
          { path: 'room', populate: { path: 'cinema', select: 'name address' } }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(query),
  ])

  return { bookings, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

const getBookingById = async (bookingId, userId) => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId })
    .populate({
      path: 'showtime',
      populate: [
        { path: 'movie', select: 'title posterUrl duration' },
        { path: 'room', populate: { path: 'cinema', select: 'name address' } },
      ],
    })
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 })
  return booking
}

module.exports = {
  createBooking,
  confirmBooking,
  cancelBooking,
  getSeatMap,
  getUserBookings,
  getBookingById,
}