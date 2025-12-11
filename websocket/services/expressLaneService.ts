// check last saved from local cache or from pubnub history
// query for this round from this timestamp (including)
// publish query result to pubnub
// (there may be duplicated messages for a specific timestamp, deduplicate by selecting the later messages(published later))
// (because there may be edge cases where the timestamp has not fully been processed yet)

import PubNub from "pubnub";
import { ClickHouseClient } from "@clickhouse/client";
import { PUBNUB_CHANNELS } from "@mevscan/shared/pubnub";
import { config } from "@mevscan/shared/config";
import { ExpressLaneProfitData } from "@mevscan/shared/types";

export async function getExpressLaneProfitData(clickhouseClient: ClickHouseClient, lastStoredTime: number): Promise<ExpressLaneProfitData[]> {
    const query = `
        SELECT 
          toUnixTimestamp(toStartOfInterval(toDateTime(eth.block_timestamp), INTERVAL 30 second)) as time,
          sum(bh.profit_usd) as profitUsd,
          any(bh.express_lane_price) as expressLanePrice,
          any(bh.express_lane_round) as currentRound,
          any(bh.express_lane_controller) as expressLaneController
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
        expressLaneController: row.expressLaneController || null,
    }));
}

export async function publishExpressLaneProfit(pubnub: PubNub, clickhouseClient: ClickHouseClient, channelLastStoredTime: Record<string, number>) {
    let lastStoredTime = channelLastStoredTime[PUBNUB_CHANNELS.EXPRESS_LANE_PROFIT];
    if (!lastStoredTime) {
        const message = await pubnub.fetchMessages({
            channels: [PUBNUB_CHANNELS.EXPRESS_LANE_PROFIT],
            count: 1,
        });
        const fetchedMessage = message.channels[PUBNUB_CHANNELS.EXPRESS_LANE_PROFIT];
        if (!fetchedMessage || fetchedMessage.length === 0) {
            lastStoredTime = Math.floor((Date.now() - 5 * 60 * 1000) / 1000); // 5 minutes ago
        } else {
            const expressLaneProfitData = fetchedMessage[0]!.message as unknown as ExpressLaneProfitData[];
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
        pubnub.publish({
            channel: PUBNUB_CHANNELS.EXPRESS_LANE_PROFIT,
            message: expressLaneProfitData as any
        }, (status, response) => {
            if (status.error) {
                console.error('Error publishing Express Lane Profit data:', status.error);
            }
        });
    }
    channelLastStoredTime[PUBNUB_CHANNELS.EXPRESS_LANE_PROFIT] = expressLaneProfitData[expressLaneProfitData.length - 1]!.time;
} 