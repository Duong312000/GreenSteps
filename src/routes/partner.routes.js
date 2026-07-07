const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partner.controller');
const { softAuth } = require('../middlewares/auth.middleware');

router.post('/register', softAuth, partnerController.registerProvider);
router.get('/stats', softAuth, partnerController.getMonthlyStats);
router.post('/approve', softAuth, partnerController.approveProvider);

module.exports = router;
