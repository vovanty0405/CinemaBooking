const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, min: 1, max: 5, default: null },
  comment: { type: String, required: true, trim: true },
  threadRootId: { type: mongoose.Schema.Types.ObjectId, ref: "Review", default: null },
  replyToReviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review", default: null },
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true })

reviewSchema.index({ movieId: 1, threadRootId: 1, createdAt: 1 })

module.exports = mongoose.model('Review', reviewSchema)
