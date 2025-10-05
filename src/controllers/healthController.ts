// src/controllers/healthController.ts

import type { Request, Response, NextFunction } from "express";
import prisma from "@/config/database.js";

/**
 * Health check endpoint
 * Returns database status and system information
 * GET /health
 */
export const getHealth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Test database connection
    let dbStatus = "disconnected";
    let dbType = "unknown";
    let dbVersion = "unknown";
    
    try {
      // Simple query to test connection
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "connected";
      dbType = "postgresql";
      
      // Get database version
      const versionResult = await prisma.$queryRaw`SELECT version()`;
      if (Array.isArray(versionResult) && versionResult.length > 0) {
        const version = (versionResult[0] as any).version;
        dbVersion = version.split(' ')[0] || "unknown";
      }
    } catch (error) {
      console.error("Database health check failed:", error);
      dbStatus = "error";
    }

    // Get basic statistics
    let stats = {
      uploads: 0,
      reports: 0,
      lastReport: null as string | null,
    };

    try {
      if (dbStatus === "connected") {
        const [uploadCount, reportCount, lastReport] = await Promise.all([
          prisma.upload.count(),
          prisma.report.count(),
          prisma.report.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { id: true, createdAt: true }
          })
        ]);

        stats = {
          uploads: uploadCount,
          reports: reportCount,
          lastReport: lastReport ? `${lastReport.id} (${lastReport.createdAt.toISOString()})` : null,
        };
      }
    } catch (error) {
      console.error("Failed to get database statistics:", error);
    }

    const healthStatus = {
      status: dbStatus === "connected" ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        type: dbType,
        version: dbVersion,
      },
      statistics: stats,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
      },
    };

    const statusCode = dbStatus === "connected" ? 200 : 503;
    
    return res.status(statusCode).json(healthStatus);
  } catch (error) {
    console.error("Health check failed:", error);
    return res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
    });
  }
};

