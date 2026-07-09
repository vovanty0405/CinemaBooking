const express = require('express')
const { bulkUpdateSeats } = require('../controllers/seatController')
const { authenticate, authorize } = require('../middlewares/authMiddleware')

const router = express.Router()

// Chỉnh sửa loại ghế, trạng thái hàng loạt (Chỉ Admin)
router.post('/bulk-update', authenticate, authorize('admin'), bulkUpdateSeats)

module.exports = router
