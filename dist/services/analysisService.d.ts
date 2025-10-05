import { type CoverageResult } from "../utils/fieldDetector.js";
import { type RulesResult } from "../utils/rulesValidator.js";
import { type ScoreBreakdown } from "../utils/scorer.js";
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
export declare const handleUpload: (dataString: string, contentType: "csv" | "json", context: {
    country?: string;
    erp?: string;
}) => Promise<UploadResult>;
export declare const analyzeUpload: (uploadId: string, questionnaire: Questionnaire) => Promise<AnalysisResult>;
export declare const getReport: (reportId: string) => Promise<AnalysisResult | null>;
export declare const getRecentReports: (limit?: number) => Promise<Array<{
    id: string;
    createdAt: Date;
    scoresOverall: number;
    country?: string;
    erp?: string;
}>>;
export {};
