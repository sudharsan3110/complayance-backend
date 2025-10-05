import type { Request, Response, NextFunction } from "express";
export declare const handleMultipartUpload: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const postUpload: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
