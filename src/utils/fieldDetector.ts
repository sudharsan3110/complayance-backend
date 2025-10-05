// src/utils/fieldDetector.ts

import getsSchema from '@/config/gets_v0_1_schema.json' assert { type: 'json' };

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

/**
 * Normalizes field names for comparison
 */
function normalizeFieldName(fieldName: string): string {
  return fieldName
    .toLowerCase()
    .replace(/[_\s-]/g, '')
    .replace(/\./g, '');
}

/**
 * Calculates edit distance between two strings (Levenshtein distance)
 */
function editDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1,
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculates similarity between two field names
 */
function calculateSimilarity(getsField: string, candidateField: string): number {
  const normalizedGets = normalizeFieldName(getsField);
  const normalizedCandidate = normalizeFieldName(candidateField);

  // Exact match after normalization
  if (normalizedGets === normalizedCandidate) {
    return 1.0;
  }

  // Check if one contains the other
  if (normalizedGets.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedGets)) {
    return 0.9;
  }

  // Check if candidate starts with gets field name or vice versa
  if (normalizedCandidate.startsWith(normalizedGets) || normalizedGets.startsWith(normalizedCandidate)) {
    return 0.85;
  }

  // Calculate edit distance similarity
  const maxLength = Math.max(normalizedGets.length, normalizedCandidate.length);
  if (maxLength === 0) return 0;

  const distance = editDistance(normalizedGets, normalizedCandidate);
  const similarity = 1 - (distance / maxLength);

  return Math.max(0, similarity);
}

/**
 * Infers the data type of a value
 */
function inferDataType(value: any): 'string' | 'number' | 'date' | 'boolean' {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    // Check if it's a number string
    if (!isNaN(Number(value)) && !isNaN(parseFloat(value))) {
      return 'number';
    }
    // Check if it's a date string (basic check)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value) || Date.parse(value)) {
      return 'date';
    }
    return 'string';
  }
  return 'string';
}

/**
 * Checks if the inferred type is compatible with the expected GETS type
 */
function isTypeCompatible(getsType: string, inferredType: string): boolean {
  if (getsType === inferredType) return true;

  // Allow number strings to match number fields
  if (getsType === 'number' && inferredType === 'string') return true;

  // Allow date strings to match date fields
  if (getsType === 'date' && inferredType === 'string') return true;

  return false;
}

/**
 * Detects and maps fields from parsed invoice data to GETS schema
 */
export function detectFieldMapping(parsedData: any[]): CoverageResult {
  if (!parsedData || parsedData.length === 0) {
    const getsFields = Object.keys(getsSchema.fields);
    return {
      matched: [],
      close: [],
      missing: getsFields
    };
  }

  // Get all unique field names from the parsed data
  const candidateFields = new Set<string>();
  parsedData.forEach(row => {
    Object.keys(row).forEach(key => candidateFields.add(key));
  });

  const getsFields = Object.keys(getsSchema.fields);
  const matched: string[] = [];
  const close: FieldMatch[] = [];
  const missing: string[] = [];
  const usedCandidates = new Set<string>();

  // First pass: find exact and high-confidence matches
  for (const getsField of getsFields) {
    const getsFieldSpec = getsSchema.fields[getsField as keyof typeof getsSchema.fields];
    let bestMatch: { candidate: string; confidence: number } | null = null;

    for (const candidate of candidateFields) {
      if (usedCandidates.has(candidate)) continue;

      const similarity = calculateSimilarity(getsField, candidate);

      // Check type compatibility with sample data
      const sampleValue = parsedData[0][candidate];
      const inferredType = inferDataType(sampleValue);
      const typeCompatible = isTypeCompatible(getsFieldSpec.type, inferredType);

      // Adjust confidence based on type compatibility
      let adjustedConfidence = similarity;
      if (!typeCompatible && similarity > 0.5) {
        adjustedConfidence *= 0.7; // Reduce confidence for type mismatches
      }

      if (adjustedConfidence >= 0.8) {
        // High confidence match - use immediately
        matched.push(getsField);
        usedCandidates.add(candidate);
        bestMatch = null;
        break;
      } else if (adjustedConfidence > 0.5 && (!bestMatch || adjustedConfidence > bestMatch.confidence)) {
        bestMatch = { candidate, confidence: adjustedConfidence };
      }
    }

    // If we found a close match but not an exact match, add to close matches
    if (bestMatch && !matched.includes(getsField)) {
      close.push({
        target: getsField,
        candidate: bestMatch.candidate,
        confidence: Math.round(bestMatch.confidence * 100) / 100
      });
      usedCandidates.add(bestMatch.candidate);
    }
  }

  // Determine missing fields
  for (const getsField of getsFields) {
    if (!matched.includes(getsField) && !close.some(c => c.target === getsField)) {
      missing.push(getsField);
    }
  }

  return {
    matched,
    close,
    missing
  };
}

/**
 * Gets the mapped value for a GETS field from a data row
 */
export function getMappedValue(row: any, getsField: string, coverage: CoverageResult): any {
  // Check if it's a direct match
  if (coverage.matched.includes(getsField)) {
    // For nested fields like lines[].sku, handle specially
    if (getsField.startsWith('lines[].')) {
      const lineField = getsField.replace('lines[].', '');
      return row[lineField] || row[`lines_${lineField}`] || row[`line_${lineField}`];
    }

    // Handle dot notation fields like invoice.id -> invoice_id
    const normalizedField = getsField.replace('.', '_');
    return row[normalizedField] || row[getsField];
  }

  // Check if it's a close match
  const closeMatch = coverage.close.find(c => c.target === getsField);
  if (closeMatch) {
    return row[closeMatch.candidate];
  }

  return undefined;
}
