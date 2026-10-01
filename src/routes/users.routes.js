import express from 'express';
import { getMe, updateMe } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);

export default router;
