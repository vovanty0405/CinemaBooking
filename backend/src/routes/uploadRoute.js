const express = require('express')
const router = express.Router()
const { upload, uploadSingle } = require('../controllers/uploadController')
const { authenticate, authorize } = require('../middlewares/authMiddleware')

// Cho phép cả admin và user đăng nhập upload ảnh (ví dụ: đổi avatar, upload poster phim)
router.post('/', authenticate, upload.single('image'), uploadSingle)

module.exports = router
