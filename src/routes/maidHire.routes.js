import express from 'express';
import { createMaidHire, updateAcceptanceStatus, updatePaymentStatus } from '../controllers/maidHire.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Route to create a maid hire entry (User only)
router.post('/', protect, createMaidHire);

// Route to update acceptance status (Maid only)
router.put('/acceptance-status', protect, updateAcceptanceStatus);

// Route to update payment status (User only)
router.put('/payment-status', protect, updatePaymentStatus);

export default router;