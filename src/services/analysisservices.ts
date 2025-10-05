// src/services/analysisService.ts

import prisma from "@/config/database.js";
import { parseData, type InvoiceRow } from "@/utils/parser.js";

interface UploadResult {
  uploadId: string;
  rowsParsed: number;
}

/**
 * Ingests data, parses it, and persists the raw string data to the database.
 */
export const handleUpload = async (
  dataString: string,
  contentType: "csv" | "json",
  context: { country?: string; erp?: string },
): Promise<UploadResult> => {
  try {
    // 1. Parse the data string (capped at 200 rows)
    const parsedRows: InvoiceRow[] = await parseData(dataString, contentType);

    // 2. Persist the RAW data string and metadata
    const upload = await prisma.upload.create({
      data: {
        rawData: dataString, // Store the full raw string
        rowsParsed: parsedRows.length,
        country: context.country,
        erp: context.erp,
      },
      select: { id: true, rowsParsed: true },
    });

    return { uploadId: upload.id, rowsParsed: upload.rowsParsed };
  } catch (error) {
    console.error("Upload handling failed:", error);
    // In a real application, you'd throw a more specific HTTP error
    throw new Error("Data ingestion and persistence failed.");
  }
};
