import Ably from 'ably';
import { ClickHouseClient } from '@clickhouse/client';
import { initClickHouseClient } from '@mevscan/shared/clickhouse';
import { getAbly } from '@mevscan/shared/ably';
import { publishExpressLaneTransactions } from './services/expressLaneService';
import { config } from '@mevscan/shared/config';

let channelLastStoredBlockNumberTxIndex: Record<string, [number, number]> = {};
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

(async () => {
    const { clickhouseClient, ably } = await init();

    while (true) {
        await publishExpressLaneTransactions(ably, clickhouseClient, channelLastStoredBlockNumberTxIndex);
        await new Promise(resolve => setTimeout(resolve, config.ably.refreshIntervalMs));
    }
})();