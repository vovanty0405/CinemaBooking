const authService = require('../services/authService')
const ms = require('ms')
const emailService = require('../services/emailService')

const register = async(req, res, next)=>{
    try {
        const {name, email, password} = req.body
        const user = await authService.register({name, email, password})
        
        // Gửi email không dùng await để tránh block request
        emailService.sendWelcomeEmail(user.email, user.name).catch(err => console.error("Welcome email failed", err))
        
        res.status(201).json({ message: 'Đã đăng ký thành công!', data: user })
    } catch (error) {
        next(error)
    }
}
const login = async(req, res, next)=>{
    try {
    const result = await authService.login(req.body)
    
    // Lưu refreshToken vào cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: ms(process.env.JWT_REFRESH_EXPIRES)
    })

    res.json({ 
      message: 'Login successful', 
      data: {
        accessToken: result.accessToken,
        user: result.user
      } 
    })
  } catch (error) {
    next(error)
  }
}
const refresh = async (req, res, next) => {
  try {
    // Đọc refreshToken từ cookies trước, fallback về body
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' })
    const tokens = await authService.refresh(refreshToken)
    
    // Lưu và ghi đè refreshToken mới vào cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: ms(process.env.JWT_REFRESH_EXPIRES)
    })

    res.json({ data: { accessToken: tokens.accessToken } })
  } catch (error) {
    next(error)
  }
}

const logout = async (req, res, next) => {
  try {
    // Đọc refreshToken từ cookies trước, fallback về body
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken
    if (refreshToken) {
      await authService.logout(refreshToken)
    }
    
    // Xóa cookie refreshToken
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })

    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    next(error)
  }
}

const getMe = async (req, res) => {
  const user = { ...req.user }
  
  // Format iat và exp thành định dạng ngày giờ dễ đọc hơn
  if (user.iat) {
    user.issuedAt = new Date(user.iat * 1000).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  }
  if (user.exp) {
    user.expiresAt = new Date(user.exp * 1000).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  }

  res.json({ data: user })
}

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    await authService.forgotPassword(email)
    res.json({ message: 'OTP sent to email successfully' })
  } catch (error) {
    next(error)
  }
}

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body
    await authService.verifyOtp(email, otp)
    res.json({ message: 'OTP verified successfully' })
  } catch (error) {
    next(error)
  }
}

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body
    await authService.resetPassword(email, otp, newPassword)
    res.json({ message: 'Password reset successfully' })
  } catch (error) {
    next(error)
  }
}

const requestChangePasswordOtp = async (req, res, next) => {
  try {
    // req.user được gán từ authMiddleware
    await authService.forgotPassword(req.user.email) // Dùng chung hàm sinh OTP
    res.json({ message: 'OTP sent to your email successfully' })
  } catch (error) {
    next(error)
  }
}

const changePassword = async (req, res, next) => {
  try {
    const { otp, newPassword } = req.body
    await authService.changePasswordWithOtp(req.user.id, otp, newPassword)
    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    next(error)
  }
}

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body
    const user = await authService.updateProfile(req.user.id, { name, phone })
    res.json({ message: 'Profile updated successfully', data: user })
  } catch (error) {
    next(error)
  }
}

module.exports = { register, login, refresh, logout, getMe, forgotPassword, verifyOtp, resetPassword, requestChangePasswordOtp, changePassword, updateProfile }