const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Cấu hình thư mục lưu trữ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../public/uploads')
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    // Đặt tên file: timestamp + ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

// Kiểm tra định dạng file
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WEBP are allowed.'), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
  }
})

const uploadSingle = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }
    
    // Tạo link URL trả về cho client
    // Hostname lấy từ config của backend (ví dụ: http://localhost:3000)
    const host = req.protocol + '://' + req.get('host')
    const fileUrl = `${host}/uploads/${req.file.filename}`
    
    res.json({
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        url: fileUrl
      }
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  upload,
  uploadSingle
}
