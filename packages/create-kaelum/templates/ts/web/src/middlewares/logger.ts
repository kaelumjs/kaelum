// middlewares/logger.ts
// Simple request logger middleware
const logger = (req: any, res: any, next: any): void => {
  const now = new Date();
  console.log(`[${now.toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
};

export { logger };
