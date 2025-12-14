// check last saved from local cache or from pubnub history
// query for this round from this timestamp (including)
// publish query result to pubnub
// (there may be duplicated messages for a specific timestamp, deduplicate by selecting the later messages(published later))
// (because there may be edge cases where the timestamp has not fully been processed yet)

import PubNub from "pubnub";
import Ably from 'ably';
import { ClickHouseClient } from "@clickhouse/client";
import { PUBNUB_CHANNELS } from "@mevscan/shared/pubnub";
import { config } from "@mevscan/shared/config";
import { ABLY_CHANNELS } from "@mevscan/shared/ably";

export interface ExpressLaneProfitData {
    time: number;
    profitUsd: number;
    expressLanePrice: number;
    currentRound: number;
}

export async function getExpressLaneProfitData(clickhouseClient: ClickHouseClient, lastStoredTime: number): Promise<ExpressLaneProfitData[]> {
    const query = `
        SELECT 
          toUnixTimestamp(toStartOfInterval(toDateTime(eth.block_timestamp), INTERVAL 30 second)) as time,
          sum(bh.profit_usd) as profitUsd,
          any(bh.express_lane_price) as expressLanePrice,
          any(bh.express_lane_round) as currentRound
        FROM mev.bundle_header bh 
        JOIN ethereum.blocks eth
          ON eth.block_number = bh.block_number 
        WHERE bh.timeboosted = true
          AND bh.express_lane_round = (SELECT max(express_lane_round) FROM mev.bundle_header WHERE timeboosted = true)
          AND eth.block_timestamp >= toDateTime({lastStoredTime:UInt32})
        GROUP BY time
        ORDER BY time ASC
    `;

    const result = await clickhouseClient.query({
        query,
        query_params: { lastStoredTime },
        format: 'JSONEachRow',
    });

    const data = await result.json<Array<ExpressLaneProfitData>>();

    return data.map(row => ({
        time: row.time,
        profitUsd: row.profitUsd || 0,
        expressLanePrice: row.expressLanePrice || 0,
        currentRound: row.currentRound || 0,
    }));
}

export async function publishExpressLaneProfit( ably: Ably.Realtime, clickhouseClient: ClickHouseClient, channelLastStoredTime: Record<string, number>) {
    let ableChannel = ably.channels.get(ABLY_CHANNELS.EXPRESS_LANE_PROFIT);
    let lastStoredTime = channelLastStoredTime[PUBNUB_CHANNELS.EXPRESS_LANE_PROFIT];

    if (!lastStoredTime) {
        const history = await ableChannel.history({ limit: 1 });
        const message = history.items.map((message) => message.data);
        if (!message || message.length === 0) {
            lastStoredTime = Math.floor((Date.now() - 5 * 60 * 1000) / 1000); // 5 minutes ago
        } else {
            const expressLaneProfitData = message[0] as unknown as ExpressLaneProfitData[];
            lastStoredTime = expressLaneProfitData[expressLaneProfitData.length - 1]!.time + 1;
        }
    }

    const expressLaneProfitData = await getExpressLaneProfitData(clickhouseClient, lastStoredTime);
    if (!expressLaneProfitData || expressLaneProfitData.length === 0) {
        return;
    }

    if (config.pubnub.isTest) {
        console.log('Publishing Express Lane Profit data:', expressLaneProfitData);
        return;
    } else {
        await ableChannel.publish('express_lane_profit', expressLaneProfitData);
    }
    channelLastStoredTime[PUBNUB_CHANNELS.EXPRESS_LANE_PROFIT] = expressLaneProfitData[expressLaneProfitData.length - 1]!.time;
} 