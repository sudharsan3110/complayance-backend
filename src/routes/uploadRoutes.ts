// src/routes/uploadRoutes.ts

import { Router } from 'express';
import { postUpload, handleMultipartUpload } from '@/controllers/uploadController.js';

const router = Router();

// POST /upload - accepts multipart/form-data (file) or JSON body
router.post('/', handleMultipartUpload, postUpload);

export default router;

