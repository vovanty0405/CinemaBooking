const { ZodError } = require('zod')

const validate = (schema) => (req, res, next) => {
  try {
    const validData = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    })

    // Gắn ngược lại dữ liệu đã được parse (có thể đã type cast, ví dụ: string -> int)
    req.body = validData.body
    req.query = validData.query
    req.params = validData.params

    next()
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      })
    }
    next(error)
  }
}

module.exports = validate
