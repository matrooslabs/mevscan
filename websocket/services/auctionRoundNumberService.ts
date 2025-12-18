import { ClickHouseClient } from "@clickhouse/client";
import { ABLY_CHANNELS } from "@mevscan/shared/ablyConstants";
import { config, NodeEnv } from "@mevscan/shared/config";
import Ably from 'ably';

async function getAuctionRoundNumber(clickhouseClient: ClickHouseClient): Promise<number | null> {
    const query = `
        SELECT 
        MAX(round) as auctionRoundNumber 
        from timeboost.auction
    `;

    const result = await clickhouseClient.query({
        query,
        format: 'JSONEachRow',
    });

    const data = await result.json<Array<{ auctionRoundNumber: number }>>();
    return data[0]?.auctionRoundNumber ?? null;
}

export async function publishAuctionRoundNumber(ably: Ably.Realtime, clickhouseClient: ClickHouseClient, state: { auctionRoundNumber: number | null }) {
    let ablyChannel = ably.channels.get(ABLY_CHANNELS.AUCTION_ROUND_NUMBER);
    let previousAuctionRoundNumber = state.auctionRoundNumber || 0;

    const auctionRoundNumber = await getAuctionRoundNumber(clickhouseClient);
    if (auctionRoundNumber === null) {
        return;
    }

    if (previousAuctionRoundNumber >= auctionRoundNumber) {
        return;
    }

    if (config.nodeEnv === NodeEnv.TEST) {
        console.log('Publishing Auction Round Number data:', auctionRoundNumber);
    } else {
        await ablyChannel.publish(ABLY_CHANNELS.AUCTION_ROUND_NUMBER, auctionRoundNumber);
    }

    state.auctionRoundNumber = auctionRoundNumber;
}