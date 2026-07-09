const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false, // không trả password khi query
    },
    image:{
        type: String,
        default: ' '
    },
    phone: {
        type: String,
        trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    resetPasswordOtp: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    },
},{
    timestamps: true
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  const bcrypt = require('bcryptjs')
  return await bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('User', userSchema)