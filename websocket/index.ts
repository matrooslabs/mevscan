import PubNub from 'pubnub';
import { ClickHouseClient } from '@clickhouse/client';
import { initClickHouseClient } from '@mevscan/shared/clickhouse';
import { getPubNub } from '@mevscan/shared/pubnub';
import { publishExpressLaneProfit } from './services/expressLaneService';
import { config } from '@mevscan/shared/config';

let channelLastStoredTime: Record<string, number> = {};

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

(async () => {
    const { pubnub, clickhouseClient } = await init();

    while (true) {
        await publishExpressLaneProfit(pubnub, clickhouseClient, channelLastStoredTime);
        await new Promise(resolve => setTimeout(resolve, config.pubnub.refreshIntervalMs));
    }
})();