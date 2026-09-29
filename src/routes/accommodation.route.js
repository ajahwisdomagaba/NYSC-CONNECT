import { Router } from 'express';
import { getAccommodationFeed } from '../controllers/accommodation.controller.js';

const router = Router();

router.get('/', getAccommodationFeed);

export default router;