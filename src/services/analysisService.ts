// src/services/analysisService.ts

import prisma from "@/config/database.js";
import { parseData, type InvoiceRow } from "@/utils/parser.js";
import { detectFieldMapping, type CoverageResult } from "@/utils/fieldDetector.js";
import { validateRules, type RulesResult } from "@/utils/rulesValidator.js";
import { calculateScores, generateGaps, type ScoreBreakdown } from "@/utils/scorer.js";

interface UploadResult {
  uploadId: string;
  rowsParsed: number;
}

interface AnalysisResult {
  reportId: string;
  scores: ScoreBreakdown;
  coverage: CoverageResult;
  ruleFindings: RulesResult['findings'];
  gaps: string[];
  meta: {
    rowsParsed: number;
    linesTotal: number;
    country?: string;
    erp?: string;
    db: string;
  };
}

interface Questionnaire {
  webhooks?: boolean;
  sandbox_env?: boolean;
  retries?: boolean;
}

/**
 * Ingests data, parses it, and persists the raw string data to the database.
 */
export const handleUpload = async (
  dataString: string,
  contentType: "csv" | "json",
  context: { country?: string; erp?: string },
): Promise<UploadResult> => {
  try {
    // 1. Parse the data string (capped at 200 rows)
    const parsedRows: InvoiceRow[] = await parseData(dataString, contentType);

    // 2. Persist the RAW data string and metadata
    const upload = await prisma.upload.create({
      data: {
        rawData: dataString, // Store the full raw string
        rowsParsed: parsedRows.length,
        country: context.country,
        erp: context.erp,
      },
      select: { id: true, rowsParsed: true },
    });

    return { uploadId: upload.id, rowsParsed: upload.rowsParsed };
  } catch (error) {
    console.error("Upload handling failed:", error);
    throw new Error("Data ingestion and persistence failed.");
  }
};

/**
 * Analyzes uploaded data and generates a comprehensive report
 */
export const analyzeUpload = async (
  uploadId: string,
  questionnaire: Questionnaire
): Promise<AnalysisResult> => {
  try {
    // 1. Retrieve the upload from database
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
      select: {
        id: true,
        rawData: true,
        rowsParsed: true,
        country: true,
        erp: true,
      },
    });

    if (!upload) {
      throw new Error("Upload not found");
    }

    // 2. Parse the raw data again for analysis
    const contentType = upload.rawData.trim().startsWith('{') || upload.rawData.trim().startsWith('[') ? 'json' : 'csv';
    const parsedData: InvoiceRow[] = await parseData(upload.rawData, contentType);

    // 3. Detect field mapping to GETS schema
    const coverage = detectFieldMapping(parsedData);

    // 4. Validate business rules
    const rulesResult = validateRules(parsedData, coverage);

    // 5. Calculate comprehensive scores
    const scores = calculateScores({
      parsedRowsCount: parsedData.length,
      totalRowsAttempted: parsedData.length, // Since we successfully parsed, these are the same
      coverage,
      rulesResult,
      questionnaire,
    });

    // 6. Generate gap analysis
    const gaps = generateGaps(coverage, rulesResult);

    // 7. Count total line items
    const linesTotal = parsedData.reduce((total, row) => {
      // Check if row has line item data or if it represents a line item itself
      if (row.lines && Array.isArray(row.lines)) {
        return total + row.lines.length;
      }
      // If it's a flat structure, each row might be a line item
      return total + 1;
    }, 0);

    // 8. Create the report JSON
    const reportData = {
      scores,
      coverage,
      ruleFindings: rulesResult.findings,
      gaps,
      meta: {
        rowsParsed: parsedData.length,
        linesTotal,
        country: upload.country || undefined,
        erp: upload.erp || undefined,
        db: "postgresql", // Since we're using PostgreSQL with Prisma
      },
    };

    // 9. Persist the report
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const report = await prisma.report.create({
      data: {
        uploadId: upload.id,
        scoresOverall: scores.overall,
        reportJson: reportData as any, // Cast to any for JSON storage
        expiresAt,
        country: upload.country,
        erp: upload.erp,
      },
      select: { id: true },
    });

    return {
      reportId: report.id,
      ...reportData,
    };
  } catch (error) {
    console.error("Analysis failed:", error);
    throw new Error("Analysis processing failed.");
  }
};

/**
 * Retrieves a report by ID
 */
export const getReport = async (reportId: string): Promise<AnalysisResult | null> => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        reportJson: true,
        expiresAt: true,
      },
    });

    if (!report) {
      return null;
    }

    // Check if report has expired
    if (report.expiresAt && report.expiresAt < new Date()) {
      return null;
    }

    // Type assertion since we know the structure of reportJson
    const reportData = report.reportJson as any;

    return {
      reportId: report.id,
      scores: reportData.scores,
      coverage: reportData.coverage,
      ruleFindings: reportData.ruleFindings,
      gaps: reportData.gaps,
      meta: reportData.meta,
    };
  } catch (error) {
    console.error("Failed to retrieve report:", error);
    throw new Error("Report retrieval failed.");
  }
};

/**
 * Gets recent reports (for P1 functionality)
 */
export const getRecentReports = async (limit: number = 10): Promise<Array<{
  id: string;
  createdAt: Date;
  scoresOverall: number;
  country?: string;
  erp?: string;
}>> => {
  try {
    const reports = await prisma.report.findMany({
      where: {
        expiresAt: {
          gt: new Date(), // Only non-expired reports
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        scoresOverall: true,
        upload: {
          select: {
            country: true,
            erp: true,
          },
        },
      },
    });

    return reports.map((report: any) => ({
      id: report.id,
      createdAt: report.createdAt,
      scoresOverall: report.scoresOverall,
      country: report.upload.country,
      erp: report.upload.erp,
    }));
  } catch (error) {
    console.error("Failed to retrieve recent reports:", error);
    throw new Error("Recent reports retrieval failed.");
  }
};
