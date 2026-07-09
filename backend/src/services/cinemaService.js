const Cinema = require('../models/Cinema')
const Room = require('../models/Room')
const Seat = require('../models/Seat')

// ── Cinema ──────────────────────────────────────────
const createCinema = async (data) => Cinema.create(data)

const getCinemas = async ({ city } = {}) => {
  const query = { isActive: true }
  if (city) query.city = city
  return Cinema.find(query).sort({ name: 1 })
}

const getCinemaById = async (id) => {
  const cinema = await Cinema.findById(id)
  if (!cinema) throw Object.assign(new Error('Cinema not found'), { statusCode: 404 })
  return cinema
}

// ── Room ────────────────────────────────────────────
const createRoom = async (cinemaId, data) => {
  await getCinemaById(cinemaId) // validate cinema tồn tại

  const room = await Room.create({ ...data, cinema: cinemaId })

  // Tự động tạo ghế cho phòng
  await generateSeats(room)

  return room
}

// Hàm tạo ghế tự động theo rows x seatsPerRow
const generateSeats = async (room) => {
  const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const seats = []

  for (let r = 0; r < room.rows; r++) {
    for (let s = 1; s <= room.seatsPerRow; s++) {
      seats.push({
        room: room._id,
        row: rowLabels[r],
        number: s,
        // Hàng cuối cùng là VIP
        type: r === room.rows - 1 ? 'vip' : 'standard',
      })
    }
  }

  await Seat.insertMany(seats)
  console.log(`Generated ${seats.length} seats for room ${room.name}`)
}

const getRoomsByCinema = async (cinemaId) => {
  return Room.find({ cinema: cinemaId, isActive: true })
}

const getSeatsByRoom = async (roomId) => {
  return Seat.find({ room: roomId, status: { $ne: 'inactive' } }).sort({ row: 1, number: 1 })
}

module.exports = {
  createCinema, getCinemas, getCinemaById,
  createRoom, getRoomsByCinema, getSeatsByRoom,
}