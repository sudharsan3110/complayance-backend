import { handleUpload } from "../services/analysisService.js";
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });
export const handleMultipartUpload = upload.single("file");
export const postUpload = async (req, res, next) => {
    let dataString;
    let contentType;
    let country;
    let erp;
    try {
        if (req.file) {
            dataString = req.file.buffer.toString("utf8");
            contentType = req.file.mimetype.includes("json") ? "json" : "csv";
            country = req.body.country || undefined;
            erp = req.body.erp || undefined;
        }
        else if (req.body && req.body.text) {
            dataString = req.body.text;
            contentType =
                dataString.trim().startsWith("{") || dataString.trim().startsWith("[")
                    ? "json"
                    : "csv";
            country = req.body.country || undefined;
            erp = req.body.erp || undefined;
        }
        else {
            return res
                .status(400)
                .json({ error: 'Missing file or "text" property in body.' });
        }
        const { uploadId } = await handleUpload(dataString, contentType, {
            country,
            erp,
        });
        return res.status(201).json({ uploadId });
    }
    catch (error) {
        console.error("Error in postUpload:", error);
        return res.status(500).json({ error: "Failed to process upload." });
    }
};
//# sourceMappingURL=uploadController.js.map