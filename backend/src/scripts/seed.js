require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('../models/Users')
const Movie = require('../models/Movies')
const Cinema = require('../models/Cinema')
const Room = require('../models/Room')
const Seat = require('../models/Seat')
const Showtime = require('../models/Showtime')
const Booking = require('../models/Booking')

const generateRandomDates = (start, end, count) => {
  const dates = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    dates.push(d);
  }
  return dates.sort((a, b) => a - b);
}

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB for Seeding')

  // Chỉ xóa các Showtimes, Bookings cũ để tránh trùng lặp khi chạy seed lại
  // HOÀN TOÀN GIỮ NGUYÊN Users, Movies, Cinemas, Rooms, Seats cũ!
  await Promise.all([
    Showtime.deleteMany({}),
    Booking.deleteMany({}),
  ])
  console.log('Cleared existing Showtimes and Bookings')

  // 1. Tạo Users mẫu nếu chưa có
  const salt = await bcrypt.genSalt(10)
  const password = await bcrypt.hash('123456', salt)
  
  let admin = await User.findOne({ email: 'admin@cinebooking.com' })
  if (!admin) {
    admin = await User.create({ name: 'Admin Cine', email: 'admin@cinebooking.com', password, role: 'admin', isActive: true })
  }
  let normalUser = await User.findOne({ email: 'user@cinebooking.com' })
  if (!normalUser) {
    normalUser = await User.create({ name: 'Nguyen Van A', email: 'user@cinebooking.com', password, role: 'user', isActive: true })
  }
  console.log('Users ready')

  // 2. Tạo/Cập nhật Movies (Dùng tên để tìm kiếm, nếu có rồi sẽ giữ lại)
  const moviesData = [
    { title: 'Mai', description: 'Phim Tết 2024 của Trấn Thành', duration: 120, genre: ['drama', 'romance'], releaseDate: new Date('2024-02-10'), rating: 'C18', format: '2D', status: 'now_showing', isFeatured: true, posterUrl: 'https://via.placeholder.com/300x450', trailerUrl: 'https://youtube.com' },
    { title: 'Dune: Part Two', description: 'Hành tinh cát phần 2', duration: 166, genre: ['action', 'sci-fi'], releaseDate: new Date('2024-03-01'), rating: 'C13', format: 'IMAX', status: 'now_showing', isFeatured: true, posterUrl: 'https://via.placeholder.com/300x450', trailerUrl: 'https://youtube.com' },
    { title: 'Godzilla x Kong', description: 'Đế chế mới hoành tráng', duration: 115, genre: ['action'], releaseDate: new Date('2024-03-29'), rating: 'C13', format: '3D', status: 'now_showing', isFeatured: false, posterUrl: 'https://via.placeholder.com/300x450', trailerUrl: 'https://youtube.com' },
    { title: 'Kung Fu Panda 4', description: 'Po đối đầu với Tắc Kè Bông', duration: 94, genre: ['animation', 'comedy'], releaseDate: new Date('2024-03-08'), rating: 'P', format: '2D', status: 'now_showing', isFeatured: false, posterUrl: 'https://via.placeholder.com/300x450', trailerUrl: 'https://youtube.com' },
    { title: 'Exhuma: Quật Mộ Trùng Ma', description: 'Phim kinh dị Hàn Quốc gây bão', duration: 134, genre: ['horror', 'thriller'], releaseDate: new Date('2024-03-15'), rating: 'C18', format: '2D', status: 'now_showing', isFeatured: false, posterUrl: 'https://via.placeholder.com/300x450', trailerUrl: 'https://youtube.com' },
    // Các phim sắp chiếu để test mục sắp chiếu
    { title: 'Deadpool & Wolverine', description: 'Siêu phẩm Marvel tiếp theo', duration: 127, genre: ['action', 'comedy', 'sci-fi'], releaseDate: new Date('2024-07-26'), rating: 'C18', format: '2D', status: 'coming_soon', isFeatured: true, posterUrl: 'https://via.placeholder.com/300x450', trailerUrl: 'https://youtube.com' },
    { title: 'Despicable Me 4', description: 'Kẻ Trộm Mặt Trăng phần 4', duration: 95, genre: ['animation', 'comedy'], releaseDate: new Date('2024-07-03'), rating: 'P', format: '2D', status: 'coming_soon', isFeatured: false, posterUrl: 'https://via.placeholder.com/300x450', trailerUrl: 'https://youtube.com' },
    { title: 'Inside Out 2', description: 'Những mảnh ghép cảm xúc phần 2', duration: 100, genre: ['animation'], releaseDate: new Date('2024-06-14'), rating: 'P', format: '3D', status: 'coming_soon', isFeatured: false, posterUrl: 'https://via.placeholder.com/300x450', trailerUrl: 'https://youtube.com' },
  ]

  const movies = []
  for (const mData of moviesData) {
    let m = await Movie.findOne({ title: mData.title })
    if (!m) {
      m = await Movie.create(mData)
    } else {
      // Cập nhật status và isFeatured để đảm bảo khớp trang chủ, giữ nguyên posterUrl cũ của user
      m.status = mData.status
      m.isFeatured = mData.isFeatured
      await m.save()
    }
    movies.push(m)
  }
  
  // Lấy thêm tất cả các phim do user tạo trước đây để cùng tham gia làm showtimes/bookings
  const allMoviesInDb = await Movie.find({ isActive: true })
  console.log(`Movies ready: ${allMoviesInDb.length} movies in database`)

  // 3. Tạo/Cập nhật Cinemas
  const cinemasData = [
    { name: 'CineBooking Vincom', address: 'Q1, TP.HCM', city: 'Ho Chi Minh', phone: '19001111' },
    { name: 'CineBooking Lotte', address: 'Q7, TP.HCM', city: 'Ho Chi Minh', phone: '19002222' }
  ]
  const cinemas = []
  for (const cData of cinemasData) {
    let c = await Cinema.findOne({ name: cData.name })
    if (!c) {
      c = await Cinema.create(cData)
    }
    cinemas.push(c)
  }

  // 4. Tạo/Cập nhật Rooms & Seats (Chỉ tạo phòng mới nếu chưa có, giữ nguyên phòng cũ)
  const roomsData = [
    { cinema: cinemas[0]._id, name: 'Room 1', type: 'standard', rows: 10, seatsPerRow: 12 },
    { cinema: cinemas[0]._id, name: 'IMAX 1', type: 'imax', rows: 12, seatsPerRow: 15 },
    { cinema: cinemas[1]._id, name: 'Room 2', type: 'standard', rows: 8, seatsPerRow: 10 },
    { cinema: cinemas[1]._id, name: 'Couple 1', type: 'standard', rows: 5, seatsPerRow: 6 },
  ]
  
  const rooms = []
  for (const rData of roomsData) {
    let r = await Room.findOne({ cinema: rData.cinema, name: rData.name })
    if (!r) {
      r = await Room.create({
        cinema: rData.cinema,
        name: rData.name,
        type: rData.type,
        rows: rData.rows,
        seatsPerRow: rData.seatsPerRow
      })
      // Tự sinh ghế cho phòng mới
      const seatsToInsert = []
      const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
      for (let row = 0; row < r.rows; row++) {
        for (let num = 1; num <= r.seatsPerRow; num++) {
          let type = 'standard'
          let priceMod = 0
          if (row === r.rows - 1) { type = 'couple'; priceMod = 50000; }
          else if (row >= Math.floor(r.rows/2) - 1 && row <= Math.floor(r.rows/2)) { type = 'vip'; priceMod = 20000; }
          
          seatsToInsert.push({
            room: r._id,
            row: rowLetters[row],
            number: num,
            type,
            priceModifier: priceMod,
            active: true
          })
        }
      }
      await Seat.insertMany(seatsToInsert)
    }
    rooms.push(r)
  }
  
  // Lấy toàn bộ danh sách ghế trong DB để phân bổ cho bookings
  const allSeats = await Seat.find({ active: { $ne: false } })
  console.log('Cinemas, Rooms, and Seats checked & ready')

  // 5. Tạo Showtimes trải dài 40 ngày (30 ngày trước, 10 ngày sau)
  const now = new Date()
  const past30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const future10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
  
  const showtimeDates = generateRandomDates(past30Days, future10Days, 120)
  const showtimesToInsert = []
  
  // Lọc chỉ lấy các phim có trạng thái "now_showing" để chiếu
  const showingMoviesInDb = allMoviesInDb.filter(m => m.status === 'now_showing')
  if (showingMoviesInDb.length === 0) {
    console.log('No now_showing movies in DB to schedule showtimes!')
    process.exit(1)
  }

  for (const date of showtimeDates) {
    const hour = Math.floor(Math.random() * 14) + 9 // từ 09:00 đến 22:00
    date.setHours(hour, 0, 0, 0)
    
    const randomMovie = showingMoviesInDb[Math.floor(Math.random() * showingMoviesInDb.length)]
    const randomRoom = rooms[Math.floor(Math.random() * rooms.length)]
    const endTime = new Date(date.getTime() + randomMovie.duration * 60000 + 15 * 60000)
    
    showtimesToInsert.push({
      movie: randomMovie._id,
      room: randomRoom._id,
      startTime: date,
      endTime: endTime,
      basePrice: 90000,
      status: date > now ? 'scheduled' : 'finished'
    })
  }
  
  const showtimes = await Showtime.insertMany(showtimesToInsert)
  console.log(`Created ${showtimes.length} Showtimes`)

  // 6. Tạo Bookings mẫu rải đều (Không sử dụng Mongoose middleware để tránh dính expiresAt TTL)
  const bookingsToInsert = []
  const pastShowtimes = showtimes.filter(s => s.status === 'finished' || s.startTime < now)
  
  for (let i = 0; i < 400; i++) {
    const s = pastShowtimes[Math.floor(Math.random() * pastShowtimes.length)]
    const roomSeats = allSeats.filter(seat => seat.room.toString() === s.room.toString())
    if (roomSeats.length === 0) continue

    const numSeats = Math.floor(Math.random() * 3) + 1 // Đặt 1-3 vé
    const selectedSeats = []
    let totalAmount = 0
    
    for (let j = 0; j < numSeats; j++) {
      const rs = roomSeats[Math.floor(Math.random() * roomSeats.length)]
      let priceMod = 0
      if (rs.type === 'vip') priceMod = 20000
      if (rs.type === 'couple') priceMod = 50000

      selectedSeats.push({
        seat: rs._id,
        row: rs.row,
        number: rs.number,
        type: rs.type,
        price: s.basePrice + priceMod
      })
      totalAmount += s.basePrice + priceMod
    }
    
    const orderDate = new Date(s.startTime.getTime() - Math.random() * 2 * 24 * 60 * 60 * 1000)
    
    bookingsToInsert.push({
      user: normalUser._id,
      showtime: s._id,
      seats: selectedSeats,
      totalAmount: totalAmount,
      status: 'confirmed',
      paymentMethod: 'vnpay',
      paymentStatus: 'paid',
      createdAt: orderDate,
      updatedAt: orderDate
    })
  }

  await Booking.collection.insertMany(bookingsToInsert)
  console.log(`Created ${bookingsToInsert.length} Bookings`)
  
  console.log('Seed completed successfully, preserving existing movie posters!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed Error:', err)
  process.exit(1)
})