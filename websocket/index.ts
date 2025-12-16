import Ably from 'ably';
import { ClickHouseClient } from '@clickhouse/client';
import { initClickHouseClient } from '@mevscan/shared/clickhouse';
import { getAbly } from '@mevscan/shared/ably';
import { publishExpressLaneTransactions } from './services/expressLaneService';

let channelLastStoredBlockNumberTxIndex: Record<string, [number, number]> = {};
let refreshInterval = 20 * 1000; // 20 seconds

interface InitResult {
    clickhouseClient: ClickHouseClient;
    ably: Ably.Realtime;
}

async function init(): Promise<InitResult> {
    try {
        const ably = getAbly();
        const clickhouseClient = initClickHouseClient();
        const pingResult = await clickhouseClient.ping();
        if (!pingResult.success) {
            console.error('ERROR: Failed to ping ClickHouse client');
            process.exit(1);
        }
        console.log('✓ ClickHouse client initialized successfully');
        return { clickhouseClient, ably };
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
    const { clickhouseClient, ably } = await init();

    while (true) {
        await publishExpressLaneTransactions(ably, clickhouseClient, channelLastStoredBlockNumberTxIndex);
        await new Promise(resolve => setTimeout(resolve, refreshInterval));
    }
})();