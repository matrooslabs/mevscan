import dotenv from 'dotenv';
import PubNub from 'pubnub';
import { PUBNUB_CHANNELS } from '@mevscan/shared/constants';
import { initClickHouseClient, type ClickHouseConfig } from '@mevscan/shared/clickhouse';
import { ClickHouseClient } from '@clickhouse/client';

dotenv.config();

const pubnub = new PubNub({
    subscribeKey: process.env.PUBNUB_SUBSCRIBE_KEY || "",
    publishKey: process.env.PUBNUB_PUBLISH_KEY || "",
    secretKey: process.env.PUBNUB_SECRET_KEY || "",
    userId: process.env.PUBNUB_USER_ID || ""
});


// Initialize ClickHouse client once
let clickhouseClient: ClickHouseClient | null = null;

// Initialize ClickHouse client at startup - exit if configuration is invalid
try {
    const clickHouseConfig: ClickHouseConfig = {
        url: process.env.CLICKHOUSE_URL || '',
        username: process.env.CLICKHOUSE_USERNAME || '',
        password: process.env.CLICKHOUSE_PASSWORD || '',
        database: process.env.CLICKHOUSE_DATABASE || '',
    };
    clickhouseClient = initClickHouseClient(clickHouseConfig);
    console.log('✓ ClickHouse client initialized successfully');
} catch (error) {
    console.error('ERROR: Failed to initialize ClickHouse client:', error);
    process.exit(1);
}


// pubnub.publish({
//     channel: "test",
//     message: { "test": "hello1234" }
// },
//     (status, response) => {
//         console.log(status);
//         console.log(response);
//     })