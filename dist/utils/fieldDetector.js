import getsSchema from '../config/gets_v0_1_schema.json' assert { type: 'json' };
function normalizeFieldName(fieldName) {
    return fieldName
        .toLowerCase()
        .replace(/[_\s-]/g, '')
        .replace(/\./g, '');
}
function editDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i++)
        matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++)
        matrix[j][0] = j;
    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            if (str1[i - 1] === str2[j - 1]) {
                matrix[j][i] = matrix[j - 1][i - 1];
            }
            else {
                matrix[j][i] = Math.min(matrix[j - 1][i - 1] + 1, matrix[j][i - 1] + 1, matrix[j - 1][i] + 1);
            }
        }
    }
    return matrix[str2.length][str1.length];
}
function calculateSimilarity(getsField, candidateField) {
    const normalizedGets = normalizeFieldName(getsField);
    const normalizedCandidate = normalizeFieldName(candidateField);
    if (normalizedGets === normalizedCandidate) {
        return 1.0;
    }
    if (normalizedGets.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedGets)) {
        return 0.9;
    }
    if (normalizedCandidate.startsWith(normalizedGets) || normalizedGets.startsWith(normalizedCandidate)) {
        return 0.85;
    }
    const maxLength = Math.max(normalizedGets.length, normalizedCandidate.length);
    if (maxLength === 0)
        return 0;
    const distance = editDistance(normalizedGets, normalizedCandidate);
    const similarity = 1 - (distance / maxLength);
    return Math.max(0, similarity);
}
function inferDataType(value) {
    if (typeof value === 'boolean')
        return 'boolean';
    if (typeof value === 'number')
        return 'number';
    if (typeof value === 'string') {
        if (!isNaN(Number(value)) && !isNaN(parseFloat(value))) {
            return 'number';
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(value) || Date.parse(value)) {
            return 'date';
        }
        return 'string';
    }
    return 'string';
}
function isTypeCompatible(getsType, inferredType) {
    if (getsType === inferredType)
        return true;
    if (getsType === 'number' && inferredType === 'string')
        return true;
    if (getsType === 'date' && inferredType === 'string')
        return true;
    return false;
}
export function detectFieldMapping(parsedData) {
    if (!parsedData || parsedData.length === 0) {
        const getsFields = Object.keys(getsSchema.fields);
        return {
            matched: [],
            close: [],
            missing: getsFields
        };
    }
    const candidateFields = new Set();
    parsedData.forEach(row => {
        Object.keys(row).forEach(key => candidateFields.add(key));
    });
    const getsFields = Object.keys(getsSchema.fields);
    const matched = [];
    const close = [];
    const missing = [];
    const usedCandidates = new Set();
    for (const getsField of getsFields) {
        const getsFieldSpec = getsSchema.fields[getsField];
        let bestMatch = null;
        for (const candidate of candidateFields) {
            if (usedCandidates.has(candidate))
                continue;
            const similarity = calculateSimilarity(getsField, candidate);
            const sampleValue = parsedData[0][candidate];
            const inferredType = inferDataType(sampleValue);
            const typeCompatible = isTypeCompatible(getsFieldSpec.type, inferredType);
            let adjustedConfidence = similarity;
            if (!typeCompatible && similarity > 0.5) {
                adjustedConfidence *= 0.7;
            }
            if (adjustedConfidence >= 0.8) {
                matched.push(getsField);
                usedCandidates.add(candidate);
                bestMatch = null;
                break;
            }
            else if (adjustedConfidence > 0.5 && (!bestMatch || adjustedConfidence > bestMatch.confidence)) {
                bestMatch = { candidate, confidence: adjustedConfidence };
            }
        }
        if (bestMatch && !matched.includes(getsField)) {
            close.push({
                target: getsField,
                candidate: bestMatch.candidate,
                confidence: Math.round(bestMatch.confidence * 100) / 100
            });
            usedCandidates.add(bestMatch.candidate);
        }
    }
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
export function getMappedValue(row, getsField, coverage) {
    if (coverage.matched.includes(getsField)) {
        if (getsField.startsWith('lines[].')) {
            const lineField = getsField.replace('lines[].', '');
            return row[lineField] || row[`lines_${lineField}`] || row[`line_${lineField}`];
        }
        const normalizedField = getsField.replace('.', '_');
        return row[normalizedField] || row[getsField];
    }
    const closeMatch = coverage.close.find(c => c.target === getsField);
    if (closeMatch) {
        return row[closeMatch.candidate];
    }
    return undefined;
}
//# sourceMappingURL=fieldDetector.js.map