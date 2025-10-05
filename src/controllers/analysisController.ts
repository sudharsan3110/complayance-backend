// src/controllers/analysisController.ts

import type { Request, Response, NextFunction } from "express";
import { analyzeUpload } from "@/services/analysisService.js";

interface AnalyzeRequest {
  uploadId: string;
  questionnaire: {
    webhooks?: boolean;
    sandbox_env?: boolean;
    retries?: boolean;
  };
}

/**
 * Handles the POST /analyze endpoint
 * Body: { "uploadId": "u_xxx", "questionnaire": { ... } }
 * Response: Complete report JSON including reportId
 */
export const postAnalyze = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { uploadId, questionnaire } = req.body as AnalyzeRequest;

    // Validate required fields
    if (!uploadId) {
      return res.status(400).json({
        error: "Missing required field: uploadId"
      });
    }

    if (!questionnaire) {
      return res.status(400).json({
        error: "Missing required field: questionnaire"
      });
    }

    // Perform analysis
    const analysisResult = await analyzeUpload(uploadId, questionnaire);

    // Return the complete report including reportId
    return res.status(200).json({
      reportId: analysisResult.reportId,
      scores: analysisResult.scores,
      coverage: analysisResult.coverage,
      ruleFindings: analysisResult.ruleFindings,
      gaps: analysisResult.gaps,
      meta: analysisResult.meta,
    });
  } catch (error) {
    console.error("Error in postAnalyze:", error);

    if (error instanceof Error && error.message === "Upload not found") {
      return res.status(404).json({ error: "Upload not found" });
    }

    return res.status(500).json({ error: "Failed to analyze upload." });
  }
};
