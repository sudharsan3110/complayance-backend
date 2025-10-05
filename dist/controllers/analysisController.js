import { analyzeUpload } from "../services/analysisService.js";
export const postAnalyze = async (req, res, next) => {
    try {
        const { uploadId, questionnaire } = req.body;
        if (!uploadId) {
            return res.status(400).json({
                error: "Missing required field: uploadId"
            });
        }
        if (!questionnaire) {
            return res.status(400).json({
                error: "Missing required field: questionnaire"
            });
        }
        const analysisResult = await analyzeUpload(uploadId, questionnaire);
        return res.status(200).json({
            reportId: analysisResult.reportId,
            scores: analysisResult.scores,
            coverage: analysisResult.coverage,
            ruleFindings: analysisResult.ruleFindings,
            gaps: analysisResult.gaps,
            meta: analysisResult.meta,
        });
    }
    catch (error) {
        console.error("Error in postAnalyze:", error);
        if (error instanceof Error && error.message === "Upload not found") {
            return res.status(404).json({ error: "Upload not found" });
        }
        return res.status(500).json({ error: "Failed to analyze upload." });
    }
};
//# sourceMappingURL=analysisController.js.map