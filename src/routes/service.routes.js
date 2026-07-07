const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const { authMiddleware, checkRole } = require('../middlewares/auth.middleware');

router.get('/', serviceController.getServices);
router.get('/recommendations/:userId', serviceController.getRecommendations);
router.get('/provider/:providerId', authMiddleware, checkRole(['provider', 'admin']), serviceController.getProviderServices);
router.post('/', authMiddleware, checkRole(['provider', 'admin']), serviceController.addService);
router.post('/reviews', authMiddleware, serviceController.postServiceReview);
router.get('/:serviceId/reviews', serviceController.getServiceReviews);

module.exports = router;
