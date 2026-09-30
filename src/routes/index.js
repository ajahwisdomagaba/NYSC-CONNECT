import { Router } from "express";
import authRoutes from './auth.routes.js';
import accomodationRoutes from './accomodation.route.js';
import localInfoRoutes from './localinfo.route.js';
import savedRoutes from './saved.routes.js';
import reportsRoutes from './reports.routes.js'
import locationRoutes from './location.routes.js';
import mediaRoutes from './media.routes.js';


const router = Router();

// Healthcheck
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is healthy' });
});

//Modular routes
router.use('/auth', authRoutes);
router.use('/accomodations', accomodationRoutes);
router.use('/local-info', localInfoRoutes);
router.use('/saved', savedRoutes);
router.use('/reports', reportsRoutes);
router.use('/locations', locationRoutes);
router.use('/media', mediaRoutes);

export default router;