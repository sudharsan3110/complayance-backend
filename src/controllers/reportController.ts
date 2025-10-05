// src/controllers/reportController.ts

import type { Request, Response, NextFunction } from "express";
import { getReport, getRecentReports } from "@/services/analysisService.js";

/**
 * Handles the GET /report/:reportId endpoint
 * Response: Complete report JSON (read-only from datastore)
 */
export const getReportById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      return res.status(400).json({
        error: "Missing required parameter: reportId"
      });
    }

    const report = await getReport(reportId);

    if (!report) {
      return res.status(404).json({
        error: "Report not found or expired"
      });
    }

    // Return the complete report
    return res.status(200).json({
      reportId: report.reportId,
      scores: report.scores,
      coverage: report.coverage,
      ruleFindings: report.ruleFindings,
      gaps: report.gaps,
      meta: report.meta,
    });
  } catch (error) {
    console.error("Error in getReportById:", error);
    return res.status(500).json({ error: "Failed to retrieve report." });
  }
};

/**
 * Handles the GET /reports?limit=10 endpoint (P1 feature)
 * Response: Array of recent report summaries
 */
export const getRecentReportsList = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const limitParam = req.query.limit as string;
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    // Validate limit parameter
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        error: "Invalid limit parameter. Must be between 1 and 100."
      });
    }

    const reports = await getRecentReports(limit);

    return res.status(200).json({
      reports: reports.map(report => ({
        id: report.id,
        createdAt: report.createdAt,
        overallScore: report.scoresOverall,
        country: report.country,
        erp: report.erp,
      }))
    });
  } catch (error) {
    console.error("Error in getRecentReportsList:", error);
    return res.status(500).json({ error: "Failed to retrieve recent reports." });
  }
};
