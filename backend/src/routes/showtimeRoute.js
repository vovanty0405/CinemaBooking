const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/showTimeController')
const { authenticate, authorize } = require('../middlewares/authMiddleware')

router.get('/', ctrl.getAll)
router.get('/:id', ctrl.getOne)
router.post('/', authenticate, authorize('admin'), ctrl.create)
router.patch('/:id', authenticate, authorize('admin'), ctrl.update)
router.patch('/:id/cancel', authenticate, authorize('admin'), ctrl.cancel)

module.exports = router