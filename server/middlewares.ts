import { Request, Response, NextFunction } from 'express';
import express from 'express';
import cors from 'cors';
import { ClickHouseClient } from '@clickhouse/client';
import { minuteCacheMiddleware, cleanupExpiredCache } from './middleware/cache';
import type { ErrorResponse } from '@mevscan/shared';

// Middleware to inject ClickHouse client into request context
declare global {
  namespace Express {
    interface Request {
      clickhouse: ClickHouseClient;
    }
  }
}

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
 * Caching middleware - cache responses for the current minute
 */
export function cacheMiddleware() {
  return minuteCacheMiddleware;
}

/**
 * Setup periodic cache cleanup (every 5 minutes)
 */
export function setupCacheCleanup() {
  setInterval(() => {
    cleanupExpiredCache();
  }, 5 * 60 * 1000);
}

// Helper function to format relative time
export function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  
  if (diff < 60) return `${diff} secs ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

// Helper function to format ETH value
export function formatEthValue(wei: string | number): string {
  const value = typeof wei === 'string' ? BigInt(wei) : BigInt(wei);
  const eth = Number(value) / 1e18;
  return eth.toFixed(5);
}

// Helper function to convert timeRange string to ClickHouse interval
export function getTimeRangeFilter(timeRange: string): string {
  const validRanges = ['5min', '15min', '30min', '1hour', '12hours'];
  const range = timeRange || '15min';
  
  if (!validRanges.includes(range)) {
    throw new Error(`Invalid timeRange. Must be one of: ${validRanges.join(', ')}`);
  }
  
  switch (range) {
    case '5min':
      return `e.block_timestamp >= now() - INTERVAL 5 MINUTE`;
    case '15min':
      return `e.block_timestamp >= now() - INTERVAL 15 MINUTE`;
    case '30min':
      return `e.block_timestamp >= now() - INTERVAL 30 MINUTE`;
    case '1hour':
      return `e.block_timestamp >= now() - INTERVAL 1 HOUR`;
    case '12hours':
      return `e.block_timestamp >= now() - INTERVAL 12 HOUR`;
    default:
      return `e.block_timestamp >= now() - INTERVAL 15 MINUTE`;
  }
}

// Helper function to convert timeRange string to ClickHouse interval for timestamp column
export function getTimestampTimeRangeFilter(timeRange: string): string {
  const validRanges = ['5min', '15min', '30min', '1hour', '12hours'];
  const range = timeRange || '15min';
  
  if (!validRanges.includes(range)) {
    throw new Error(`Invalid timeRange. Must be one of: ${validRanges.join(', ')}`);
  }
  
  switch (range) {
    case '5min':
      return `timestamp >= now() - INTERVAL 5 MINUTE`;
    case '15min':
      return `timestamp >= now() - INTERVAL 15 MINUTE`;
    case '30min':
      return `timestamp >= now() - INTERVAL 30 MINUTE`;
    case '1hour':
      return `timestamp >= now() - INTERVAL 1 HOUR`;
    case '12hours':
      return `timestamp >= now() - INTERVAL 12 HOUR`;
    default:
      return `timestamp >= now() - INTERVAL 15 MINUTE`;
  }
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

