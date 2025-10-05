interface UploadResult {
    uploadId: string;
    rowsParsed: number;
}
export declare const handleUpload: (dataString: string, contentType: "csv" | "json", context: {
    country?: string;
    erp?: string;
}) => Promise<UploadResult>;
export {};
