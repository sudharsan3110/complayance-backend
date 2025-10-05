// src/server.ts

import "dotenv/config"; // Load environment variables
import express, {
  json,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import apiRoutes from "@/routes/index.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(json({ limit: "10mb" })); // To parse JSON bodies (for the JSON-based upload)
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // To parse URL-encoded bodies

// API Routes
app.use("/api", apiRoutes); // All routes will be prefixed with /api

// Simple health check
app.get("/", (req, res) => {
  res.json({
    message: "E-Invoicing Readiness Analyzer API is running.",
    timestamp: new Date().toISOString(),
    database: "postgresql",
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    database: "postgresql",
  });
});

// Global error handler
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Global error handler:", error);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});
