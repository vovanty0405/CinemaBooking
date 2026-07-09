const express = require('express')
const router = express.Router()

const {createCinema, getCinemas, getCinemaById, createRoom, getRooms, getSeats, updateCinema, deleteCinema, updateRoom, deleteRoom} = require('../controllers/cinemaController')

const {authenticate, authorize} = require('../middlewares/authMiddleware')

router.get('/', getCinemas)
router.post('/', authenticate, authorize('admin'), createCinema)

// Rooms routes must be before /:id to avoid `:id` capturing 'rooms'
router.get('/rooms/:roomId/seats', getSeats)
router.patch('/rooms/:roomId', authenticate, authorize('admin'), updateRoom)
router.delete('/rooms/:roomId', authenticate, authorize('admin'), deleteRoom)

// Cinema dynamic routes
router.get('/:id', getCinemaById)
router.get('/:cinemaId/rooms', getRooms)
router.post('/:cinemaId/rooms', authenticate, authorize('admin'), createRoom)
router.patch('/:id', authenticate, authorize('admin'), updateCinema)
router.delete('/:id', authenticate, authorize('admin'), deleteCinema)

module.exports = router