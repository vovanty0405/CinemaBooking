const Showtime = require('../models/Showtime')
const Movie = require('../models/Movies')
const Room = require('../models/Room')

const createShowtime = async (data) => {
  const { movieId, roomId, startTime, basePrice } = data

  // Lấy thông tin phim để tính endTime
  const movie = await Movie.findById(movieId)
  if (!movie) throw Object.assign(new Error('Movie not found'), { statusCode: 404 })

  const room = await Room.findById(roomId)
  if (!room) throw Object.assign(new Error('Room not found'), { statusCode: 404 })

  const start = new Date(startTime)
  // +15 phút dọn phòng giữa các suất
  const end = new Date(start.getTime() + (movie.duration + 15) * 60 * 1000)

  // Kiểm tra phòng có bị trùng lịch không
  const conflict = await Showtime.findOne({
    room: roomId,
    status: { $nin: ['cancelled'] },
    $or: [
      { startTime: { $lt: end }, endTime: { $gt: start } },
    ],
  })

  if (conflict) {
    throw Object.assign(
      new Error(`Room is already booked from ${conflict.startTime} to ${conflict.endTime}`),
      { statusCode: 409 }
    )
  }

  return Showtime.create({
    movie: movieId,
    room: roomId,
    startTime: start,
    endTime: end,
    basePrice,
  })
}

const getShowtimes = async ({ movieId, cinemaId, date, movieTitle, page = 1, limit = 20 }) => {
  const query = { status: { $ne: 'cancelled' } }

  if (movieId) query.movie = movieId

  // Lọc theo tên phim
  if (movieTitle) {
    const movies = await Movie.find({ title: { $regex: movieTitle, $options: 'i' } })
    const movieIds = movies.map(m => m._id)
    query.movie = { $in: movieIds }
  }

  // Lọc theo ngày
  if (date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    query.startTime = { $gte: startOfDay, $lte: endOfDay }
  }

  let showtimeQuery = Showtime.find(query)
    .populate('movie', 'title duration posterUrl rating')
    .populate({ path: 'room', populate: { path: 'cinema', select: 'name address city' } })
    .sort({ startTime: 1 })

  if (cinemaId) {
    // Filter sau populate
    const all = await showtimeQuery
    const filtered = all.filter(s => s.room?.cinema?._id?.toString() === cinemaId)
    const skip = (page - 1) * limit
    return {
      showtimes: filtered.slice(skip, skip + limit),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit)
      }
    }
  }

  const skip = (page - 1) * limit
  const [showtimes, total] = await Promise.all([
    showtimeQuery.skip(skip).limit(limit),
    Showtime.countDocuments(query),
  ])

  return { showtimes, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

const getShowtimeById = async (id) => {
  const showtime = await Showtime.findById(id)
    .populate('movie', 'title duration posterUrl rating description')
    .populate({ path: 'room', populate: { path: 'cinema', select: 'name address city' } })

  if (!showtime) throw Object.assign(new Error('Showtime not found'), { statusCode: 404 })
  return showtime
}

const updateShowtime = async (id, data) => {
  const showtime = await Showtime.findById(id)
  if (!showtime) throw Object.assign(new Error('Showtime not found'), { statusCode: 404 })

  const { movieId, roomId, startTime, basePrice, status } = data

  let movie = null
  if (movieId) {
    movie = await Movie.findById(movieId)
    if (!movie) throw Object.assign(new Error('Movie not found'), { statusCode: 404 })
    showtime.movie = movieId
  } else {
    movie = await Movie.findById(showtime.movie)
  }

  let finalRoomId = roomId || showtime.room
  let finalStartTime = startTime ? new Date(startTime) : showtime.startTime

  if (roomId) {
    const room = await Room.findById(roomId)
    if (!room) throw Object.assign(new Error('Room not found'), { statusCode: 404 })
    showtime.room = roomId
  }

  if (startTime || roomId) {
    const duration = movie ? movie.duration : 120
    const end = new Date(finalStartTime.getTime() + (duration + 15) * 60 * 1000)

    const conflict = await Showtime.findOne({
      _id: { $ne: id },
      room: finalRoomId,
      status: { $nin: ['cancelled'] },
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: finalStartTime } },
      ],
    })

    if (conflict) {
      throw Object.assign(
        new Error(`Phòng chiếu đã có lịch chiếu từ ${conflict.startTime} đến ${conflict.endTime}`),
        { statusCode: 409 }
      )
    }

    showtime.startTime = finalStartTime
    showtime.endTime = end
  }

  if (basePrice !== undefined) showtime.basePrice = basePrice
  if (status !== undefined) showtime.status = status

  return showtime.save()
}

const cancelShowtime = async (id) => {
  const showtime = await Showtime.findByIdAndUpdate(
    id,
    { status: 'cancelled' },
    { new: true }
  )
  if (!showtime) throw Object.assign(new Error('Showtime not found'), { statusCode: 404 })
  return showtime
}

module.exports = { createShowtime, getShowtimes, getShowtimeById, updateShowtime, cancelShowtime }