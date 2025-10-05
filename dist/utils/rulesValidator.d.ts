import { CoverageResult } from '../utils/fieldDetector.js';
export interface RuleFinding {
    rule: string;
    ok: boolean;
    exampleLine?: number;
    expected?: number;
    got?: number;
    value?: string;
    message?: string;
}
export interface RulesResult {
    findings: RuleFinding[];
    score: number;
}
export declare function validateRules(parsedData: any[], coverage: CoverageResult): RulesResult;
