const logger = require('../config/logger')

const errorHandler = (err, req, res, next) => {
  // Ghi log lỗi bằng winston
  logger.error(`${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, { 
    stack: err.stack,
    errors: err.errors 
  })

  const isDev = process.env.NODE_ENV === 'development'

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({ 
      message: messages.join(', '),
      errors: err.errors, // Trả chi tiết từng trường lỗi về cho client
      stack: isDev ? err.stack : undefined
    })
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return res.status(400).json({ 
      message: `${field} already exists`,
      stack: isDev ? err.stack : undefined
    })
  }

  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    stack: isDev ? err.stack : undefined
  })
}

module.exports = errorHandler