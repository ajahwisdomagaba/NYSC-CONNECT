import { Router } from "express";
import authRoutes from './auth.routes.js';
import accomodationRoutes from './accomodation.route.js';
import localInfoRoutes from './localinfo.route.js';
import savedRoutes from './saved.routes.js';
import reportsRoutes from './reports.routes.js'
import locationRoutes from './location.routes.js';


const router = Router();

router.use('/auth', authRoutes);
router.use('/accomodations', accomodationRoutes);
router.use('/local-info', localInfoRoutes);
router.use('/saved', savedRoutes);
router.use('/reports', reportsRoutes);
router.use('/locations', locationRoutes);

export default router;