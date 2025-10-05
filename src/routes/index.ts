// src/routes/index.ts

import { Router } from "express";
import uploadRoutes from "@/routes/uploadRoutes.js";
import analysisRoutes from "@/routes/analysisRoutes.js";
import reportRoutes from "@/routes/reportRoutes.js";
import { getHealth } from "@/controllers/healthController.js";

const router = Router();

// Health check endpoint
router.get("/health", getHealth);

// /api/upload
router.use("/upload", uploadRoutes);

// /api/analyze
router.use("/analyze", analysisRoutes);

// /api/report and /api/reports
router.use("/report", reportRoutes);
router.use("/reports", reportRoutes);

export default router;
