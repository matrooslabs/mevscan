import { createClient, ClickHouseClient } from '@clickhouse/client';

interface ClickHouseConfig {
  url: string;
  username: string;
  password: string;
  database: string;
}

export function initClickHouseClient(config: ClickHouseConfig): ClickHouseClient {
  return createClient({
    host: config.url,
    username: config.username,
    password: config.password,
    database: config.database,
  });
}
