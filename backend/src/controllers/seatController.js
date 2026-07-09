const Seat = require('../models/Seat')
const Booking = require('../models/Booking')
const Showtime = require('../models/Showtime')

const bulkUpdateSeats = async (req, res, next) => {
  try {
    const { seatIds, type, status, statusNote, pairedWithSeatId, spanColumns } = req.body;

    // Validate if any of these seats have active bookings in future showtimes
    // active bookings: status = pending or confirmed
    // future showtimes: startTime > now
    
    // 1. Find all future showtimes for the room(s) of these seats
    const seatsToUpdate = await Seat.find({ _id: { $in: seatIds } });
    if (seatsToUpdate.length === 0) {
      return res.status(404).json({ message: 'No seats found' });
    }
    
    const roomIds = [...new Set(seatsToUpdate.map(s => s.room.toString()))];
    
    const futureShowtimes = await Showtime.find({
      room: { $in: roomIds },
      startTime: { $gt: new Date() },
      status: { $ne: 'cancelled' }
    });

    const futureShowtimeIds = futureShowtimes.map(s => s._id);

    // 2. Check if any seat is booked in these showtimes
    if (futureShowtimeIds.length > 0) {
      const activeBookings = await Booking.find({
        showtime: { $in: futureShowtimeIds },
        status: { $in: ['pending', 'confirmed'] },
        'seats.seat': { $in: seatIds }
      });

      if (activeBookings.length > 0) {
        return res.status(400).json({ 
          message: 'Không thể thay đổi ghế vì đã có khách đặt vé trong các suất chiếu sắp tới.' 
        });
      }
    }

    // 3. Update the seats
    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (statusNote !== undefined) updateData.statusNote = statusNote;
    if (pairedWithSeatId !== undefined) updateData.pairedWithSeatId = pairedWithSeatId;
    if (spanColumns !== undefined) updateData.spanColumns = spanColumns;

    await Seat.updateMany({ _id: { $in: seatIds } }, { $set: updateData });

    res.json({ message: 'Seats updated successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { bulkUpdateSeats }
