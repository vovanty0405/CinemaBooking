const crypto = require('crypto')
const Payment = require('../models/Payment')
const Booking = require('../models/Booking')
const bookingService = require('../services/bookingService')
const { createPaymentUrl, verifySignature } = require('../untils/vnpay')

/**
 * Tạo VNPay payment URL cho 1 booking
 */
const createVNPayUrl = async (bookingId, userId, ipAddr) => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId })
  if (!booking) {
    throw Object.assign(new Error('Booking not found'), { statusCode: 404 })
  }
  if (booking.status !== 'pending') {
    throw Object.assign(new Error(`Booking is ${booking.status}`), { statusCode: 400 })
  }
  if (new Date() > booking.expiresAt) {
    throw Object.assign(new Error('Booking has expired'), { statusCode: 400 })
  }

  // Tạo mã giao dịch unique: timestamp + random
  const txnRef = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`

  // Lưu payment record ở trạng thái pending
  await Payment.create({
    booking: bookingId,
    user: userId,
    amount: booking.totalAmount,
    vnpayTxnRef: txnRef,
  })

  const paymentUrl = createPaymentUrl({
    amount: booking.totalAmount,
    bookingId: bookingId.toString(),
    txnRef,
    ipAddr,
    orderInfo: `Thanh toan ve xem phim - Booking ${bookingId}`,
  })

  return { paymentUrl, txnRef }
}

/**
 * Xử lý IPN callback từ VNPay (server-to-server)
 * Đây là nơi DUY NHẤT confirm booking
 */
const handleIPN = async (vnpParams) => {
  // 1. Verify chữ ký
  const isValid = verifySignature(vnpParams)
  if (!isValid) {
    return { RspCode: '97', Message: 'Invalid signature' }
  }

  const txnRef = vnpParams.vnp_TxnRef
  const responseCode = vnpParams.vnp_ResponseCode
  const vnpAmount = parseInt(vnpParams.vnp_Amount) / 100 // convert về VNĐ

  // 2. Tìm payment record
  const payment = await Payment.findOne({ vnpayTxnRef: txnRef }).populate('booking')
  if (!payment) {
    return { RspCode: '01', Message: 'Order not found' }
  }

  // 3. Chống replay attack: không xử lý lại nếu đã success/failed
  if (payment.status !== 'pending') {
    return { RspCode: '02', Message: 'Order already confirmed' }
  }

  // 4. Kiểm tra số tiền khớp (bảo vệ khỏi gian lận)
  if (vnpAmount !== payment.amount) {
    await Payment.findByIdAndUpdate(payment._id, {
      status: 'failed',
      vnpayResponseCode: responseCode,
      rawResponse: vnpParams,
    })
    return { RspCode: '04', Message: 'Invalid amount' }
  }

  // 5. Cập nhật payment
  const updateData = {
    vnpayResponseCode: responseCode,
    vnpayTransactionNo: vnpParams.vnp_TransactionNo,
    vnpayBankCode: vnpParams.vnp_BankCode,
    vnpayPayDate: vnpParams.vnp_PayDate,
    rawResponse: vnpParams,
  }

  if (responseCode === '00') {
    // Thanh toán thành công
    updateData.status = 'success'
    await Payment.findByIdAndUpdate(payment._id, updateData)

    // Confirm booking trong DB + giải phóng Redis lock
    await bookingService.confirmBooking(
      payment.booking._id.toString(),
      payment.booking.user.toString()
    )

    return { RspCode: '00', Message: 'Confirm success' }
  } else {
    // Thanh toán thất bại
    updateData.status = 'failed'
    await Payment.findByIdAndUpdate(payment._id, updateData)

    // Hủy booking, giải phóng ghế
    await bookingService.cancelBooking(
      payment.booking._id.toString(),
      payment.booking.user.toString()
    )

    return { RspCode: '00', Message: 'Confirm success' } // vẫn trả 00 để VNPay không retry
  }
}

/**
 * Xử lý Return URL (redirect từ VNPay về trình duyệt)
 * Hỗ trợ confirm DB luôn ở đây (để tiện test ở localhost khi IPN không tới được)
 */
const handleReturn = async (vnpParams) => {
  const isValid = verifySignature(vnpParams)
  const responseCode = vnpParams.vnp_ResponseCode
  const txnRef = vnpParams.vnp_TxnRef

  const payment = await Payment.findOne({ vnpayTxnRef: txnRef }).populate('booking')
  
  if (isValid && responseCode === '00' && payment && payment.status === 'pending') {
    // Thanh toán thành công (Xử lý fallback cho IPN khi chạy localhost)
    await Payment.findByIdAndUpdate(payment._id, {
      status: 'success',
      vnpayResponseCode: responseCode,
      vnpayTransactionNo: vnpParams.vnp_TransactionNo,
      vnpayBankCode: vnpParams.vnp_BankCode,
      vnpayPayDate: vnpParams.vnp_PayDate,
    })

    await bookingService.confirmBooking(
      payment.booking._id.toString(),
      payment.booking.user.toString()
    )
  }

  return {
    isValid,
    success: responseCode === '00' && isValid,
    responseCode,
    txnRef,
    bookingId: payment?.booking?._id?.toString(),
    amount: payment?.amount,
  }
}

/**
 * Lấy lịch sử thanh toán của user
 */
const getPaymentHistory = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit
  const [payments, total] = await Promise.all([
    Payment.find({ user: userId })
      .populate('booking', 'seats totalAmount status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments({ user: userId }),
  ])
  return { payments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

module.exports = { createVNPayUrl, handleIPN, handleReturn, getPaymentHistory }