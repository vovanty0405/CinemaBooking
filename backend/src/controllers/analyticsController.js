const Booking = require('../models/Booking');
const User = require('../models/Users');
const Showtime = require('../models/Showtime');
const Movie = require('../models/Movies');
const exceljs = require('exceljs');

function resolveDateRange(range, from, to) {
  const now = new Date();
  let startDate, endDate = now;
  switch (range) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case '7d':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case '30d':
      startDate = new Date(now.setDate(now.getDate() - 30));
      break;
    case 'custom':
      startDate = new Date(from);
      endDate = new Date(to);
      break;
    default:
      startDate = new Date(now.setHours(0, 0, 0, 0));
  }
  // tính luôn kỳ trước liền kề để so sánh % tăng/giảm
  const durationMs = endDate - startDate;
  const prevStart = new Date(startDate.getTime() - durationMs);
  const prevEnd = new Date(startDate.getTime());
  return { startDate, endDate, prevStart, prevEnd };
}

const getKpi = async (req, res, next) => {
  try {
    const { startDate, endDate, prevStart, prevEnd } = resolveDateRange(req.query.range, req.query.from, req.query.to);

    const getKpiForPeriod = async (start, end) => {
      const bookings = await Booking.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end }, status: 'confirmed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalTickets: { $sum: { $size: '$seats' } } } },
      ]);
      const newCustomers = await User.countDocuments({ createdAt: { $gte: start, $lt: end } });

      // Tỷ lệ lấp đầy = tổng ghế đã bán / tổng sức chứa phòng
      const occupancy = await Showtime.aggregate([
        { $match: { startTime: { $gte: start, $lt: end } } }, // schema dùng startTime thay vì showDate
        { $lookup: { from: 'rooms', localField: 'room', foreignField: '_id', as: 'roomData' } }, // localField: 'room'
        { $unwind: '$roomData' },
        { $lookup: { from: 'bookings', localField: '_id', foreignField: 'showtime', as: 'bookings' } }, // localField: '_id', foreignField: 'showtime'
        {
          $project: {
            totalSeats: { $multiply: ['$roomData.rows', '$roomData.seatsPerRow'] }, // Sức chứa = rows * seatsPerRow
            bookedSeats: {
              $reduce: {
                input: '$bookings',
                initialValue: 0,
                in: { $add: ['$$value', { $size: '$$this.seats' }] } // Tính tổng số ghế trong các booking
              }
            },
          },
        },
        { $group: { _id: null, totalSeats: { $sum: '$totalSeats' }, bookedSeats: { $sum: '$bookedSeats' } } },
      ]);

      const occupancyRate = occupancy[0] && occupancy[0].totalSeats > 0 ? (occupancy[0].bookedSeats / occupancy[0].totalSeats) * 100 : 0;

      return {
        totalRevenue: bookings[0]?.totalRevenue || 0,
        totalTickets: bookings[0]?.totalTickets || 0,
        newCustomers,
        occupancyRate: Number(occupancyRate.toFixed(1)),
      };
    };

    const current = await getKpiForPeriod(startDate, endDate);
    const previous = await getKpiForPeriod(prevStart, prevEnd);

    const pctChange = (curr, prev) => (prev === 0 ? 0 : Number((((curr - prev) / prev) * 100).toFixed(1)));

    res.json({
      totalRevenue: { value: current.totalRevenue, changePercent: pctChange(current.totalRevenue, previous.totalRevenue) },
      totalTickets: { value: current.totalTickets, changePercent: pctChange(current.totalTickets, previous.totalTickets) },
      newCustomers: { value: current.newCustomers, changePercent: pctChange(current.newCustomers, previous.newCustomers) },
      occupancyRate: { value: current.occupancyRate, changePercent: pctChange(current.occupancyRate, previous.occupancyRate) },
    });
  } catch (error) {
    next(error);
  }
};

const getRevenueByMovie = async (req, res, next) => {
  try {
    const { startDate, endDate } = resolveDateRange(req.query.range, req.query.from, req.query.to);

    const result = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate, $lt: endDate }, status: 'confirmed' } },
      { $lookup: { from: 'showtimes', localField: 'showtime', foreignField: '_id', as: 'showtimeData' } }, // foreign field is showtime
      { $unwind: '$showtimeData' },
      { $lookup: { from: 'movies', localField: 'showtimeData.movie', foreignField: '_id', as: 'movieData' } },
      { $unwind: '$movieData' },
      { $group: { _id: '$movieData._id', movieTitle: { $first: '$movieData.title' }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getFormatDistribution = async (req, res, next) => {
  try {
    const { startDate, endDate } = resolveDateRange(req.query.range, req.query.from, req.query.to);

    const result = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate, $lt: endDate }, status: 'confirmed' } },
      { $lookup: { from: 'showtimes', localField: 'showtime', foreignField: '_id', as: 'showtimeData' } },
      { $unwind: '$showtimeData' },
      { $lookup: { from: 'movies', localField: 'showtimeData.movie', foreignField: '_id', as: 'movieData' } },
      { $unwind: '$movieData' },
      { $group: { _id: '$movieData.format', count: { $sum: 1 } } }, // Giả định định dạng nằm ở Movie model
    ]);

    const total = result.reduce((sum, r) => sum + r.count, 0);
    const formatted = result.map((r) => ({ format: r._id || '2D', percent: Number(((r.count / total) * 100).toFixed(1)) }));

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

const getBookingHeatmap = async (req, res, next) => {
  try {
    const { startDate, endDate } = resolveDateRange(req.query.range, req.query.from, req.query.to);

    const result = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate, $lt: endDate }, status: 'confirmed' } },
      { $lookup: { from: 'showtimes', localField: 'showtime', foreignField: '_id', as: 'showtimeData' } },
      { $unwind: '$showtimeData' },
      {
        $project: {
          dayOfWeek: { $dayOfWeek: '$showtimeData.startTime' }, // 1=CN...7=Thứ 7
          hourSlot: { $hour: '$showtimeData.startTime' },
        },
      },
      { $group: { _id: { day: '$dayOfWeek', hour: '$hourSlot' }, count: { $sum: 1 } } },
    ]);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const exportAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = resolveDateRange(req.query.range, req.query.from, req.query.to);

    // Get KPI
    const bookings = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate, $lt: endDate }, status: 'confirmed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalTickets: { $sum: { $size: '$seats' } } } },
    ]);
    const newCustomers = await User.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } });
    const kpi = {
      totalRevenue: bookings[0]?.totalRevenue || 0,
      totalTickets: bookings[0]?.totalTickets || 0,
      newCustomers
    };

    // Get Top Movies
    const topMovies = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate, $lt: endDate }, status: 'confirmed' } },
      { $lookup: { from: 'showtimes', localField: 'showtime', foreignField: '_id', as: 'showtimeData' } },
      { $unwind: '$showtimeData' },
      { $lookup: { from: 'movies', localField: 'showtimeData.movie', foreignField: '_id', as: 'movieData' } },
      { $unwind: '$movieData' },
      { $group: { _id: '$movieData._id', movieTitle: { $first: '$movieData.title' }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    // Format Excel
    const workbook = new exceljs.Workbook();
    workbook.creator = 'CineBooking System';
    
    // Sheet 1: KPI Summary
    const sheetKpi = workbook.addWorksheet('KPI Summary');
    sheetKpi.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ];
    sheetKpi.addRow({ metric: 'Tổng doanh thu', value: kpi.totalRevenue });
    sheetKpi.addRow({ metric: 'Tổng vé bán ra', value: kpi.totalTickets });
    sheetKpi.addRow({ metric: 'Khách hàng mới', value: kpi.newCustomers });

    // Sheet 2: Revenue By Movie
    const sheetMovies = workbook.addWorksheet('Top Movies Revenue');
    sheetMovies.columns = [
      { header: 'Phim', key: 'title', width: 40 },
      { header: 'Doanh thu', key: 'revenue', width: 20 },
    ];
    topMovies.forEach(m => sheetMovies.addRow({ title: m.movieTitle, revenue: m.revenue }));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=thong-ke-${req.query.range || 'all'}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

module.exports = { getKpi, getRevenueByMovie, getFormatDistribution, getBookingHeatmap, exportAnalytics };
