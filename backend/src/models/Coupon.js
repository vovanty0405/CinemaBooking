const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  discountType: { type: String, enum: ['percent', 'fixed'], required: true },
  discountValue: { type: Number, required: true },      
  maxDiscountAmount: { type: Number, default: null },   
  minOrderValue: { type: Number, default: 0 },
  applicableMovieIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }], 
  applicableCinemaIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cinema' }],
  applicableDaysOfWeek: [{ type: Number }],             
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  usageLimitTotal: { type: Number, default: null },     
  usageLimitPerUser: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  isStackableWithCombo: { type: Boolean, default: true }, 
  isFeaturedOnHome: { type: Boolean, default: false },
  tagLabel: { type: String, default: '' },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'expired', 'disabled'],
    default: 'scheduled'
  },
}, { timestamps: true })

module.exports = mongoose.model('Coupon', couponSchema)
