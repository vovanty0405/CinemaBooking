const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema(
  {
    cinema: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cinema',
      required: true,
    },
    name: { type: String, required: true, trim: true }, // VD: "Room 1", "Hall A"
    rows: { type: Number, required: true, min: 1 },     // số hàng
    seatsPerRow: { type: Number, required: true, min: 1 }, // số ghế/hàng
    type: {
      type: String,
      enum: ['standard', 'imax', '4dx'],
      default: 'standard',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

// Mỗi rạp không có 2 phòng trùng tên
roomSchema.index({ cinema: 1, name: 1 }, { unique: true })

module.exports = mongoose.model('Room', roomSchema)