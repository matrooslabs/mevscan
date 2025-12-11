
import { createClient, ClickHouseClient } from '@clickhouse/client';
import { config } from './config';

export function initClickHouseClient(): ClickHouseClient {
    return createClient({
      host: config.clickhouse.url,
      username: config.clickhouse.username,
      password: config.clickhouse.password,
      database: config.clickhouse.database,
    });
  }