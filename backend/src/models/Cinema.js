const mongoose = require('mongoose')

const cinemaSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            required: true,
        },
        city:{
            type: String,
            required: true,
        },
        phone:{
            type: String
        },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true
    }
)

cinemaSchema.index({ city: 1, isActive: 1 })

module.exports = mongoose.model('Cinema', cinemaSchema)