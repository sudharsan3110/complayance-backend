import { Router } from 'express';
import { getReportById, getRecentReportsList } from '../controllers/reportController.js';
const router = Router();
router.get('/:reportId', getReportById);
router.get('/', getRecentReportsList);
export default router;
//# sourceMappingURL=reportRoutes.js.map