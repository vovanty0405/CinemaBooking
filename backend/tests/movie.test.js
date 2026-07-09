const mongoose = require('mongoose')
const request = require('supertest')
const { MongoMemoryServer } = require('mongodb-memory-server')
const app = require('../src/app')
const Movie = require('../src/models/Movies')

let mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()
  await mongoose.connect(uri)
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongoServer) await mongoServer.stop()
})

beforeEach(async () => {
  await Movie.deleteMany({})
  const movies = [
    { title: 'Action Movie 1', duration: 120, genre: ['action'], releaseDate: new Date('2020-01-01'), isActive: true },
    { title: 'Comedy Hit', duration: 90, genre: ['comedy'], releaseDate: new Date('2021-06-01'), isActive: true },
    { title: 'Action Comedy Mix', duration: 100, genre: ['action','comedy'], releaseDate: new Date('2022-03-15'), isActive: true },
    { title: 'Inactive Movie', duration: 80, genre: ['drama'], releaseDate: new Date('2019-05-20'), isActive: false },
  ]
  await Movie.insertMany(movies)
})

test('GET /api/movies returns active movies with pagination', async () => {
  const res = await request(app).get('/api/movies').query({ page: 1, limit: 2 })
  expect(res.status).toBe(200)
  expect(res.body.data).toHaveProperty('movies')
  expect(res.body.data.movies.length).toBe(2)
  expect(res.body.data.pagination).toMatchObject({ page: '1', limit: '2', total: 3 })
})

test('GET /api/movies search by title using text index', async () => {
  const res = await request(app).get('/api/movies').query({ search: 'Comedy' })
  expect(res.status).toBe(200)
  const titles = res.body.data.movies.map(m => m.title)
  expect(titles.some(t => t.includes('Comedy'))).toBe(true)
})

test('GET /api/movies filter by genre', async () => {
  const res = await request(app).get('/api/movies').query({ genre: 'action' })
  expect(res.status).toBe(200)
  expect(res.body.data.movies.every(m => m.genre.includes('action'))).toBe(true)
})
