import dotenv from 'dotenv';
import PubNub from 'pubnub';
import { PUBNUB_CHANNELS, TIME_RANGES } from '@mevscan/shared/constants';
import { initClickHouseClient, type ClickHouseConfig } from '@mevscan/shared/clickhouse';
import { ClickHouseClient } from '@clickhouse/client';
import { getGrossMevFromBlocktime, GrossMevDataResponse } from './services/grossMevService';

dotenv.config();

const pubnub = new PubNub({
    subscribeKey: process.env.PUBNUB_SUBSCRIBE_KEY || "",
    publishKey: process.env.PUBNUB_PUBLISH_KEY || "",
    secretKey: process.env.PUBNUB_SECRET_KEY || "",
    userId: process.env.PUBNUB_USER_ID || ""
});


let clickhouseClient: ClickHouseClient | null = null;
let channelLastStoredTime: Record<string, number> = {};
let refreshInterval = 20 * 1000; // 20 seconds

async function refreshAndPublish(clickhouseClient: ClickHouseClient, pubnub: PubNub) {
    let lastStoredTime = channelLastStoredTime[PUBNUB_CHANNELS.GROSS_MEV];
    if (!lastStoredTime) {
        // Fetch from pubnub message to get last stored time
        const message = await pubnub.fetchMessages({
            channels: [PUBNUB_CHANNELS.GROSS_MEV],
            count: 1,
        });

        const fetchedMessage = message.channels[PUBNUB_CHANNELS.GROSS_MEV];
        if (!fetchedMessage || fetchedMessage.length === 0) {
            lastStoredTime = Math.floor((Date.now() - 60 * 60 * 1000) / 1000);
        } else {
            const grossData = fetchedMessage[0]!.message as unknown as GrossMevDataResponse[];
            lastStoredTime = grossData[grossData.length - 1]!.time + 1;
        }
    }

    const grossMevData = await getGrossMevFromBlocktime(clickhouseClient, lastStoredTime);
    if (!grossMevData || grossMevData.length === 0) {
        return;
    }
    console.log(grossMevData);

    pubnub.publish({
        channel: PUBNUB_CHANNELS.GROSS_MEV,
        message: grossMevData as any
    }, (status, response) => {
        if (status.error) {
            console.error('Error publishing Gross MEV data:', status.error);
        }
    });

    channelLastStoredTime[PUBNUB_CHANNELS.GROSS_MEV] = grossMevData[grossMevData.length - 1]!.time;
}


(async () => {
    try {
        const clickHouseConfig: ClickHouseConfig = {
            url: process.env.CLICKHOUSE_URL || '',
            username: process.env.CLICKHOUSE_USERNAME || '',
            password: process.env.CLICKHOUSE_PASSWORD || '',
            database: process.env.CLICKHOUSE_DATABASE || '',
        };
        clickhouseClient = initClickHouseClient(clickHouseConfig);
        const pingResult = await clickhouseClient.ping();
        if (!pingResult.success) {
            console.error('ERROR: Failed to ping ClickHouse client');
            process.exit(1);
        }
        console.log('✓ ClickHouse client initialized successfully');
    } catch (error) {
        console.error('ERROR: Failed to initialize ClickHouse client:', error);
        process.exit(1);
    }

    while (true) {
        await refreshAndPublish(clickhouseClient!, pubnub);
        await new Promise(resolve => setTimeout(resolve, refreshInterval));
    }
})();