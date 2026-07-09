const paymentService = require('../services/paymentService')

/**
 * Tạo URL thanh toán VNPay
 * POST /api/payments/vnpay/create
 */
const createPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.body
    if (!bookingId) {
      return res.status(400).json({ message: 'bookingId is required' })
    }

    // Lấy IP thực của user (qua reverse proxy)
    const ipAddr =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1'

    const result = await paymentService.createVNPayUrl(bookingId, req.user.id, ipAddr)
    res.json({
      message: 'Payment URL created',
      data: result,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * IPN Handler — VNPay gọi server-to-server
 * GET /api/payments/vnpay/ipn
 * KHÔNG cần auth middleware (VNPay gọi trực tiếp)
 */
const ipnHandler = async (req, res) => {
  try {
    const result = await paymentService.handleIPN(req.query)
    // VNPay yêu cầu response đúng format này
    res.json(result)
  } catch (err) {
    console.error('IPN Error:', err)
    res.json({ RspCode: '99', Message: 'Unknown error' })
  }
}

/**
 * Return URL Handler — redirect từ VNPay về trình duyệt user
 * GET /api/payments/vnpay/return
 */
const returnHandler = async (req, res) => {
  try {
    const result = await paymentService.handleReturn(req.query)

    if (result.success) {
      // Redirect FE đến trang thành công
      return res.redirect(
        `${process.env.CLIENT_URL}/booking/success?bookingId=${result.bookingId}`
      )
    } else {
      // Redirect FE đến trang thất bại
      return res.redirect(
        `${process.env.CLIENT_URL}/booking/failed?code=${result.responseCode}`
      )
    }
  } catch (err) {
    console.error('Return URL Error:', err)
    res.redirect(`${process.env.CLIENT_URL}/booking/failed?code=99`)
  }
}

/**
 * Lịch sử thanh toán
 * GET /api/payments/history
 */
const getHistory = async (req, res, next) => {
  try {
    const result = await paymentService.getPaymentHistory(req.user.id, req.query)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}

module.exports = { createPayment, ipnHandler, returnHandler, getHistory }