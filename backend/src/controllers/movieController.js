const movieService = require('../services/movieService')


const create = async(req, res, next) =>{
    try {
        const movie = await movieService.createMovie(req.body)
        res.status(201).json({ message: 'Movie created', data: movie })
    } catch (error) {
        next(error)
    }
}
const getAll = async (req, res, next) => {
  try {
    const result = await movieService.getMovies(req.query)
    res.json({ data: result })
  } catch (err) { next(err) }
}
const getOne = async (req, res, next) => {
  try {
    const movie = await movieService.getMovieById(req.params.id)
    res.json({ data: movie })
  } catch (err) { next(err) }
}

const update = async (req, res, next) => {
  try {
    const movie = await movieService.updateMovie(req.params.id, req.body)
    res.json({ message: 'Movie updated', data: movie })
  } catch (err) { next(err) }
}

const remove = async (req, res, next) => {
  try {
    await movieService.deleteMovie(req.params.id)
    res.json({ message: 'Movie deleted' })
  } catch (err) { next(err) }
}
module.exports = { create, getAll, getOne, update, remove }