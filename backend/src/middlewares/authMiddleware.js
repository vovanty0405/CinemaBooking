const jwt = require('jsonwebtoken');
const User = require('../models/Users');
const { verifyAccessToken } = require('../untils/jwt');


const authenticate = (req, res, next) =>{
    try {
        const authHeader = req.headers.authorization
        if(!authHeader?.startsWith('Bearer')){
            return res.status(401).json({ message: 'No token provided' })
        }
        const token = authHeader.split(' ')[1]
        const decoded = verifyAccessToken(token)
        req.user = decoded
        next()
    } catch (error) {
         if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' })
        }
        return res.status(401).json({ message: 'Invalid token' })
    }
}
// Middleware phân quyền
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }
    next()
  }
}
module.exports = { authenticate, authorize }