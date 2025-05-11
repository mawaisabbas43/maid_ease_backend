import express from 'express';
import {
    createMaidHire,
    getMaidHireRecordById,
    getMaidHireRecordsForMaid,
    getMaidHireRecordsForUser,
    getMaidRatings,
    getUserRatings,
    updateAcceptanceStatus,
    updateMaidRating,
    updatePaymentStatus,
    updateUserRating
} from '../controllers/maidHire.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Route to create a maid hire entry (User only)
router.post('/', protect, createMaidHire);

// Route to update acceptance status (Maid only)
router.put('/acceptance-status', protect, updateAcceptanceStatus);

// Route to update payment status (User only)
router.put('/payment-status', protect, updatePaymentStatus);

// Route to update ratings (update Maid rating by user only)
router.put('/rating/maid', protect, updateMaidRating);
// Route to update ratings (update User rating by maid only)
router.put('/rating/user', protect, updateUserRating);
// Route to get ratings for a maid (everyone, publicly available)
router.get('/rating/maid/:maid_id', getMaidRatings);
// Route to get ratings for a user (by user himself only)
router.get('/rating/user/:user_id', protect, getUserRatings);

// Route to get maid hire records for a maid (Maid only)
router.get('/maid', protect, getMaidHireRecordsForMaid);

// Route to get maid hire records for a user (User only)
router.get('/user', protect, getMaidHireRecordsForUser);

// Route to get a single maid hire record by ID (User or Maid)
router.get('/single/:maid_hire_id', protect, getMaidHireRecordById);
export default router;