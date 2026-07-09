const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/bookingController')
const { authenticate } = require('../middlewares/authMiddleware')

// Sơ đồ ghế — public (user cần xem trước khi đăng nhập)
router.get('/seat-map/:showtimeId', ctrl.getSeatMap)

// Các route cần auth
router.use(authenticate)

const validate = require('../middlewares/validate')
const { createBookingSchema } = require('../validations/booking.schema')

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               showtimeId:
 *                 type: string
 *               seatIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 */
router.post('/', validate(createBookingSchema), ctrl.create)

/**
 * @swagger
 * /api/bookings/my:
 *   get:
 *     summary: Get my bookings
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user bookings
 */
router.get('/my', ctrl.getMyBookings)
router.get('/:id', ctrl.getOne)
// router.patch('/:id/confirm', ctrl.confirm) // Đóng route này lại vì VNPay IPN sẽ tự động gọi hàm confirm
router.patch('/:id/cancel', ctrl.cancel)

module.exports = router