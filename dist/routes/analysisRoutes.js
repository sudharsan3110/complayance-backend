import { Router } from 'express';
import { postAnalyze } from '../controllers/analysisController.js';
const router = Router();
router.post('/', postAnalyze);
export default router;
//# sourceMappingURL=analysisRoutes.js.map