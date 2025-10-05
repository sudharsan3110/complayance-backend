import "dotenv/config";
import express, { json, } from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api", apiRoutes);
app.get("/", (req, res) => {
    res.json({
        message: "E-Invoicing Readiness Analyzer API is running.",
        timestamp: new Date().toISOString(),
        database: "postgresql",
    });
});
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "postgresql",
    });
});
app.use((error, req, res, next) => {
    console.error("Global error handler:", error);
    res.status(500).json({
        error: "Internal server error",
        message: process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong",
    });
});
app.use((req, res) => {
    res.status(404).json({
        error: "Route not found",
        path: req.path,
        method: req.method,
    });
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
});
//# sourceMappingURL=server.js.map