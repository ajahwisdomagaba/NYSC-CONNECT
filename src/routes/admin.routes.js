import express from 'express';
import { getAdminReports, moderateReport } from '../controllers/report.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

//Guard all admin routes with protect and restrictTo('admin')
router.use(protect, restrictTo('ADMIN'));

//Admin reports
router.get('/reports', getAdminReports);
router.patch('/reports/:id', moderateReport);

export default router;
