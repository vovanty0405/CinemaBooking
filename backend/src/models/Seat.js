const mongoose = require('mongoose')

const seatSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  row: { type: String, required: true },    // 'A', 'B', 'C'...
  number: { type: Number, required: true }, // 1, 2, 3...
  type: {
    type: String,
    enum: ['standard', 'vip', 'couple'],
    default: 'standard',
  },
  spanColumns: { type: Number, default: 1 },
  pairedWithSeatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat', default: null },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'broken', 'inactive'],
    default: 'active',
  },
  statusNote: { type: String, default: '' },
}, { timestamps: true })

// Mỗi phòng không có 2 ghế trùng vị trí
seatSchema.index({ room: 1, row: 1, number: 1 }, { unique: true })

module.exports = mongoose.model('Seat', seatSchema)