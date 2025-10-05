import prisma from "../config/database.js";
import { parseData } from "../utils/parser.js";
export const handleUpload = async (dataString, contentType, context) => {
    try {
        const parsedRows = await parseData(dataString, contentType);
        const upload = await prisma.upload.create({
            data: {
                rawData: dataString,
                rowsParsed: parsedRows.length,
                country: context.country,
                erp: context.erp,
            },
            select: { id: true, rowsParsed: true },
        });
        return { uploadId: upload.id, rowsParsed: upload.rowsParsed };
    }
    catch (error) {
        console.error("Upload handling failed:", error);
        throw new Error("Data ingestion and persistence failed.");
    }
};
//# sourceMappingURL=analysisservices.js.map