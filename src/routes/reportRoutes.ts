// src/routes/reportRoutes.ts

import { Router } from 'express';
import { getReportById, getRecentReportsList } from '@/controllers/reportController.js';

const router = Router();

// GET /report/:reportId - retrieves a specific report by ID
router.get('/:reportId', getReportById);

// GET /reports?limit=10 - retrieves recent reports list (P1 feature)
router.get('/', getRecentReportsList);

export default router;
