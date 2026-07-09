const { z } = require('zod')
const mongoose = require('mongoose')

const objectIdValidator = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
})

const createBookingSchema = z.object({
  body: z.object({
    showtimeId: objectIdValidator,
    seatIds: z.array(objectIdValidator).min(1, 'Please select at least one seat'),
  }),
})

module.exports = {
  createBookingSchema,
}
