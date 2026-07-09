require('dotenv').config({ override: true })
const mongoose = require('mongoose')
const connectDB = require('../config/db')
const Coupon = require('../models/Coupon')

const find = async () => {
  await connectDB()
  const coupons = await Coupon.find({})
  console.log('Coupons:', JSON.stringify(coupons, null, 2))
  mongoose.connection.close()
}
find()
