import express from 'express';
import {
    getUserDetails,
    updateUserPassword,
    updateUserProfile,
    userLogin,
    userSignup
} from '../controllers/user.controller.js';
import {protect} from "../middlewares/auth.middleware.js";


const router = express.Router();

// Public routes
router.post('/signup', userSignup);
router.post('/login', userLogin);

// Authenticated routes
router.get('/:user_id', protect, getUserDetails); // Auth required (user or maid with valid order)
router.put('/update-password', protect, updateUserPassword); // Auth required (user only)
router.put('/update-profile', protect, updateUserProfile); // Auth required (user only)


export default router;
