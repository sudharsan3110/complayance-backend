// src/utils/rulesValidator.ts

import { CoverageResult, getMappedValue } from '@/utils/fieldDetector.js';

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
  score: number; // 0-100
}

/**
 * Validates all 5 required rules against the parsed invoice data
 */
export function validateRules(parsedData: any[], coverage: CoverageResult): RulesResult {
  const findings: RuleFinding[] = [];

  // Rule 1: TOTALS_BALANCE
  findings.push(validateTotalsBalance(parsedData, coverage));

  // Rule 2: LINE_MATH
  findings.push(validateLineMath(parsedData, coverage));

  // Rule 3: DATE_ISO
  findings.push(validateDateISO(parsedData, coverage));

  // Rule 4: CURRENCY_ALLOWED
  findings.push(validateCurrencyAllowed(parsedData, coverage));

  // Rule 5: TRN_PRESENT
  findings.push(validateTrnPresent(parsedData, coverage));

  // Calculate score (equal weight for each rule)
  const passedRules = findings.filter(f => f.ok).length;
  const score = Math.round((passedRules / findings.length) * 100);

  return {
    findings,
    score
  };
}

/**
 * Rule 1: TOTALS_BALANCE - total_excl_vat + vat_amount == total_incl_vat (±0.01)
 */
function validateTotalsBalance(parsedData: any[], coverage: CoverageResult): RuleFinding {
  let hasValidationFailure = false;
  let exampleExpected: number | undefined;
  let exampleGot: number | undefined;

  for (const row of parsedData) {
    const totalExclVat = getMappedValue(row, 'invoice.total_excl_vat', coverage);
    const vatAmount = getMappedValue(row, 'invoice.vat_amount', coverage);
    const totalInclVat = getMappedValue(row, 'invoice.total_incl_vat', coverage);

    // Skip validation if any required fields are missing
    if (totalExclVat == null || vatAmount == null || totalInclVat == null) {
      continue;
    }

    const exclVat = parseFloat(totalExclVat);
    const vat = parseFloat(vatAmount);
    const inclVat = parseFloat(totalInclVat);

    // Skip if values are not valid numbers
    if (isNaN(exclVat) || isNaN(vat) || isNaN(inclVat)) {
      continue;
    }

    const expected = exclVat + vat;
    const tolerance = 0.01;

    if (Math.abs(expected - inclVat) > tolerance) {
      hasValidationFailure = true;
      exampleExpected = Math.round(expected * 100) / 100;
      exampleGot = Math.round(inclVat * 100) / 100;
      break;
    }
  }

  return {
    rule: 'TOTALS_BALANCE',
    ok: !hasValidationFailure,
    ...(hasValidationFailure && exampleExpected != null && exampleGot != null
      ? { expected: exampleExpected, got: exampleGot }
      : {})
  };
}

/**
 * Rule 2: LINE_MATH - line_total == qty * unit_price (±0.01)
 */
function validateLineMath(parsedData: any[], coverage: CoverageResult): RuleFinding {
  let hasValidationFailure = false;
  let exampleLine: number | undefined;
  let exampleExpected: number | undefined;
  let exampleGot: number | undefined;

  for (let i = 0; i < parsedData.length; i++) {
    const row = parsedData[i];

    // Check if this row has line item data
    const qty = getMappedValue(row, 'lines[].qty', coverage);
    const unitPrice = getMappedValue(row, 'lines[].unit_price', coverage);
    const lineTotal = getMappedValue(row, 'lines[].line_total', coverage);

    // Skip validation if any required fields are missing
    if (qty == null || unitPrice == null || lineTotal == null) {
      continue;
    }

    const quantity = parseFloat(qty);
    const price = parseFloat(unitPrice);
    const total = parseFloat(lineTotal);

    // Skip if values are not valid numbers
    if (isNaN(quantity) || isNaN(price) || isNaN(total)) {
      continue;
    }

    const expected = quantity * price;
    const tolerance = 0.01;

    if (Math.abs(expected - total) > tolerance) {
      hasValidationFailure = true;
      exampleLine = i + 1; // 1-based line number
      exampleExpected = Math.round(expected * 100) / 100;
      exampleGot = Math.round(total * 100) / 100;
      break;
    }
  }

  return {
    rule: 'LINE_MATH',
    ok: !hasValidationFailure,
    ...(hasValidationFailure && exampleLine != null && exampleExpected != null && exampleGot != null
      ? { exampleLine, expected: exampleExpected, got: exampleGot }
      : {})
  };
}

/**
 * Rule 3: DATE_ISO - invoice.issue_date matches YYYY-MM-DD
 */
function validateDateISO(parsedData: any[], coverage: CoverageResult): RuleFinding {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  let hasValidationFailure = false;
  let exampleBadValue: string | undefined;

  for (const row of parsedData) {
    const issueDate = getMappedValue(row, 'invoice.issue_date', coverage);

    // Skip validation if field is missing
    if (issueDate == null) {
      continue;
    }

    const dateString = String(issueDate);

    if (!isoDateRegex.test(dateString)) {
      hasValidationFailure = true;
      exampleBadValue = dateString;
      break;
    }

    // Additional validation: check if it's a valid date
    const date = new Date(dateString);
    const isValidDate = date instanceof Date && !isNaN(date.getTime());

    if (!isValidDate) {
      hasValidationFailure = true;
      exampleBadValue = dateString;
      break;
    }
  }

  return {
    rule: 'DATE_ISO',
    ok: !hasValidationFailure,
    ...(hasValidationFailure && exampleBadValue
      ? { value: exampleBadValue }
      : {})
  };
}

/**
 * Rule 4: CURRENCY_ALLOWED - currency ∈ [AED, SAR, MYR, USD]
 */
function validateCurrencyAllowed(parsedData: any[], coverage: CoverageResult): RuleFinding {
  const allowedCurrencies = ['AED', 'SAR', 'MYR', 'USD'];
  let hasValidationFailure = false;
  let exampleBadValue: string | undefined;

  for (const row of parsedData) {
    const currency = getMappedValue(row, 'invoice.currency', coverage);

    // Skip validation if field is missing
    if (currency == null) {
      continue;
    }

    const currencyString = String(currency).toUpperCase();

    if (!allowedCurrencies.includes(currencyString)) {
      hasValidationFailure = true;
      exampleBadValue = currencyString;
      break;
    }
  }

  return {
    rule: 'CURRENCY_ALLOWED',
    ok: !hasValidationFailure,
    ...(hasValidationFailure && exampleBadValue
      ? { value: exampleBadValue }
      : {})
  };
}

/**
 * Rule 5: TRN_PRESENT - buyer.trn and seller.trn non-empty
 */
function validateTrnPresent(parsedData: any[], coverage: CoverageResult): RuleFinding {
  let hasValidationFailure = false;

  for (const row of parsedData) {
    const buyerTrn = getMappedValue(row, 'buyer.trn', coverage);
    const sellerTrn = getMappedValue(row, 'seller.trn', coverage);

    // Check if either TRN is missing or empty
    const buyerTrnValid = buyerTrn != null && String(buyerTrn).trim() !== '';
    const sellerTrnValid = sellerTrn != null && String(sellerTrn).trim() !== '';

    if (!buyerTrnValid || !sellerTrnValid) {
      hasValidationFailure = true;
      break;
    }
  }

  return {
    rule: 'TRN_PRESENT',
    ok: !hasValidationFailure
  };
}
