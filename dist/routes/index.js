import { Router } from "express";
import uploadRoutes from "../routes/uploadRoutes.js";
import analysisRoutes from "../routes/analysisRoutes.js";
import reportRoutes from "../routes/reportRoutes.js";
import { getHealth } from "../controllers/healthController.js";
const router = Router();
router.get("/health", getHealth);
router.use("/upload", uploadRoutes);
router.use("/analyze", analysisRoutes);
router.use("/report", reportRoutes);
router.use("/reports", reportRoutes);
export default router;
//# sourceMappingURL=index.js.map