import express from 'express';
const router = express.Router();

import {
  getAllUsers,
  updateMaidProfileStatus,
  updateUserProfileStatus,
  getAllHirings,
  adminLogin,
  getAllMaidProfiles,
    createAdmin
} from '../controllers/admin.controller.js';

router.get('/users', getAllUsers);
router.get('/maids', getAllMaidProfiles);
router.patch('/maids/:maidId/profile-status', updateMaidProfileStatus);
router.patch('/users/:userId/profile-status', updateUserProfileStatus);
router.get('/hirings', getAllHirings);
router.post('/login', adminLogin);
router.post('/register', createAdmin);

export default router;