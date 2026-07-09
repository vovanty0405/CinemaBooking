require('dotenv').config({ override: true })
const mongoose = require('mongoose')
const connectDB = require('../config/db')
const Coupon = require('../models/Coupon')
const Combo = require('../models/Combo')

const seed = async () => {
  await connectDB()

  // Clear existing
  await Coupon.deleteMany({})
  await Combo.deleteMany({})

  // Seed coupons
  const now = new Date()
  const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000) // yesterday
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

  const coupons = [
    {
      code: 'GIAM10K',
      name: 'Giảm 10.000đ cho mọi đơn hàng',
      discountType: 'fixed',
      discountValue: 10000,
      minOrderValue: 50000,
      startDate,
      endDate,
      status: 'active',
      isFeaturedOnHome: true,
      tagLabel: 'HOT',
    },
    {
      code: 'GIAM20',
      name: 'Giảm 20% tổng hóa đơn vé & bắp nước',
      discountType: 'percent',
      discountValue: 20,
      maxDiscountAmount: 50000,
      minOrderValue: 100000,
      startDate,
      endDate,
      status: 'active',
      isFeaturedOnHome: true,
      tagLabel: 'VIP',
    }
  ]

  // Seed combos
  const combos = [
    {
      name: 'Combo Solo (1 Bắp + 1 Nước)',
      imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&q=80&w=500',
      items: [
        { itemName: 'Bắp ngọt lớn', quantity: 1 },
        { itemName: 'Nước ngọt Pepsi lớn', quantity: 1 },
      ],
      originalPrice: 75000,
      comboPrice: 59000,
      status: 'active',
      isFeaturedOnHome: true,
      tagLabel: 'Bestseller'
    },
    {
      name: 'Combo Couple (1 Bắp + 2 Nước)',
      imageUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&q=80&w=500',
      items: [
        { itemName: 'Bắp ngọt lớn', quantity: 1 },
        { itemName: 'Nước ngọt Pepsi lớn', quantity: 2 },
      ],
      originalPrice: 110000,
      comboPrice: 89000,
      status: 'active',
      isFeaturedOnHome: true,
      tagLabel: 'Phổ biến'
    }
  ]

  await Coupon.insertMany(coupons)
  console.log('Seeded coupons successfully')

  await Combo.insertMany(combos)
  console.log('Seeded combos successfully')

  mongoose.connection.close()
}

seed()
