const rateLimit = require('express-rate-limit')
const { RedisStore } = require('rate-limit-redis')
const redisConfig = require('../config/redis')

const createLimiter = (prefix, max, windowMs, message) => {
  const options = {
    windowMs,
    max,
    message: { message },
    standardHeaders: true,
    legacyHeaders: false,
  }

  if (redisConfig.isAvailable()) {
    options.store = new RedisStore({
      sendCommand: (...args) => redisConfig.getClient().call(...args),
      prefix,
    })
    console.log(`Rate limiter [${prefix}] using Redis`)
  } else {
    console.log(`Rate limiter [${prefix}] using MemoryStore (Redis unavailable)`)
  }

  return rateLimit(options)
}

// Khởi tạo sau 1 tick để Redis có thời gian connect
let loginLimiter
let apiLimiter

const initLimiters = () => {
  loginLimiter = createLimiter('rl:login:', 5, 15 * 60 * 1000, 'Too many login attempts, please try again after 15 minutes')
  apiLimiter = createLimiter('rl:api:', 2000, 15 * 60 * 1000, 'Too many requests')
}

// Gọi sau khi app khởi động xong
// Tránh schedule khi chạy test để không gây log async sau khi test kết thúc
if (process.env.NODE_ENV !== 'test') {
  setTimeout(initLimiters, 2000)
}

// Fallback ngay lập tức nếu cần dùng trước khi timeout chạy
const getLimiter = (type) => (req, res, next) => {
  const limiter = type === 'login' ? loginLimiter : apiLimiter
  if (!limiter) return next() // chưa init xong thì bỏ qua
  return limiter(req, res, next)
}

module.exports = {
  loginLimiter: getLimiter('login'),
  apiLimiter: getLimiter('api'),
  initLimiters,
}