const nodemailer = require('nodemailer')
const logger = require('../config/logger')

// Khởi tạo transporter (Cấu hình gửi mail)
// Ở đây dùng cấu hình Gmail (Yêu cầu tài khoản có App Password). 
// Nếu không có, ta dùng tài khoản test của Ethereal
const createTransporter = async () => {
  // Nếu có cấu hình SMTP thật trong .env
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  // Tự động tạo tài khoản test Ethereal nếu không cấu hình SMTP
  logger.info('Using Ethereal Email for testing...')
  const testAccount = await nodemailer.createTestAccount()
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  })
}

/**
 * Hàm gửi mã OTP
 */
const sendOtpEmail = async (toEmail, otpCode) => {
  try {
    const transporter = await createTransporter()
    
    const mailOptions = {
      from: '"Cinema Booking System" <no-reply@cinema-booking.com>',
      to: toEmail,
      subject: 'Mã xác thực Khôi phục Mật khẩu (OTP)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #d32f2f; text-align: center;">Khôi phục mật khẩu</h2>
          <p>Xin chào,</p>
          <p>Bạn vừa yêu cầu khôi phục mật khẩu. Dưới đây là mã xác thực OTP của bạn:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; background: #f4f4f4; padding: 10px 20px; border-radius: 4px; letter-spacing: 5px;">${otpCode}</span>
          </div>
          <p style="color: #666; font-size: 14px;">Mã này sẽ hết hạn trong 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.</p>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    
    // Nêú dùng Ethereal, log link xem preview email ra console
    if (info.messageId && !process.env.SMTP_USER) {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`)
    }
    
    return true
  } catch (error) {
    logger.error('Error sending OTP Email:', error)
    throw new Error('Could not send email')
  }
}

const sendWelcomeEmail = async (toEmail, userName) => {
  try {
    const transporter = await createTransporter()
    
    const mailOptions = {
      from: '"CineBooking" <' + (process.env.SMTP_FROM || 'no-reply@cinebooking.com') + '>',
      to: toEmail,
      subject: 'Chào mừng bạn đến với CineBooking 🎬',
      html: `
      <div style="background:#141414;padding:40px 0;font-family:Arial,sans-serif;">
        <div style="max-width:480px;margin:0 auto;background:#1F1F1F;border-radius:12px;overflow:hidden;">
          <div style="padding:24px;text-align:center;">
            <h1 style="color:#E50914;margin:0;">CineBooking</h1>
          </div>
          <div style="padding:0 32px 32px;color:#FFFFFF;">
            <h2 style="color:#FFFFFF;">Chào mừng ${userName}!</h2>
            <p style="color:#B3B3B3;line-height:1.6;">
              Tài khoản của bạn tại CineBooking đã được tạo thành công. Giờ đây bạn có thể đặt vé xem phim,
              nhận ưu đãi độc quyền và theo dõi lịch sử vé đã mua chỉ trong vài bước.
            </p>
            <div style="text-align:center;margin-top:24px;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/movies"
                 style="background:#E50914;color:#FFFFFF;padding:12px 28px;border-radius:24px;
                        text-decoration:none;font-weight:bold;display:inline-block;">
                Khám phá phim ngay
              </a>
            </div>
          </div>
        </div>
      </div>`,
    }

    const info = await transporter.sendMail(mailOptions)
    
    if (info.messageId && !process.env.SMTP_USER) {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`)
    }
    
    return true
  } catch (error) {
    logger.error('Error sending Welcome Email:', error.message)
    // Don't throw error to prevent blocking user registration
  }
}

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail
}
