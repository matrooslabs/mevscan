import { createClient, ClickHouseClient } from '@clickhouse/client';

export type ClickHouseConfig = {
    url: string,
    username: string,
    password: string,
    database: string
}

export function initClickHouseClient(config: ClickHouseConfig): ClickHouseClient {

    // Validate all required environment variables are present
    if (!config.url) {
        console.error('ERROR: CLICKHOUSE_URL environment variable is required');
        process.exit(1);
    }
    if (!config.username) {
        console.error('ERROR: CLICKHOUSE_USERNAME environment variable is required');
        process.exit(1);
    }
    if (config.password === undefined) {
        console.error('ERROR: CLICKHOUSE_PASSWORD environment variable is required');
        process.exit(1);
    }
    if (!config.database) {
        console.error('ERROR: CLICKHOUSE_DATABASE environment variable is required');
        process.exit(1);
    }

    return createClient({
        host: config.url,
        username: config.username,
        password: config.password,
        database: config.database,
    });
}