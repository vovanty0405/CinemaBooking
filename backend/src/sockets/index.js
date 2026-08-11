const { Server } = require('socket.io')
const { verifyAccessToken } = require('../untils/jwt')

let io = null

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  // Middleware xác thực JWT khi connect
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1]

      if (token) {
        const decoded = verifyAccessToken(token)
        socket.user = decoded // { id, email, role }
      }
      // Cho phép connect không có token (guest xem sơ đồ ghế)
      next()
    } catch (err) {
      // Token hết hạn hoặc invalid → vẫn connect được nhưng không có user
      next()
    }
  })


  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} | user: ${socket.user?.email || 'guest'}`)

    socket.on('join_user_room', () => {
    if (!socket.user) return
    socket.join(`user_${socket.user.id}`)
    console.log(`${socket.id} joined user room: user_${socket.user.id}`)
    })

    // Client vào trang xem ghế của 1 suất chiếu
    socket.on('join_showtime', async (showtimeId) => {
      if (!showtimeId) return

      const room = `showtime_${showtimeId}`
      socket.join(room)
      socket.currentShowtime = showtimeId

      console.log(`${socket.id} joined room: ${room}`)

      // Gửi ngay sơ đồ ghế hiện tại cho client vừa vào
      try {
        const bookingService = require('../services/bookingService')
        const seatMap = await bookingService.getSeatMap(showtimeId)
        socket.emit('seat_map_updated', { showtimeId, seats: seatMap })
      } catch (err) {
        socket.emit('error', { message: 'Cannot load seat map' })
      }
    })

    // Client rời khỏi trang
    socket.on('leave_showtime', (showtimeId) => {
      const room = `showtime_${showtimeId}`
      socket.leave(room)
      socket.currentShowtime = null
      console.log(`${socket.id} left room: ${room}`)
    })

    socket.on('join_movie_room', (movieId) => {
      socket.join(`movie:${movieId}`)
      console.log(`${socket.id} joined movie room: movie:${movieId}`)
    })

    socket.on('leave_movie_room', (movieId) => {
      socket.leave(`movie:${movieId}`)
      console.log(`${socket.id} left movie room: movie:${movieId}`)
    })

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} | reason: ${reason}`)
    })
  })

  return io
}

// Hàm emit sự kiện từ bất kỳ module nào (booking, payment...)
const emitToShowtime = (showtimeId, event, data) => {
  if (!io) return
  io.to(`showtime_${showtimeId}`).emit(event, data)
}
// Gọi hàm này sau khi tạo booking thành công
const emitBookingCountdown = (userId, bookingId, expiresAt) => {
    if (!io) return

    const msLeft = new Date(expiresAt) - Date.now()
    if (msLeft <= 0) return

    // Emit vào room riêng của user: user_{userId}
    io.to(`user_${userId}`).emit('booking_countdown', {
        bookingId,
        expiresAt,
        msLeft,
    })
}

const emitToMovie = (movieId, event, data) => {
    if (!io) return
    io.to(`movie:${movieId}`).emit(event, data)
}

const getIO = () => io

module.exports = { initSocket, emitToShowtime, emitBookingCountdown, emitToMovie, getIO }