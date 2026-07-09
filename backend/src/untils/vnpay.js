const crypto = require('crypto')
const qs = require('querystring')

/**
 * Sắp xếp params theo alphabet và tạo chữ ký HMAC-SHA512
 * VNPay yêu cầu thứ tự này chính xác
 */
const sortObject = (obj) => {
  const sorted = {}
  const keys = Object.keys(obj).sort()
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) {
      sorted[encodeURIComponent(key)] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+')
    }
  }
  return sorted
}

const createPaymentUrl = ({ amount, bookingId, txnRef, ipAddr, orderInfo }) => {
  const date = new Date()
  const offset = 7 * 60 * 60 * 1000; // GMT+7
  const createDate = new Date(date.getTime() + offset).toISOString().replace(/[-T:.Z]/g, '').slice(0, 14)

  let cleanIp = ipAddr || '127.0.0.1'
  if (cleanIp === '::1' || cleanIp.includes('::ffff:')) {
    cleanIp = '127.0.0.1'
  }

  const params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: process.env.VNPAY_TMN_CODE,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo || `Thanh toan ve xem phim - ${bookingId}`,
    vnp_OrderType: 'entertainment',
    vnp_Amount: Math.round(amount * 100), // VNPay tính theo đơn vị VNĐ × 100
    vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
    vnp_IpAddr: cleanIp,
    vnp_CreateDate: createDate,
  }

  const sortedParams = sortObject(params)
  // Dùng pass-through encoder vì sortedParams đã được encode trong sortObject
  const signData = qs.stringify(sortedParams, '&', '=', { encodeURIComponent: (str) => str })
  const hmac = crypto.createHmac('sha512', process.env.VNPAY_HASH_SECRET)
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

  sortedParams.vnp_SecureHash = signed

  const finalUrl = `${process.env.VNPAY_URL}?${qs.stringify(sortedParams, '&', '=', { encodeURIComponent: (str) => str })}`
  console.log('Generated VNPay URL:', finalUrl)
  return finalUrl
}

/**
 * Verify chữ ký từ VNPay gửi về (dùng cho cả Return URL và IPN)
 */
const verifySignature = (vnpParams) => {
  const secureHash = vnpParams.vnp_SecureHash
  const params = { ...vnpParams }

  // Xóa các field không tham gia ký
  delete params.vnp_SecureHash
  delete params.vnp_SecureHashType

  const sortedParams = sortObject(params)
  const signData = qs.stringify(sortedParams, '&', '=', { encodeURIComponent: (str) => str })
  const hmac = crypto.createHmac('sha512', process.env.VNPAY_HASH_SECRET)
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

  return secureHash === signed
}

module.exports = { createPaymentUrl, verifySignature }