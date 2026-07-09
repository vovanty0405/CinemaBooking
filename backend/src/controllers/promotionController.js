const Coupon = require('../models/Coupon')
const Combo = require('../models/Combo')
const Booking = require('../models/Booking')

// === COUPON ===
const createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body)
    res.status(201).json({ data: coupon })
  } catch (err) { next(err) }
}

const getCoupons = async (req, res, next) => {
  try {
    const { isFeaturedOnHome, status } = req.query;
    const query = {};
    if (isFeaturedOnHome) query.isFeaturedOnHome = isFeaturedOnHome === 'true';
    if (status) query.status = status;
    
    // Also auto update status logically if needed, but here we just return
    const coupons = await Coupon.find(query).sort({ createdAt: -1 });
    res.json({ data: coupons })
  } catch (err) { next(err) }
}

const validateCoupon = async (req, res, next) => {
  try {
    const { code, cartTotal, movieId, cinemaId, showDate } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) return res.status(404).json({ message: 'Mã giảm giá không tồn tại' });
    if (coupon.status !== 'active') return res.status(400).json({ message: 'Mã giảm giá không hoạt động hoặc đã hết hạn' });

    const now = new Date();
    if (now < coupon.startDate) return res.status(400).json({ message: 'Mã giảm giá chưa đến ngày sử dụng' });
    if (now > coupon.endDate) return res.status(400).json({ message: 'Mã giảm giá đã hết hạn' });

    if (coupon.usageLimitTotal !== null && coupon.usedCount >= coupon.usageLimitTotal) {
      return res.status(400).json({ message: 'Mã giảm giá đã hết lượt sử dụng' });
    }

    if (cartTotal < coupon.minOrderValue) {
      return res.status(400).json({ message: `Đơn hàng tối thiểu phải từ ${coupon.minOrderValue}đ` });
    }

    // Check movie limit
    if (coupon.applicableMovieIds && coupon.applicableMovieIds.length > 0 && movieId) {
      if (!coupon.applicableMovieIds.includes(movieId)) {
        return res.status(400).json({ message: 'Mã giảm giá không áp dụng cho phim này' });
      }
    }

    // Check cinema limit
    if (coupon.applicableCinemaIds && coupon.applicableCinemaIds.length > 0 && cinemaId) {
      if (!coupon.applicableCinemaIds.includes(cinemaId)) {
        return res.status(400).json({ message: 'Mã giảm giá không áp dụng cho rạp này' });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percent') {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    // Don't discount more than total
    if (discountAmount > cartTotal) discountAmount = cartTotal;

    res.json({ data: { discountAmount, couponId: coupon._id } });
  } catch (err) { next(err) }
}


// === COMBO ===
const createCombo = async (req, res, next) => {
  try {
    const combo = await Combo.create(req.body)
    res.status(201).json({ data: combo })
  } catch (err) { next(err) }
}

const getCombos = async (req, res, next) => {
  try {
    const { isFeaturedOnHome, status, cinemaId } = req.query;
    const query = {};
    if (isFeaturedOnHome) query.isFeaturedOnHome = isFeaturedOnHome === 'true';
    if (status) query.status = status;
    
    const combos = await Combo.find(query).sort({ comboPrice: 1 });
    
    // Filter by cinema
    const validCombos = combos.filter(c => {
      if (!c.applicableCinemaIds || c.applicableCinemaIds.length === 0) return true;
      if (cinemaId && c.applicableCinemaIds.includes(cinemaId)) return true;
      return false;
    });

    res.json({ data: validCombos })
  } catch (err) { next(err) }
}

module.exports = {
  createCoupon, getCoupons, validateCoupon,
  createCombo, getCombos
}
