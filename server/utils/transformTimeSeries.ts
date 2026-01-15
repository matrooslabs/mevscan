import {
  TimeSeriesDataPoint,
  TimeSeriesByProtocolDataPoint,
  TimeSeriesPercentageDataPoint,
} from '../routes/types';

export interface RawTimeSeriesRow {
  time: number;
  total: number;
  normal: number;
  timeboost: number;
}

export interface RawProtocolTimeSeriesRow {
  time: number;
  proto: string;
  profit_usd: number;
}

export interface RawTimeSeriesPercentageRow {
  time: number;
  total: number;
  timeboost: number;
  percentage: number;
}

/**
 * Transform raw time series data.
 * Returns Unix timestamps (seconds) - frontend handles formatting based on time range.
 */
export function transformTimeSeriesData(data: RawTimeSeriesRow[]): TimeSeriesDataPoint[] {
  return data
    .filter((row) => row.time != null && !isNaN(row.time))
    .map((row) => ({
      time: row.time,
      total: row.total || 0,
      normal: row.normal || 0,
      timeboost: row.timeboost || 0,
    }));
}

/**
 * Transform protocol time series data.
 * Returns Unix timestamps (seconds) - frontend handles formatting based on time range.
 */
export function transformProtocolTimeSeriesData(
  data: RawProtocolTimeSeriesRow[]
): TimeSeriesByProtocolDataPoint[] {
  return data
    .filter((row) => row.time != null && !isNaN(row.time))
    .map((row) => ({
      time: row.time,
      proto: row.proto || '',
      profit_usd: row.profit_usd || 0,
    }));
}

/**
 * Transform percentage time series data.
 * Returns Unix timestamps (seconds) - frontend handles formatting based on time range.
 */
export function transformTimeSeriesPercentageData(
  data: RawTimeSeriesPercentageRow[]
): TimeSeriesPercentageDataPoint[] {
  return data
    .filter((row) => row.time != null && !isNaN(row.time))
    .map((row) => ({
      time: row.time,
      total: row.total || 0,
      timeboost: row.timeboost || 0,
      percentage: row.percentage || 0,
    }));
}
