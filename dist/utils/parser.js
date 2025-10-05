import csvParser from "csv-parser";
import { Readable } from "stream";
const MAX_ROWS = 200;
export const parseData = (dataString, format) => {
    return new Promise((resolve, reject) => {
        if (format === 'json') {
            try {
                const data = JSON.parse(dataString);
                const rows = Array.isArray(data) ? data : data.invoices || data.lines || [];
                resolve(rows.slice(0, MAX_ROWS));
            }
            catch (error) {
                reject(new Error('Invalid JSON format.'));
            }
            return;
        }
        if (format === 'csv') {
            const rows = [];
            const stream = Readable.from(dataString);
            stream.pipe(csvParser())
                .on('data', (data) => {
                if (rows.length < MAX_ROWS) {
                    rows.push(data);
                }
            })
                .on('end', () => {
                resolve(rows);
            })
                .on('error', (error) => {
                reject(new Error(`CSV Parsing Error: ${error.message}`));
            });
            return;
        }
        reject(new Error('Unsupported format.'));
    });
};
//# sourceMappingURL=parser.js.map