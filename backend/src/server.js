require('dotenv').config({ override: true })
const http = require('http')
const app = require('./app')
const connectDB = require('./config/db')
const { initSocket } = require('./sockets')
const { initLimiters } = require('./middlewares/rateLimiter')
const { startExpireJob } = require('./jobs/expireBookings.job')

const PORT = process.env.PORT || 3000

// 9704198526191432198
// NGUYEN VAN A
// 07/15

const start = async () => {
  await connectDB()

  // Chờ Redis thử kết nối (tối đa 2s) rồi mới init limiters nếu Redis được bật
  if (process.env.USE_REDIS !== 'false') {
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
  initLimiters()
  // Tạo HTTP server từ Express app
  const httpServer = http.createServer(app)

  // Attach Socket.IO vào HTTP server
  initSocket(httpServer)
  startExpireJob() // thêm dòng này

  // Dùng httpServer.listen thay vì app.listen
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Socket.IO ready`)
  })
}

start()