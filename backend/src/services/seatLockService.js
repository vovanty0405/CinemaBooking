const redis = require('../config/redis')

const LOCK_TTL = 10 * 60        // 10 phút (giây)
const LOCK_PREFIX = 'seat_lock:'

// Key format: seat_lock:{showtimeId}:{seatId}
const buildKey = (showtimeId, seatId) =>
  `${LOCK_PREFIX}${showtimeId}:${seatId}`

/**
 * Thử giữ ghế bằng SETNX (atomic)
 * Trả về true nếu lock thành công, false nếu ghế đã bị giữ
 */
const lockSeat = async (showtimeId, seatId, userId) => {
  const key = buildKey(showtimeId, seatId)
  // SET key value NX EX ttl
  // NX = chỉ set nếu key chưa tồn tại (atomic)
  const result = await redis.set(key, userId.toString(), 'NX', 'EX', LOCK_TTL)
  return result === 'OK' // 'OK' = thành công, null = đã bị khóa
}

/**
 * Giải phóng ghế — chỉ cho phép đúng user đã lock
 * Dùng Lua script để check + delete là atomic
 */
const unlockSeat = async (showtimeId, seatId, userId) => {
  const key = buildKey(showtimeId, seatId)
  const luaScript = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end
  `
  const result = await redis.eval(luaScript, 1, key, userId.toString())
  return result === 1
}

/**
 * Kiểm tra ghế có đang bị lock không và bởi ai
 */
const getSeatLockOwner = async (showtimeId, seatId) => {
  const key = buildKey(showtimeId, seatId)
  return redis.get(key) // trả về userId hoặc null
}

/**
 * Lock nhiều ghế cùng lúc — nếu 1 ghế fail thì rollback tất cả
 */
const lockMultipleSeats = async (showtimeId, seatIds, userId) => {
  const locked = []

  for (const seatId of seatIds) {
    const success = await lockSeat(showtimeId, seatId, userId)
    if (!success) {
      // Rollback các ghế đã lock trước đó
      await Promise.all(locked.map((id) => unlockSeat(showtimeId, id, userId)))
      return { success: false, failedSeatId: seatId }
    }
    locked.push(seatId)
  }

  return { success: true, locked }
}

/**
 * Unlock nhiều ghế
 */
const unlockMultipleSeats = async (showtimeId, seatIds, userId) => {
  await Promise.all(seatIds.map((id) => unlockSeat(showtimeId, id, userId)))
}

/**
 * Lấy toàn bộ ghế đang bị lock của 1 suất chiếu
 * Dùng để hiển thị sơ đồ ghế realtime
 */
const getLockedSeatsForShowtime = async (showtimeId) => {
  const pattern = `${LOCK_PREFIX}${showtimeId}:*`
  const keys = await redis.keys(pattern)
  if (!keys.length) return []

  // Lấy seatId từ key
  return keys.map((key) => key.split(':')[2])
}

module.exports = {
  lockSeat,
  unlockSeat,
  lockMultipleSeats,
  unlockMultipleSeats,
  getSeatLockOwner,
  getLockedSeatsForShowtime,
}