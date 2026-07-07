const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const { authMiddleware, softAuth, checkRole } = require('../middlewares/auth.middleware');

router.get('/', softAuth, walletController.getWallet);
router.post('/activate', softAuth, walletController.activateWallet);
router.post('/deposit', softAuth, walletController.deposit);
router.post('/withdraw', softAuth, walletController.requestWithdrawal);
router.get('/transactions', softAuth, walletController.getTransactions);

// Admin-only endpoints
router.get('/withdrawals', authMiddleware, checkRole(['admin']), walletController.listAllWithdrawals);
router.post('/withdrawals/:id/approve', authMiddleware, checkRole(['admin']), walletController.approveWithdrawal);

// Legacy compat endpoints
router.get('/:userId', softAuth, walletController.getWallet);
router.post('/pay', walletController.payItinerary);
router.post('/pay-qr', walletController.payItineraryQr);
router.get('/transactions/:userId', walletController.getTransactions);

module.exports = router;
