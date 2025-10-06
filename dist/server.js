import "dotenv/config";
import express, { json, } from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import https from "https";
import fs from "fs";
const SSL_KEY_PATH = "/home/ec2-user/certs/privkey.pem";
const SSL_CERT_PATH = "/home/ec2-user/certs/fullchain.pem";
const sslOptions = {
    key: fs.readFileSync(SSL_KEY_PATH),
    cert: fs.readFileSync(SSL_CERT_PATH),
};
const app = express();
const PORT = 443;
console.log(process.env.FRONTEND_URL);
app.use(cors({
    origin: ["https://complayance-frontend.vercel.app"],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
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
https.createServer(sslOptions, app).listen(Number(PORT), "0.0.0.0", () => {
    console.log(`HTTPS server running on https://0.0.0.0:${PORT}`);
    console.log(`Health check available at https://0.0.0.0:${PORT}/health`);
});
//# sourceMappingURL=server.js.map