import { 
  TimeSeriesDataPoint, 
  TimeSeriesByProtocolDataPoint,
  TimeSeriesPercentageDataPoint 
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

export function transformTimeSeriesData(data: RawTimeSeriesRow[]): TimeSeriesDataPoint[] {
  return data
    .filter((row) => row.time != null && !isNaN(row.time))
    .map((row) => {
      const date = new Date(row.time * 1000);
      if (isNaN(date.getTime())) {
        return null;
      }
      const hours = date.getHours().toString().padStart(2, '0');
      const mins = date.getMinutes().toString().padStart(2, '0');
      return {
        time: `${hours}:${mins}`,
        total: row.total || 0,
        normal: row.normal || 0,
        timeboost: row.timeboost || 0,
      };
    })
    .filter((item): item is TimeSeriesDataPoint => item !== null);
}

export function transformProtocolTimeSeriesData(data: RawProtocolTimeSeriesRow[]): TimeSeriesByProtocolDataPoint[] {
  return data
    .filter((row) => row.time != null && !isNaN(row.time))
    .map((row) => {
      const date = new Date(row.time * 1000);
      if (isNaN(date.getTime())) {
        return null;
      }
      const hours = date.getHours().toString().padStart(2, '0');
      const mins = date.getMinutes().toString().padStart(2, '0');
      return {
        time: `${hours}:${mins}`,
        proto: row.proto || '',
        profit_usd: row.profit_usd || 0,
      };
    })
    .filter((item): item is TimeSeriesByProtocolDataPoint => item !== null);
}

export function transformTimeSeriesPercentageData(data: RawTimeSeriesPercentageRow[]): TimeSeriesPercentageDataPoint[] {
  return data
    .filter((row) => row.time != null && !isNaN(row.time))
    .map((row) => {
      const date = new Date(row.time * 1000);
      if (isNaN(date.getTime())) {
        return null;
      }
      const hours = date.getHours().toString().padStart(2, '0');
      const mins = date.getMinutes().toString().padStart(2, '0');
      return {
        time: `${hours}:${mins}`,
        total: row.total || 0,
        timeboost: row.timeboost || 0,
        percentage: row.percentage || 0,
      };
    })
    .filter((item): item is TimeSeriesPercentageDataPoint => item !== null);
}
