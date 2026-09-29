import { Router } from 'express';
import { getAccommodationFeed } from '../controllers/accommodation.controller.js';

// Route registration for the housing search/feed endpoint.
// The controller handles validation and response shaping, while the service handles search logic.
const router = Router();

router.get('/', getAccommodationFeed);

export default router;