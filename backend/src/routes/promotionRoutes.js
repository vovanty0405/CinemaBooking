const express = require('express')
const { 
  createCoupon, getCoupons, 
  createCombo, getCombos, validateCoupon 
} = require('../controllers/promotionController')
const { authenticate, authorize } = require('../middlewares/authMiddleware')

const router = express.Router()

// Coupons
router.post('/coupons', authenticate, authorize('admin'), createCoupon)
router.get('/coupons', getCoupons) // Public or Admin list
router.post('/coupons/validate', authenticate, validateCoupon)

// Combos
router.post('/combos', authenticate, authorize('admin'), createCombo)
router.get('/combos', getCombos)

module.exports = router
