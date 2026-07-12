const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tour.controller');
const serviceController = require('../controllers/service.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.post('/tour', authMiddleware, tourController.postTourReview);
router.get('/tour/:tourId', tourController.getTourReviews);
router.post('/service', authMiddleware, serviceController.postServiceReview);
router.get('/service/:serviceId', serviceController.getServiceReviews);
router.post('/:commentId/like', tourController.likeComment);

module.exports = router;
