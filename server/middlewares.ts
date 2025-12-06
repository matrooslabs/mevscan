import { Request, Response, NextFunction } from 'express';
import express from 'express';
import cors from 'cors';
import { ClickHouseClient } from '@clickhouse/client';
import {
  createCacheMiddleware,
  cleanupExpiredCache,
  DEFAULT_CACHE_EXPIRE_MS,
} from './middleware/cache';
import type { ErrorResponse } from '@mevscan/shared';
export {
  formatRelativeTime,
  formatEthValue,
  getTimeRangeFilter,
  getTimestampTimeRangeFilter,
} from './helper';

// Middleware to inject ClickHouse client into request context
// TypeScript declaration merging requires namespace syntax
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      clickhouse: ClickHouseClient;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

/**
 * Creates middleware to inject ClickHouse client into request context
 */
export function createClickHouseMiddleware(client: ClickHouseClient) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.clickhouse = client;
    next();
  };
}

/**
 * CORS middleware
 */
export function corsMiddleware() {
  return cors();
}

/**
 * JSON body parser middleware
 */
export function jsonMiddleware() {
  return express.json();
}

/**
 * Logging middleware (after express.json() to capture request body)
 */
export function loggingMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    // Log request
    const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
    
    // Build parameter string
    const params: string[] = [];
    
    // Query parameters
    const queryParams = Object.keys(req.query);
    if (queryParams.length > 0) {
      params.push(`query: ${JSON.stringify(req.query)}`);
    }
    
    // URL parameters (available after routing, but logged here for consistency)
    const urlParams = Object.keys(req.params);
    if (urlParams.length > 0) {
      params.push(`params: ${JSON.stringify(req.params)}`);
    }
    
    // Request body (for POST/PUT/PATCH)
    if (req.body && Object.keys(req.body).length > 0 && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
      params.push(`body: ${JSON.stringify(req.body)}`);
    }
    
    const paramString = params.length > 0 ? ` | ${params.join(' | ')}` : '';
    
    console.log(`[${timestamp}] ${req.method} ${req.path}${paramString} - IP: ${clientIP}`);
    
    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusColor = res.statusCode >= 400 ? '\x1b[31m' : res.statusCode >= 300 ? '\x1b[33m' : '\x1b[32m';
      const resetColor = '\x1b[0m';
      
      console.log(
        `[${timestamp}] ${req.method} ${req.path}${paramString} - ${statusColor}${res.statusCode}${resetColor} - ${duration}ms - ${clientIP}`
      );
    });
    
    next();
  };
}

/**
 * Caching middleware factory - pass a custom expiry or use the default
 */
export function cacheMiddleware(expireDurationMs = DEFAULT_CACHE_EXPIRE_MS) {
  return createCacheMiddleware(expireDurationMs);
}

/**
 * Setup periodic cache cleanup (every 5 minutes)
 */
export function setupCacheCleanup() {
  setInterval(() => {
    cleanupExpiredCache();
  }, 5 * 60 * 1000);
}

// Error handling middleware
export function errorHandlerMiddleware() {
  return (
    err: Error,
    req: Request,
    res: Response<ErrorResponse>,
    _next: NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ 
      error: 'Something went wrong!',
      message: err.message 
    });
  };
}

// 404 handler
export function notFoundMiddleware() {
  return (req: Request, res: Response<ErrorResponse>) => {
    res.status(404).json({ 
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`
    });
  };
}

