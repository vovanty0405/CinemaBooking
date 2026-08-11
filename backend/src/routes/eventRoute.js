const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { createEvent, updateEvent, deleteEvent, getAdminEvents, getPublicEvents, getEventBySlug } = require('../controllers/eventController');

// Public routes
router.get('/public', getPublicEvents);
router.get('/public/:slug', getEventBySlug);

// Admin routes
router.get('/admin', authenticate, authorize('admin'), getAdminEvents);
router.post('/admin', authenticate, authorize('admin'), createEvent);
router.put('/admin/:id', authenticate, authorize('admin'), updateEvent);
router.delete('/admin/:id', authenticate, authorize('admin'), deleteEvent);

module.exports = router;
