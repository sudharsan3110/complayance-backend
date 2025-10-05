import type { Request, Response, NextFunction } from "express";
export declare const getReportById: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const getRecentReportsList: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
