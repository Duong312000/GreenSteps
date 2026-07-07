const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { softAuth } = require('../middlewares/auth.middleware');

router.post('/', softAuth, bookingController.createBooking);
router.post('/checkin', softAuth, bookingController.checkInEVoucher);
router.post('/cancel', softAuth, bookingController.cancelBooking);
router.get('/', softAuth, bookingController.getBookings);
router.post('/:id/approve', softAuth, bookingController.approveBooking);
router.post('/:id/reject', softAuth, bookingController.rejectBooking);

module.exports = router;
