const bookingService = require('../services/bookingService')

const create = async (req, res, next) => {
  try {
    const { showtimeId, seatIds, concessions, couponCode } = req.body
    const booking = await bookingService.createBooking(req.user.id, { showtimeId, seatIds, concessions, couponCode })
    res.status(201).json({
      message: 'Seats locked. Please complete payment within 10 minutes.',
      data: booking,
    })
  } catch (err) { next(err) }
}

const confirm = async (req, res, next) => {
  try {
    const booking = await bookingService.confirmBooking(req.params.id, req.user.id)
    res.json({ message: 'Booking confirmed', data: booking })
  } catch (err) { next(err) }
}

const cancel = async (req, res, next) => {
  try {
    const booking = await bookingService.cancelBooking(req.params.id, req.user.id)
    res.json({ message: 'Booking cancelled', data: booking })
  } catch (err) { next(err) }
}

const getSeatMap = async (req, res, next) => {
  try {
    const seats = await bookingService.getSeatMap(req.params.showtimeId)
    res.json({ data: seats })
  } catch (err) { next(err) }
}

const getMyBookings = async (req, res, next) => {
  try {
    const result = await bookingService.getUserBookings(req.user.id, req.query)
    res.json({ data: result })
  } catch (err) { next(err) }
}

const getOne = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id, req.user.id)
    res.json({ data: booking })
  } catch (err) { next(err) }
}

module.exports = { create, confirm, cancel, getSeatMap, getMyBookings, getOne }