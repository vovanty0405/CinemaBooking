const User = require('../models/Users')

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)

    const filter = {}
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }
    if (role) filter.role = role
    if (isActive !== undefined) filter.isActive = isActive === 'true'

    const total = await User.countDocuments(filter)
    const users = await User.find(filter)
      .select('-password')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 })

    res.json({
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    })
  } catch (err) { next(err) }
}

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be "user" or "admin"' })
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ message: 'User role updated', data: user })
  } catch (err) { next(err) }
}

const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })

    user.isActive = !user.isActive
    await user.save()

    res.json({ message: 'User status updated', data: user })
  } catch (err) { next(err) }
}

module.exports = { getAllUsers, updateUserRole, toggleUserStatus }
