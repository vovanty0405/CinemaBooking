const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/paymentController')
const { authenticate } = require('../middlewares/authMiddleware')

// IPN và Return URL KHÔNG cần auth (VNPay gọi trực tiếp)
router.get('/vnpay/ipn', ctrl.ipnHandler)
router.get('/vnpay/return', ctrl.returnHandler)

// Các route cần auth
router.post('/vnpay/create', authenticate, ctrl.createPayment)
router.get('/history', authenticate, ctrl.getHistory)

module.exports = router