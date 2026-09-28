import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Accomodation Route works' });
});

export default router;