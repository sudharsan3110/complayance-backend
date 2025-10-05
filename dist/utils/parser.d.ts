export type InvoiceRow = Record<string, any>;
export declare const parseData: (dataString: string, format: "csv" | "json") => Promise<InvoiceRow[]>;
