import express from 'express';
import {
  listLocalInfo,
  getCategories,
  getLocalInfo,
  createLocalInfo,
} from '../controllers/localInfo.controller.js';

// Provided by Victory's auth module. Expected behavior:
//   protect             -> verifies the Bearer JWT and sets req.user ({ _id, role, ... })
//   authorize(...roles) -> 403 unless req.user.role is one of the roles
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, listLocalInfo);

// Must come before '/:id', otherwise "categories" is treated as an id
router.get('/categories', protect, getCategories);

router.get('/:id', protect, getLocalInfo);

router.post('/', protect, authorize('admin'), createLocalInfo);

export default router;
