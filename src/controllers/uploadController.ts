import type { Request, Response, NextFunction } from "express";
import { handleUpload } from "@/services/analysisService.js";
import multer from "multer";

// Configure multer for file uploads (in-memory storage for file content processing)
const upload = multer({ storage: multer.memoryStorage() });

// Middleware for handling file uploads (multipart)
export const handleMultipartUpload = upload.single("file");

/**
 * Handles the POST /upload endpoint. Accepts multipart/form-data (file) or JSON body.
 * Response: { "uploadId": "u_xxx" }
 */
export const postUpload = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let dataString: string;
  let contentType: "csv" | "json";
  let country: string | undefined;
  let erp: string | undefined;

  try {
    // Case 1: Multipart file upload
    if (req.file) {
      dataString = req.file.buffer.toString("utf8");
      contentType = req.file.mimetype.includes("json") ? "json" : "csv";

      // Context from body fields if provided with multipart
      country = (req.body.country as string) || undefined;
      erp = (req.body.erp as string) || undefined;

      // Case 2: JSON body upload
    } else if (req.body && req.body.text) {
      dataString = req.body.text as string;
      // Simple format detection based on content
      contentType =
        dataString.trim().startsWith("{") || dataString.trim().startsWith("[")
          ? "json"
          : "csv";

      country = (req.body.country as string) || undefined;
      erp = (req.body.erp as string) || undefined;
    } else {
      return res
        .status(400)
        .json({ error: 'Missing file or "text" property in body.' });
    }

    const { uploadId } = await handleUpload(dataString, contentType, {
      country,
      erp,
    });

    return res.status(201).json({ uploadId });
  } catch (error) {
    console.error("Error in postUpload:", error);
    return res.status(500).json({ error: "Failed to process upload." });
  }
};
