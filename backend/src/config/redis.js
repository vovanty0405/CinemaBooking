const Redis = require('ioredis')
// Lệnh chạy redis
// sudo service redis-server start
let redis = null
let redisAvailable = false

const createRedis = () => {
  if (process.env.USE_REDIS === 'false') {
    console.warn('Redis is disabled by environment configuration — running without Redis')
    return null
  }

  const client = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    lazyConnect: true,          // không tự kết nối ngay khi khởi tạo
    maxRetriesPerRequest: 1,    // mỗi lệnh chỉ retry 1 lần rồi throw
    retryStrategy: (times) => {
      if (times >= 2) {
        // trả về null = ioredis dừng retry hoàn toàn
        redisAvailable = false
        console.warn('Redis unavailable — falling back to in-memory / MongoDB')
        return null
      }
      return Math.min(times * 200, 1000)
    },
  })

  client.on('connect', () => {
    redisAvailable = true
    console.log('Redis connected')
  })

  client.on('error', (err) => {
    // chỉ log, không cần xử lý — retryStrategy lo phần dừng
    if (redisAvailable) {
      console.error('Redis error:', err.message)
      redisAvailable = false
    }
  })

  // chủ động connect, nếu fail thì thôi
  client.connect().catch(() => {
    console.warn('Redis initial connection failed — running without Redis')
  })

  return client
}

redis = createRedis()

if (redis === null) {
  module.exports = {
    getClient: () => null,
    isAvailable: () => false
  }
} else {
  module.exports = redis
  module.exports.getClient = () => (redisAvailable ? redis : null)
  module.exports.isAvailable = () => redisAvailable
}