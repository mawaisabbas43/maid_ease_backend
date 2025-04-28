import express from 'express';
import {maidLogin, maidSignup} from '../controllers/maid.controller.js';

const router = express.Router();

router.post('/signup', maidSignup);
router.post('/login', maidLogin);

export default router;
