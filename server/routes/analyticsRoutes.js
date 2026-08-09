import express from 'express';
import {
  getSummary,
  getTrend,
  getCategoryAnalytics,
  getInsights,
  getHealth,
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/summary', getSummary);
router.get('/trend', getTrend);
router.get('/categories', getCategoryAnalytics);
router.get('/insights', getInsights);
router.get('/health', getHealth);

export default router;
