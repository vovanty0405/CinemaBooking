const showtimeService = require('../services/showTimeService')

const create = async (req, res, next) => {
  try {
    const showtime = await showtimeService.createShowtime(req.body)
    res.status(201).json({ message: 'Showtime created', data: showtime })
  } catch (err) { next(err) }
}

const getAll = async (req, res, next) => {
  try {
    const result = await showtimeService.getShowtimes(req.query)
    res.json({ data: result })
  } catch (err) { next(err) }
}

const getOne = async (req, res, next) => {
  try {
    const showtime = await showtimeService.getShowtimeById(req.params.id)
    res.json({ data: showtime })
  } catch (err) { next(err) }
}

const cancel = async (req, res, next) => {
  try {
    const showtime = await showtimeService.cancelShowtime(req.params.id)
    res.json({ message: 'Showtime cancelled', data: showtime })
  } catch (err) { next(err) }
}

const update = async (req, res, next) => {
  try {
    const showtime = await showtimeService.updateShowtime(req.params.id, req.body)
    res.json({ message: 'Showtime updated', data: showtime })
  } catch (err) { next(err) }
}

module.exports = { create, getAll, getOne, update, cancel }