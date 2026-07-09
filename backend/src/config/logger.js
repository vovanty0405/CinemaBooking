const winston = require('winston')
require('winston-daily-rotate-file')

const { combine, timestamp, printf, colorize, errors } = winston.format

// Định dạng chung cho log
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`
})

// Vận chuyển log ghi vào file xoay vòng hằng ngày (Rotating file) cho Error logs
const errorTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error', // Chỉ ghi lại level error
})

// Vận chuyển log ghi vào file xoay vòng hằng ngày cho System logs
const combinedTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
})

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    errors({ stack: true }), // Bắt stack trace
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    errorTransport,
    combinedTransport,
  ],
})

// Hiển thị ra console khi chạy ở chế độ dev
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    })
  )
}

module.exports = logger
