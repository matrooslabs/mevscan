import dotenv from 'dotenv';
import PubNub from 'pubnub';
import { PUBNUB_CHANNELS, TIME_RANGES } from '@mevscan/shared/constants';
import { initClickHouseClient, type ClickHouseConfig } from '@mevscan/shared/clickhouse';
import { ClickHouseClient } from '@clickhouse/client';
import { generateGrossMevData } from './service';

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


const refreshInterval = 20000; // 20 seconds

// Function to refresh and publish Gross MEV data
async function refreshAndPublish() {
    if (!clickhouseClient) {
        console.error('ClickHouse client not initialized');
        return;
    }

    try {
        const grossMevData = await generateGrossMevData(clickhouseClient);

        for (const timeRange of TIME_RANGES) {
            const msg = grossMevData[timeRange];
            if (!msg) {
                continue;
            }

            pubnub.publish({
                channel: `${PUBNUB_CHANNELS.GROSS_MEV}_${timeRange}`,
                message: JSON.parse(JSON.stringify(msg)) // todo: find a way to improve this
            },
                (status, response) => {
                    if (status.error) {
                        console.error(`Error publishing ${timeRange} to PubNub:`, status.error);
                    } else {
                        console.log(`✓ Published Gross MEV data for ${timeRange} to PubNub`);
                    }
                });
        }
    } catch (error) {
        console.error('Error refreshing Gross MEV data:', error);
    }
}

// Initial refresh on startup
refreshAndPublish();

// Set up periodic refresh
setInterval(() => {
    refreshAndPublish();
}, refreshInterval);


// pubnub.publish({
//     channel: "test",
//     message: { "test": "hello1234" }
// },
//     (status, response) => {
//         console.log(status);
//         console.log(response);
//     })