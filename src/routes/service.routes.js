const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const { authMiddleware, checkRole } = require('../middlewares/auth.middleware');
const { cacheMiddleware } = require('../middlewares/cache');

router.get('/', cacheMiddleware(600), serviceController.getServices); // cache 10 min
router.get('/recommendations/:userId', serviceController.getRecommendations);
router.get('/provider/:providerId', authMiddleware, checkRole(['provider', 'admin']), serviceController.getProviderServices);
router.post('/', authMiddleware, checkRole(['provider', 'admin']), serviceController.addService);
router.put('/:id', authMiddleware, checkRole(['provider', 'admin']), serviceController.updateService);
router.post('/reviews', authMiddleware, serviceController.postServiceReview);
router.get('/:serviceId/reviews', serviceController.getServiceReviews);

module.exports = router;
