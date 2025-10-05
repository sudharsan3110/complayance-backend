import { getMappedValue } from '../utils/fieldDetector.js';
export function validateRules(parsedData, coverage) {
    const findings = [];
    findings.push(validateTotalsBalance(parsedData, coverage));
    findings.push(validateLineMath(parsedData, coverage));
    findings.push(validateDateISO(parsedData, coverage));
    findings.push(validateCurrencyAllowed(parsedData, coverage));
    findings.push(validateTrnPresent(parsedData, coverage));
    const passedRules = findings.filter(f => f.ok).length;
    const score = Math.round((passedRules / findings.length) * 100);
    return {
        findings,
        score
    };
}
function validateTotalsBalance(parsedData, coverage) {
    let hasValidationFailure = false;
    let exampleExpected;
    let exampleGot;
    for (const row of parsedData) {
        const totalExclVat = getMappedValue(row, 'invoice.total_excl_vat', coverage);
        const vatAmount = getMappedValue(row, 'invoice.vat_amount', coverage);
        const totalInclVat = getMappedValue(row, 'invoice.total_incl_vat', coverage);
        if (totalExclVat == null || vatAmount == null || totalInclVat == null) {
            continue;
        }
        const exclVat = parseFloat(totalExclVat);
        const vat = parseFloat(vatAmount);
        const inclVat = parseFloat(totalInclVat);
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
function validateLineMath(parsedData, coverage) {
    let hasValidationFailure = false;
    let exampleLine;
    let exampleExpected;
    let exampleGot;
    for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        const qty = getMappedValue(row, 'lines[].qty', coverage);
        const unitPrice = getMappedValue(row, 'lines[].unit_price', coverage);
        const lineTotal = getMappedValue(row, 'lines[].line_total', coverage);
        if (qty == null || unitPrice == null || lineTotal == null) {
            continue;
        }
        const quantity = parseFloat(qty);
        const price = parseFloat(unitPrice);
        const total = parseFloat(lineTotal);
        if (isNaN(quantity) || isNaN(price) || isNaN(total)) {
            continue;
        }
        const expected = quantity * price;
        const tolerance = 0.01;
        if (Math.abs(expected - total) > tolerance) {
            hasValidationFailure = true;
            exampleLine = i + 1;
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
function validateDateISO(parsedData, coverage) {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    let hasValidationFailure = false;
    let exampleBadValue;
    for (const row of parsedData) {
        const issueDate = getMappedValue(row, 'invoice.issue_date', coverage);
        if (issueDate == null) {
            continue;
        }
        const dateString = String(issueDate);
        if (!isoDateRegex.test(dateString)) {
            hasValidationFailure = true;
            exampleBadValue = dateString;
            break;
        }
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
function validateCurrencyAllowed(parsedData, coverage) {
    const allowedCurrencies = ['AED', 'SAR', 'MYR', 'USD'];
    let hasValidationFailure = false;
    let exampleBadValue;
    for (const row of parsedData) {
        const currency = getMappedValue(row, 'invoice.currency', coverage);
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
function validateTrnPresent(parsedData, coverage) {
    let hasValidationFailure = false;
    for (const row of parsedData) {
        const buyerTrn = getMappedValue(row, 'buyer.trn', coverage);
        const sellerTrn = getMappedValue(row, 'seller.trn', coverage);
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
//# sourceMappingURL=rulesValidator.js.map