const mongoose = require('mongoose')

const showtimeSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true }, // tự tính từ startTime + duration
    basePrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'finished', 'cancelled'],
      default: 'scheduled',
    },
  },
  { timestamps: true }
)

showtimeSchema.index({ movie: 1, startTime: 1 })
showtimeSchema.index({ room: 1, startTime: 1 })
// Query lịch chiếu theo ngày rất phổ biến
showtimeSchema.index({ startTime: 1, status: 1 })

module.exports = mongoose.model('Showtime', showtimeSchema)