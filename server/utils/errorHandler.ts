import { Response } from 'express';

export function handleRouteError(error: unknown, res: Response, context: string) {
  console.error(`Error fetching ${context}:`, error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: error instanceof Error ? error.message : `Failed to fetch ${context}`,
  });
}
