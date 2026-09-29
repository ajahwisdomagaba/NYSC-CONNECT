import express from 'express';
import {
  createAccommodation,
  getAccommodation,
  updateAccommodation,
  deleteAccommodation,
} from '../controllers/accommodation.controller.js';

// Provided by Victory's auth module. Expected behavior:
//   protect            -> verifies the Bearer JWT and sets req.user ({ _id, role, ... })
//   restrictTo(...roles) -> 403 unless req.user.role is one of the roles
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Abu's GET '/' (search/feed) mounts on this same path; merge the two routers
// or mount both under /api/v1/accommodations in app.js.

router.post('/', protect, restrictTo('admin', 'landlord'), createAccommodation);

router
  .route('/:id')
  .get(protect, getAccommodation)
  .put(protect, restrictTo('admin', 'landlord'), updateAccommodation)
  .delete(protect, restrictTo('admin', 'landlord'), deleteAccommodation);

export default router;

// In app.js:
//   import accommodationRoutes from './routes/accommodation.routes.js';
//   app.use('/api/v1/accommodations', accommodationRoutes);
