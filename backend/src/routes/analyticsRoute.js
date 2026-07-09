const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { getKpi, getRevenueByMovie, getFormatDistribution, getBookingHeatmap, exportAnalytics } = require('../controllers/analyticsController');

// All analytics routes are protected for admins only
router.use(authenticate, authorize('admin'));

router.get('/kpi', getKpi);
router.get('/revenue-by-movie', getRevenueByMovie);
router.get('/format-distribution', getFormatDistribution);
router.get('/booking-heatmap', getBookingHeatmap);
router.get('/export', exportAnalytics);

module.exports = router;
