const express = require('express')
const router = express.Router()
const { getAllUsers, updateUserRole, toggleUserStatus } = require('../controllers/userController')
const { authenticate, authorize } = require('../middlewares/authMiddleware')

router.get('/', authenticate, authorize('admin'), getAllUsers)
router.patch('/:id/role', authenticate, authorize('admin'), updateUserRole)
router.patch('/:id/status', authenticate, authorize('admin'), toggleUserStatus)

module.exports = router
