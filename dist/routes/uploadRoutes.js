import { Router } from 'express';
import { postUpload, handleMultipartUpload } from '../controllers/uploadController.js';
const router = Router();
router.post('/', handleMultipartUpload, postUpload);
export default router;
//# sourceMappingURL=uploadRoutes.js.map