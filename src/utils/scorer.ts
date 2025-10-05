// src/utils/scorer.ts

import { CoverageResult } from '@/utils/fieldDetector.js';
import { RulesResult } from '@/utils/rulesValidator.js';
import getsSchema from '@/config/gets_v0_1_schema.json' assert { type: 'json' };

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

/**
 * Calculates comprehensive scores based on the analysis results
 */
export function calculateScores(input: ScoringInput): ScoreBreakdown {
  const dataScore = calculateDataScore(input.parsedRowsCount, input.totalRowsAttempted);
  const coverageScore = calculateCoverageScore(input.coverage);
  const rulesScore = input.rulesResult.score;
  const postureScore = calculatePostureScore(input.questionnaire);

  // Calculate overall score with specified weights
  const overall = calculateOverallScore({
    data: dataScore,
    coverage: coverageScore,
    rules: rulesScore,
    posture: postureScore
  });

  return {
    data: dataScore,
    coverage: coverageScore,
    rules: rulesScore,
    posture: postureScore,
    overall: overall
  };
}

/**
 * Data Score (25%) - Share of rows parsed; basic type inference success
 */
function calculateDataScore(parsedRows: number, totalRows: number): number {
  if (totalRows === 0) return 0;

  const parseSuccessRate = parsedRows / totalRows;

  // Scale the success rate to 0-100
  return Math.round(parseSuccessRate * 100);
}

/**
 * Coverage Score (35%) - Matched required fields vs GETS
 * (weight header/seller/buyer slightly higher than lines)
 */
function calculateCoverageScore(coverage: CoverageResult): number {
  const getsFields = Object.keys(getsSchema.fields);
  const categories = getsSchema.categories;

  let weightedScore = 0;
  let totalWeight = 0;

  // Calculate score by category with different weights
  for (const [categoryName, categoryInfo] of Object.entries(categories)) {
    const categoryFields = getsFields.filter(field =>
      getsSchema.fields[field as keyof typeof getsSchema.fields].category === categoryName
    );

    if (categoryFields.length === 0) continue;

    // Count matches and close matches for this category
    const matchedInCategory = coverage.matched.filter(field =>
      getsSchema.fields[field as keyof typeof getsSchema.fields].category === categoryName
    ).length;

    const closeInCategory = coverage.close.filter(closeMatch =>
      getsSchema.fields[closeMatch.target as keyof typeof getsSchema.fields].category === categoryName
    ).length;

    // Close matches count as partial score (weighted by confidence)
    const closeScore = coverage.close
      .filter(closeMatch =>
        getsSchema.fields[closeMatch.target as keyof typeof getsSchema.fields].category === categoryName
      )
      .reduce((sum, closeMatch) => sum + (closeMatch.confidence * 0.7), 0);

    const categoryScore = (matchedInCategory + closeScore) / categoryFields.length;
    const categoryWeight = categoryInfo.weight;

    weightedScore += categoryScore * categoryWeight;
    totalWeight += categoryWeight;
  }

  const finalScore = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
  return Math.round(Math.min(100, Math.max(0, finalScore)));
}

/**
 * Posture Score (10%) - From questionnaire scaled to 0-100
 */
function calculatePostureScore(questionnaire: {
  webhooks?: boolean;
  sandbox_env?: boolean;
  retries?: boolean;
}): number {
  const questions = ['webhooks', 'sandbox_env', 'retries'] as const;
  let positiveAnswers = 0;

  for (const question of questions) {
    if (questionnaire[question] === true) {
      positiveAnswers++;
    }
  }

  // Scale to 0-100 based on positive answers
  const score = (positiveAnswers / questions.length) * 100;
  return Math.round(score);
}

/**
 * Overall Score - Weighted sum based on specified weights
 */
function calculateOverallScore(scores: Omit<ScoreBreakdown, 'overall'>): number {
  const weights = {
    data: 0.25,     // 25%
    coverage: 0.35, // 35%
    rules: 0.30,    // 30%
    posture: 0.10   // 10%
  };

  const weightedSum = (
    scores.data * weights.data +
    scores.coverage * weights.coverage +
    scores.rules * weights.rules +
    scores.posture * weights.posture
  );

  return Math.round(Math.min(100, Math.max(0, weightedSum)));
}

/**
 * Determines readiness label based on overall score
 */
export function getReadinessLabel(overallScore: number): 'Low' | 'Medium' | 'High' {
  if (overallScore >= 75) return 'High';
  if (overallScore >= 50) return 'Medium';
  return 'Low';
}

/**
 * Generates gap analysis based on coverage and rules results
 */
export function generateGaps(coverage: CoverageResult, rulesResult: RulesResult): string[] {
  const gaps: string[] = [];

  // Add coverage gaps
  for (const missingField of coverage.missing) {
    const fieldSpec = getsSchema.fields[missingField as keyof typeof getsSchema.fields];
    if (fieldSpec && fieldSpec.required) {
      gaps.push(`Missing required field: ${missingField}`);
    }
  }

  // Add rule violations
  for (const finding of rulesResult.findings) {
    if (!finding.ok) {
      switch (finding.rule) {
        case 'TOTALS_BALANCE':
          gaps.push('Invoice totals do not balance (total_excl_vat + vat_amount ≠ total_incl_vat)');
          break;
        case 'LINE_MATH':
          gaps.push('Line item calculations incorrect (qty × unit_price ≠ line_total)');
          break;
        case 'DATE_ISO':
          gaps.push(`Invalid date format: ${finding.value || 'dates'} should be YYYY-MM-DD`);
          break;
        case 'CURRENCY_ALLOWED':
          gaps.push(`Invalid currency: ${finding.value || 'currency'} not in allowed list [AED, SAR, MYR, USD]`);
          break;
        case 'TRN_PRESENT':
          gaps.push('Missing buyer.trn or seller.trn');
          break;
      }
    }
  }

  return gaps;
}
