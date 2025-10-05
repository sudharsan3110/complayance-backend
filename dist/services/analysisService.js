import prisma from "../config/database.js";
import { parseData } from "../utils/parser.js";
import { detectFieldMapping } from "../utils/fieldDetector.js";
import { validateRules } from "../utils/rulesValidator.js";
import { calculateScores, generateGaps } from "../utils/scorer.js";
export const handleUpload = async (dataString, contentType, context) => {
    try {
        const parsedRows = await parseData(dataString, contentType);
        const upload = await prisma.upload.create({
            data: {
                rawData: dataString,
                rowsParsed: parsedRows.length,
                country: context.country,
                erp: context.erp,
            },
            select: { id: true, rowsParsed: true },
        });
        return { uploadId: upload.id, rowsParsed: upload.rowsParsed };
    }
    catch (error) {
        console.error("Upload handling failed:", error);
        throw new Error("Data ingestion and persistence failed.");
    }
};
export const analyzeUpload = async (uploadId, questionnaire) => {
    try {
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
        const contentType = upload.rawData.trim().startsWith('{') || upload.rawData.trim().startsWith('[') ? 'json' : 'csv';
        const parsedData = await parseData(upload.rawData, contentType);
        const coverage = detectFieldMapping(parsedData);
        const rulesResult = validateRules(parsedData, coverage);
        const scores = calculateScores({
            parsedRowsCount: parsedData.length,
            totalRowsAttempted: parsedData.length,
            coverage,
            rulesResult,
            questionnaire,
        });
        const gaps = generateGaps(coverage, rulesResult);
        const linesTotal = parsedData.reduce((total, row) => {
            if (row.lines && Array.isArray(row.lines)) {
                return total + row.lines.length;
            }
            return total + 1;
        }, 0);
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
                db: "postgresql",
            },
        };
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const report = await prisma.report.create({
            data: {
                uploadId: upload.id,
                scoresOverall: scores.overall,
                reportJson: reportData,
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
    }
    catch (error) {
        console.error("Analysis failed:", error);
        throw new Error("Analysis processing failed.");
    }
};
export const getReport = async (reportId) => {
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
        if (report.expiresAt && report.expiresAt < new Date()) {
            return null;
        }
        const reportData = report.reportJson;
        return {
            reportId: report.id,
            scores: reportData.scores,
            coverage: reportData.coverage,
            ruleFindings: reportData.ruleFindings,
            gaps: reportData.gaps,
            meta: reportData.meta,
        };
    }
    catch (error) {
        console.error("Failed to retrieve report:", error);
        throw new Error("Report retrieval failed.");
    }
};
export const getRecentReports = async (limit = 10) => {
    try {
        const reports = await prisma.report.findMany({
            where: {
                expiresAt: {
                    gt: new Date(),
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
        return reports.map((report) => ({
            id: report.id,
            createdAt: report.createdAt,
            scoresOverall: report.scoresOverall,
            country: report.upload.country,
            erp: report.upload.erp,
        }));
    }
    catch (error) {
        console.error("Failed to retrieve recent reports:", error);
        throw new Error("Recent reports retrieval failed.");
    }
};
//# sourceMappingURL=analysisService.js.map