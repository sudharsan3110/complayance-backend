import getsSchema from '../config/gets_v0_1_schema.json' assert { type: 'json' };
export function calculateScores(input) {
    const dataScore = calculateDataScore(input.parsedRowsCount, input.totalRowsAttempted);
    const coverageScore = calculateCoverageScore(input.coverage);
    const rulesScore = input.rulesResult.score;
    const postureScore = calculatePostureScore(input.questionnaire);
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
function calculateDataScore(parsedRows, totalRows) {
    if (totalRows === 0)
        return 0;
    const parseSuccessRate = parsedRows / totalRows;
    return Math.round(parseSuccessRate * 100);
}
function calculateCoverageScore(coverage) {
    const getsFields = Object.keys(getsSchema.fields);
    const categories = getsSchema.categories;
    let weightedScore = 0;
    let totalWeight = 0;
    for (const [categoryName, categoryInfo] of Object.entries(categories)) {
        const categoryFields = getsFields.filter(field => getsSchema.fields[field].category === categoryName);
        if (categoryFields.length === 0)
            continue;
        const matchedInCategory = coverage.matched.filter(field => getsSchema.fields[field].category === categoryName).length;
        const closeInCategory = coverage.close.filter(closeMatch => getsSchema.fields[closeMatch.target].category === categoryName).length;
        const closeScore = coverage.close
            .filter(closeMatch => getsSchema.fields[closeMatch.target].category === categoryName)
            .reduce((sum, closeMatch) => sum + (closeMatch.confidence * 0.7), 0);
        const categoryScore = (matchedInCategory + closeScore) / categoryFields.length;
        const categoryWeight = categoryInfo.weight;
        weightedScore += categoryScore * categoryWeight;
        totalWeight += categoryWeight;
    }
    const finalScore = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
    return Math.round(Math.min(100, Math.max(0, finalScore)));
}
function calculatePostureScore(questionnaire) {
    const questions = ['webhooks', 'sandbox_env', 'retries'];
    let positiveAnswers = 0;
    for (const question of questions) {
        if (questionnaire[question] === true) {
            positiveAnswers++;
        }
    }
    const score = (positiveAnswers / questions.length) * 100;
    return Math.round(score);
}
function calculateOverallScore(scores) {
    const weights = {
        data: 0.25,
        coverage: 0.35,
        rules: 0.30,
        posture: 0.10
    };
    const weightedSum = (scores.data * weights.data +
        scores.coverage * weights.coverage +
        scores.rules * weights.rules +
        scores.posture * weights.posture);
    return Math.round(Math.min(100, Math.max(0, weightedSum)));
}
export function getReadinessLabel(overallScore) {
    if (overallScore >= 75)
        return 'High';
    if (overallScore >= 50)
        return 'Medium';
    return 'Low';
}
export function generateGaps(coverage, rulesResult) {
    const gaps = [];
    for (const missingField of coverage.missing) {
        const fieldSpec = getsSchema.fields[missingField];
        if (fieldSpec && fieldSpec.required) {
            gaps.push(`Missing required field: ${missingField}`);
        }
    }
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
//# sourceMappingURL=scorer.js.map