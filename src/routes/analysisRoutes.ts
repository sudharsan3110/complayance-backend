// src/routes/analysisRoutes.ts

import { Router } from 'express';
import { postAnalyze } from '@/controllers/analysisController.js';

const router = Router();

// POST /analyze - analyzes uploaded data and returns complete report
router.post('/', postAnalyze);

export default router;
