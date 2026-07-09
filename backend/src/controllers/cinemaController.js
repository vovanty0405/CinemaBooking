const cinemaService = require('../services/cinemaService')
const Cinema = require('../models/Cinema')
const Room = require('../models/Room')
const Seat = require('../models/Seat')


const createCinema = async (req, res, next) => {
  try {
    const cinema = await cinemaService.createCinema(req.body)
    res.status(201).json({ message: 'Cinema created', data: cinema })
  } catch (err) { next(err) }
}

const getCinemas = async (req, res, next) => {
  try {
    const cinemas = await cinemaService.getCinemas(req.query)
    res.json({ data: cinemas })
  } catch (err) { next(err) }
}

const getCinemaById = async (req, res, next) => {
  try {
    const cinema = await cinemaService.getCinemaById(req.params.id)
    res.json({ data: cinema })
  } catch (err) { next(err) }
}

const createRoom = async (req, res, next) => {
  try {
    const room = await cinemaService.createRoom(req.params.cinemaId, req.body)
    res.status(201).json({ message: 'Room created with seats', data: room })
  } catch (err) { next(err) }
}

const getRooms = async (req, res, next) => {
  try {
    const rooms = await cinemaService.getRoomsByCinema(req.params.cinemaId)
    res.json({ data: rooms })
  } catch (err) { next(err) }
}

const getSeats = async (req, res, next) => {
  try {
    const seats = await cinemaService.getSeatsByRoom(req.params.roomId)
    res.json({ data: seats })
  } catch (err) { next(err) }
}

const updateCinema = async (req, res, next) => {
  try {
    const { name, address, city, phone } = req.body
    const updates = {}
    if (name !== undefined) updates.name = name
    if (address !== undefined) updates.address = address
    if (city !== undefined) updates.city = city
    if (phone !== undefined) updates.phone = phone

    const cinema = await Cinema.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    if (!cinema) return res.status(404).json({ message: 'Cinema not found' })
    res.json({ message: 'Cinema updated', data: cinema })
  } catch (err) { next(err) }
}

const deleteCinema = async (req, res, next) => {
  try {
    const cinema = await Cinema.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })
    if (!cinema) return res.status(404).json({ message: 'Cinema not found' })
    res.json({ message: 'Cinema deleted' })
  } catch (err) { next(err) }
}

const updateRoom = async (req, res, next) => {
  try {
    const { name, type } = req.body
    const updates = {}
    if (name !== undefined) updates.name = name
    if (type !== undefined) updates.type = type

    const room = await Room.findByIdAndUpdate(req.params.roomId, updates, { new: true, runValidators: true })
    if (!room) return res.status(404).json({ message: 'Room not found' })
    res.json({ message: 'Room updated', data: room })
  } catch (err) { next(err) }
}

const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.roomId, { isActive: false }, { new: true })
    if (!room) return res.status(404).json({ message: 'Room not found' })
    await Seat.updateMany({ room: room._id }, { isActive: false })
    res.json({ message: 'Room deleted' })
  } catch (err) { next(err) }
}

module.exports = { createCinema, getCinemas, getCinemaById, createRoom, getRooms, getSeats, updateCinema, deleteCinema, updateRoom, deleteRoom }