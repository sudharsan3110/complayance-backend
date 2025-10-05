export interface FieldMatch {
    target: string;
    candidate: string;
    confidence: number;
}
export interface CoverageResult {
    matched: string[];
    close: FieldMatch[];
    missing: string[];
}
export declare function detectFieldMapping(parsedData: any[]): CoverageResult;
export declare function getMappedValue(row: any, getsField: string, coverage: CoverageResult): any;
