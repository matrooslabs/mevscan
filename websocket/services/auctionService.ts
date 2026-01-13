import Ably from 'ably';
import { ClickHouseClient } from "@clickhouse/client";
import { ABLY_CHANNELS } from "@mevscan/shared/ably";
import { AuctionInfo } from "@mevscan/shared/types";
import logger from '../logger';

async function getLatestAuctionInfo(clickhouseClient: ClickHouseClient): Promise<AuctionInfo | null> {
    const query = `
        SELECT
            block_number as blockNumber,
            log_index as logIndex,
            tx_hash as txHash,
            contract_address as contractAddress,
            is_multi_bid_auction as isMultiBidAuction,
            round,
            first_price_bidder as firstPriceBidder,
            first_price_express_lane_controller as firstPriceExpressLaneController,
            first_price_amount as firstPriceAmount,
            price,
            toUnixTimestamp(round_start_timestamp) as roundStartTimestamp,
            toUnixTimestamp(round_end_timestamp) as roundEndTimestamp
        FROM timeboost.auction
        ORDER BY round DESC
        LIMIT 1
    `;

    const result = await clickhouseClient.query({
        query,
        format: 'JSONEachRow',
    });

    const data = await result.json<Array<AuctionInfo>>();
    return data[0] ?? null;
}

export async function publishAuctionInfo(
    ably: Ably.Realtime,
    clickhouseClient: ClickHouseClient,
    lastPublishedRound: Record<string, number>
) {
        const ablyChannel = ably.channels.get(ABLY_CHANNELS.AUCTION_INFO);
        let lastRound = lastPublishedRound[ABLY_CHANNELS.AUCTION_INFO] ?? null;

        const auctionInfo = await getLatestAuctionInfo(clickhouseClient);
        if (!auctionInfo) {
            logger.warn('No auction info found from db to publish');
            return;
        }

        // Only publish if round has changed
        if (lastRound !== null && auctionInfo.round === lastRound) {
            return;
        }

        logger.info({ info: auctionInfo }, 'Publishing auction info');
        await ablyChannel.publish(ABLY_CHANNELS.AUCTION_INFO, auctionInfo);
        lastPublishedRound[ABLY_CHANNELS.AUCTION_INFO] = auctionInfo.round;
}
