const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['vnpay'], default: 'vnpay' },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
    },
    // VNPay specific fields
    vnpayTxnRef: { type: String, unique: true },   // mã giao dịch bên mình tạo
    vnpayTransactionNo: { type: String },           // mã giao dịch bên VNPay
    vnpayResponseCode: { type: String },            // '00' = success
    vnpayBankCode: { type: String },
    vnpayPayDate: { type: String },
    rawResponse: { type: mongoose.Schema.Types.Mixed }, // lưu toàn bộ response VNPay
  },
  { timestamps: true }
)

paymentSchema.index({ booking: 1 })
paymentSchema.index({ user: 1, createdAt: -1 })

module.exports = mongoose.model('Payment', paymentSchema)