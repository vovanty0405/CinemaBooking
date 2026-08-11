const Booking = require('../models/Booking')
const Showtime = require('../models/Showtime')

async function checkCanReview(req, res, next) {
  try {
    const { movieId } = req.body
    const userId = req.user.id // req.user.id is set in authMiddleware

    // Find all showtimes for this movie
    const showtimes = await Showtime.find({ movie: movieId }).distinct('_id')

    // Check if there is any confirmed booking for this user and these showtimes
    const hasBooked = await Booking.exists({
      user: userId,
      status: 'confirmed',
      showtime: { $in: showtimes }
    })

    if (!hasBooked) {
      return res.status(403).json({ message: 'Bạn cần mua vé xem phim này trước khi có thể đánh giá.' })
    }

    next()
  } catch (error) {
    next(error)
  }
}

module.exports = checkCanReview
