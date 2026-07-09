const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
    seats: [
      {
        seat: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat', required: true },
        row: String,
        number: Number,
        type: { type: String, enum: ['standard', 'vip', 'couple'] },
        price: Number,
      },
    ],
    concessions: [{
      comboId: { type: mongoose.Schema.Types.ObjectId, ref: 'Combo' },
      quantity: { type: Number, default: 1 },
      price: { type: Number, required: true },
    }],
    couponApplied: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'expired'],
      default: 'pending',
    },
    paymentMethod: { type: String, enum: ['vnpay', 'cash'], default: 'vnpay' },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 phút
    },
  },
  { timestamps: true }
)

// TTL index: MongoDB tự hủy booking expired
bookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
bookingSchema.index({ user: 1, status: 1 })
bookingSchema.index({ showtime: 1, status: 1 })
bookingSchema.index({ createdAt: 1 })

module.exports = mongoose.model('Booking', bookingSchema)