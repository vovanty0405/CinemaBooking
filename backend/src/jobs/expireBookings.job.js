const Booking = require('../models/Booking')
const seatLock = require('../services/seatLockService')
const { emitToShowtime } = require('../sockets')

const expireBookings = async () => {
  const expiredBookings = await Booking.find({
    status: 'pending',
    expiresAt: { $lt: new Date() },
  })

  for (const booking of expiredBookings) {
    booking.status = 'expired'
    await booking.save()

    // Giải phóng Redis lock nếu còn
    const seatIds = booking.seats.map((s) => s.seat.toString())
    await seatLock.unlockMultipleSeats(
      booking.showtime.toString(),
      seatIds,
      booking.user.toString()
    )
    // Emit realtime: ghế về "available" sau khi hết hạn
    const freedSeats = booking.seats.map((s) => ({
      _id: s.seat,
      row: s.row,
      number: s.number,
      status: 'available',
    }))
    emitToShowtime(booking.showtime.toString(), 'seats_status_changed', {
      showtimeId: booking.showtime.toString(),
      seats: freedSeats,
    })

    console.log(`Booking ${booking._id} expired — seats released`)
  }
}

// Chạy mỗi 1 phút
const startExpireJob = () => {
  console.log('Expire booking job started')
  setInterval(expireBookings, 60 * 1000)
}

module.exports = { startExpireJob }