require('dotenv').config({ override: true })
const mongoose = require('mongoose')
const connectDB = require('../config/db')
const User = require('../models/Users')

const find = async () => {
  await connectDB()
  const users = await User.find({})
  console.log('Users:', JSON.stringify(users.map(u => ({ email: u.email, role: u.role, name: u.name })), null, 2))
  mongoose.connection.close()
}
find()
