import PubNub from 'pubnub';
import { ClickHouseClient } from '@clickhouse/client';
import { initClickHouseClient } from '@mevscan/shared/clickhouse';
import { getPubNub } from '@mevscan/shared/pubnub';
import { publishExpressLaneProfit } from './services/expressLaneService';

let channelLastStoredTime: Record<string, number> = {};
let refreshInterval = 20 * 1000; // 20 seconds

interface InitResult {
    pubnub: PubNub;
    clickhouseClient: ClickHouseClient;
}

async function init(): Promise<InitResult> {
    try {
        const pubnub = getPubNub();
        const clickhouseClient = initClickHouseClient();
        const pingResult = await clickhouseClient.ping();
        if (!pingResult.success) {
            console.error('ERROR: Failed to ping ClickHouse client');
            process.exit(1);
        }
        console.log('✓ ClickHouse client initialized successfully');
        return { pubnub, clickhouseClient };
    } catch (error) {
        console.error('ERROR: Failed to initialize ClickHouse client:', error);
        process.exit(1);
    }
}

// check last saved from local cache or from pubnub history
// query for this round from this timestamp (including)
// publish query result to pubnub
// (there may be duplicated messages for a specific timestamp, deduplicate by selecting the later messages(published later))
// (because there may be edge cases where the timestamp has not fully been processed yet)


(async () => {
    const { pubnub, clickhouseClient } = await init();

    while (true) {
        await publishExpressLaneProfit(pubnub, clickhouseClient, channelLastStoredTime);
        await new Promise(resolve => setTimeout(resolve, refreshInterval));
    }
})();