const express = require('express')
const router = express.Router()
const { createReview, replyReview, getMovieReviews, getAdminReviews, deleteReview, getReviewStats } = require('../controllers/reviewController')
const { authenticate, authorize } = require('../middlewares/authMiddleware')
const checkCanReview = require('../middlewares/checkCanReview')

// --- Admin APIs ---
router.get('/admin/stats', authenticate, authorize('admin'), getReviewStats)
router.get('/admin', authenticate, authorize('admin'), getAdminReviews)
router.delete('/admin/:reviewId', authenticate, authorize('admin'), deleteReview)

// --- Public / User APIs ---
// Lấy danh sách review của phim (public)
router.get('/movie/:movieId', getMovieReviews)

// Tạo đánh giá gốc (cần đăng nhập + mua vé)
router.post('/', authenticate, checkCanReview, createReview)

// Trả lời đánh giá (chỉ cần đăng nhập)
router.post('/:reviewId/reply', authenticate, replyReview)

module.exports = router
