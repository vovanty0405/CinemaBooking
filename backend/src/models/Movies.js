const mongoose = require('mongoose')

const movieSchema = new mongoose.Schema({
    title:{
        type: String,
        required: [true, 'Title is required'],
        trim: true,
    },
    description: { type: String, trim: true },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be positive'], // phút
    },
    genre: [{
      type: String,
      enum: ['action', 'comedy', 'drama', 'horror', 'sci-fi', 'romance', 'animation', 'thriller'],
    }],
    language: { type: String, default: 'Vietnamese' },
    releaseDate: { type: Date },
    endDate: { type: Date },
    posterUrl: { 
      type: String,
      required: [true, 'Poster URL is required'],
      default: ''
    },
    backdropUrl: { type: String, default: '' },
    trailerUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['coming_soon', 'now_showing', 'ended'],
      default: 'coming_soon'
    },
    isFeatured: { type: Boolean, default: false },
    avgRatingScore: { type: Number, default: 0, min: 0, max: 5 },
    rating: {
      type: String,
      enum: ['P', 'C13', 'C16', 'C18'],
      default: 'P',
    },
    isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
)

// Index tìm kiếm theo title
movieSchema.index({ title: 'text' }, { language_override: 'none' })
movieSchema.index({ isActive: 1, releaseDate: -1 })

module.exports = mongoose.model('Movie', movieSchema)