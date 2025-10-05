import type { Request, Response, NextFunction } from "express";
export declare const getHealth: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
