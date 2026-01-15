import Ably from 'ably';
import { ClickHouseClient } from '@clickhouse/client';
import { initClickHouseClient } from '@mevscan/shared/clickhouse';
import { publishExpressLaneTransactions } from './services/expressLaneService';
import { publishAuctionInfo } from './services/auctionService';
import { config } from './config';
import logger from './logger';

let channelLastStoredBlockNumberTxIndex: Record<string, [number, number]> = {};
let lastPublishedRound: Record<string, number> = {};
interface InitResult {
  clickhouseClient: ClickHouseClient;
  ably: Ably.Realtime;
}

async function init(): Promise<InitResult> {
  try {
    logger.info(`Initializing ClickHouse client and Ably with API key: ${config.ably.apiKey}`);
    const ably = new Ably.Realtime({ key: config.ably.apiKey });
    const clickhouseClient = initClickHouseClient(config.clickhouse);
    const pingResult = await clickhouseClient.ping();
    if (!pingResult.success) {
      logger.fatal('Failed to ping ClickHouse client');
      process.exit(1);
    }
    logger.info('ClickHouse client initialized successfully');
    return { clickhouseClient, ably };
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to initialize ClickHouse client');
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
    await publishExpressLaneTransactions(
      ably,
      clickhouseClient,
      channelLastStoredBlockNumberTxIndex
    );
    await publishAuctionInfo(ably, clickhouseClient, lastPublishedRound);
    await new Promise((resolve) => setTimeout(resolve, config.ably.refreshIntervalMs));
  }
})();
