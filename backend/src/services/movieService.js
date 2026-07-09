const Movie  = require('../models/Movies')

const createMovie = async(data) => Movie.create(data)

const getMovies = async({page = 1, limit = 10, genre , search, status, isActive = true}) =>{
    const query = {isActive}
    if(genre) query.genre = genre
    if(status) query.status = status
    if(search) query.$text = {$search: search}
    const skip = (page - 1 ) * limit 
    const [movies, total] = await Promise.all([
        Movie.find(query).sort({releaseDate: -1}).skip(skip).limit(limit),
        Movie.countDocuments(query),
    ])
    return {
    movies,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}
const getMovieById = async (id) => {
  const movie = await Movie.findById(id)
  if (!movie) throw Object.assign(new Error('Movie not found'), { statusCode: 404 })
  return movie
}
const updateMovie = async(id, data) =>{
    const movie = await Movie.findByIdAndUpdate(id, data, {new: true, runValidators: true})
    if (!movie) throw Object.assign(new Error('Movie not found'), { statusCode: 404 })
    return movie
}
const deleteMovie = async (id) => {
  // Soft delete
  const movie = await Movie.findByIdAndUpdate(id, { isActive: false }, { new: true })
  if (!movie) throw Object.assign(new Error('Movie not found'), { statusCode: 404 })
  return movie
}

module.exports = { createMovie, getMovies, getMovieById, updateMovie, deleteMovie }

