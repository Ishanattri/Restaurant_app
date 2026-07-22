import { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Express 4 doesn't forward rejected promises from async handlers to error
 * middleware — an uncaught rejection becomes an unhandled rejection at the
 * process level, which can crash the whole server. Wrap every async route
 * handler with this so errors always reach the error-handling middleware.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
