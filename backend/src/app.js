const express = require("express")
const cors = require('cors');
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const swaggerUi = require('swagger-ui-express')
const swaggerSpec = require('./config/swagger')
const logger = require('./config/logger')
const {loginLimiter , apiLimiter } = require('./middlewares/rateLimiter')
const errorHandler = require('./middlewares/errorHandler')
const authRoutes = require('./routes/authRoute')
const movieRoutes = require('./routes/movieRoute')
const cinemaRoutes = require('./routes/cinemaRoute')
const showtimeRoutes = require('./routes/showtimeRoute')
const bookingRoutes = require('./routes/bookingRoute')
const paymentRoutes = require('./routes/paymentRoute')
const userRoutes = require('./routes/userRoute')
const seatRoutes = require('./routes/seatRoutes')
const promotionRoutes = require('./routes/promotionRoutes')
const analyticsRoutes = require('./routes/analyticsRoute')
const uploadRoutes = require('./routes/uploadRoute')
const path = require('path')


const app = express()

app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))

// Cấu hình Morgan ghi log HTTP request qua Winston thay vì in ra console
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }))

app.use(cookieParser())
app.use(express.json())
app.use(apiLimiter)
app.use(express.urlencoded({ extended: true }));

// Swagger UI Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/api/auth', authRoutes)
app.use('/api/movies', movieRoutes)
app.use('/api/cinemas', cinemaRoutes)
app.use('/api/showtimes', showtimeRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/users', userRoutes)
app.use('/api/seats', seatRoutes)
app.use('/api/promotions', promotionRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')))


app.get('/', (req, res) =>{
    res.send('Chat API is running.........');
})

app.use(errorHandler)

module.exports = app;