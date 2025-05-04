import express from 'express';
import {
    getAllMaids, getAuthMaidDetails, getMaidById,
    maidLogin,
    maidSignup,
    updateMaidPassword,
    updateMaidProfile
} from '../controllers/maid.controller.js';
import {protect} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get('/', getAllMaids);
router.post('/signup', maidSignup);
router.post('/login', maidLogin);

// Authenticated routes
router.get('/profile/:id', protect, getAuthMaidDetails); // Auth required (maid or user)
router.put('/update-password', protect, updateMaidPassword); // Auth required (maid only)
router.put('/update-profile', protect, updateMaidProfile); // Auth required (maid only)

router.get('/:id', getMaidById); // Public route

export default router;
