const User = require('../models/Users')
const RefreshToken = require('../models/RefreshToken')
const {generateAccessToken, generateRefreshToken, verifyRefreshToken} = require('../untils/jwt')
const ms = require('ms')
const bcrypt = require('bcryptjs')


const register = async({name, email, password, phone})=>{
    const exists = await User.findOne({email})
    if(exists){
        throw new Error('Email đã được sử dụng!')
    }
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashedPassword, phone })
    return { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone }
}
const login = async({email,password })=>{
    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.comparePassword(password))) {
        throw new Error('Không tìm thấy email hay password!')
    }
    const payload = { id: user._id, email: user.email, role: user.role }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

     // Lưu refresh token vào DB
  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt: new Date(Date.now() + ms(process.env.JWT_REFRESH_EXPIRES)),
  })
  

  return { accessToken, refreshToken, user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone } }
}
const refresh = async(token)=>{
    const decoded = verifyRefreshToken(token)

    const storedToken = await RefreshToken.findOne({token, isRevoked: false})
    if(!storedToken){
        throw new Error('Không tìm thấy token!')
    }
    //Xóa Token cũ đi và tạo token mới
    await RefreshToken.deleteOne({_id: storedToken._id})

    const payload = { id: decoded.id, email: decoded.email, role: decoded.role }
    const newAccessToken = generateAccessToken(payload)
    const newRefreshToken = generateRefreshToken(payload)

    await RefreshToken.create({
    token: newRefreshToken,
    user: decoded.id,
    expiresAt: new Date(Date.now() + ms(process.env.JWT_REFRESH_EXPIRES)),
    })

    return { accessToken: newAccessToken, refreshToken: newRefreshToken }
}
const logout = async(token)=>{
    await RefreshToken.findOneAndUpdate({ token }, { isRevoked: true })
}

const crypto = require('crypto')
const emailService = require('./emailService')

const forgotPassword = async (email) => {
  const user = await User.findOne({ email })
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 })
  }

  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  
  // Lưu OTP vào database (tồn tại trong 5 phút)
  user.resetPasswordOtp = otp
  user.resetPasswordExpires = Date.now() + 5 * 60 * 1000
  await user.save()

  // Gửi email
  await emailService.sendOtpEmail(user.email, otp)
}

const verifyOtp = async (email, otp) => {
  const user = await User.findOne({ email })
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 })
  }
  
  if (user.resetPasswordOtp !== otp) {
    throw Object.assign(new Error('Invalid OTP'), { statusCode: 400 })
  }

  if (Date.now() > user.resetPasswordExpires) {
    throw Object.assign(new Error('OTP has expired'), { statusCode: 400 })
  }

  return true
}

const resetPassword = async (email, otp, newPassword) => {
  const user = await User.findOne({ email })
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 })
  }
  
  if (user.resetPasswordOtp !== otp || Date.now() > user.resetPasswordExpires) {
    throw Object.assign(new Error('Invalid or expired OTP'), { statusCode: 400 })
  }

  const salt = await bcrypt.genSalt(10)
  user.password = await bcrypt.hash(newPassword, salt)
  
  // Xóa OTP
  user.resetPasswordOtp = undefined
  user.resetPasswordExpires = undefined
  await user.save()

  // Thu hồi tất cả refresh token cũ của user (đăng xuất tất cả thiết bị)
  await RefreshToken.updateMany({ user: user._id }, { isRevoked: true })
}

const changePasswordWithOtp = async (userId, otp, newPassword) => {
  const user = await User.findById(userId)
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 })
  }
  
  if (user.resetPasswordOtp !== otp || Date.now() > user.resetPasswordExpires) {
    throw Object.assign(new Error('Invalid or expired OTP'), { statusCode: 400 })
  }

  const salt = await bcrypt.genSalt(10)
  user.password = await bcrypt.hash(newPassword, salt)
  
  // Xóa OTP
  user.resetPasswordOtp = undefined
  user.resetPasswordExpires = undefined
  await user.save()

  // Thu hồi tất cả refresh token cũ của user (đăng xuất tất cả thiết bị)
  await RefreshToken.updateMany({ user: user._id }, { isRevoked: true })
}

const requestChangePasswordOtp = async (userId, oldPassword) => {
  const user = await User.findById(userId).select('+password')
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 })
  }

  const isMatch = await user.comparePassword(oldPassword)
  if (!isMatch) {
    throw Object.assign(new Error('Mật khẩu cũ không chính xác'), { statusCode: 400 })
  }

  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  user.resetPasswordOtp = otp
  user.resetPasswordExpires = Date.now() + 5 * 60 * 1000
  await user.save()

  // Gửi email
  await emailService.sendOtpEmail(user.email, otp)
}

const updateProfile = async (userId, { name, phone }) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { name, phone },
    { new: true, runValidators: true }
  )
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 })
  }
  return { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone }
}

module.exports = { register, login, refresh, logout, forgotPassword, verifyOtp, resetPassword, changePasswordWithOtp, updateProfile, requestChangePasswordOtp }