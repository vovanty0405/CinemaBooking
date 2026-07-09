const express = require('express')
const router = express.Router()

const {create, update, getAll, getOne, remove} = require('../controllers/movieController')

const { authenticate, authorize } = require('../middlewares/authMiddleware')

router.get('/',getAll)
router.get('/:id',getOne)
router.post('/', authenticate, authorize('admin'),create)
router.patch('/:id', authenticate, authorize('admin'),update)
router.delete('/:id', authenticate, authorize('admin'),remove)

module.exports = router