import { CoverageResult } from '../utils/fieldDetector.js';
import { RulesResult } from '../utils/rulesValidator.js';
export interface ScoreBreakdown {
    data: number;
    coverage: number;
    rules: number;
    posture: number;
    overall: number;
}
export interface ScoringInput {
    parsedRowsCount: number;
    totalRowsAttempted: number;
    coverage: CoverageResult;
    rulesResult: RulesResult;
    questionnaire: {
        webhooks?: boolean;
        sandbox_env?: boolean;
        retries?: boolean;
    };
}
export declare function calculateScores(input: ScoringInput): ScoreBreakdown;
export declare function getReadinessLabel(overallScore: number): 'Low' | 'Medium' | 'High';
export declare function generateGaps(coverage: CoverageResult, rulesResult: RulesResult): string[];
