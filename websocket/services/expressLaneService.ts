// check last saved from local cache or from pubnub history
// query for this round from this timestamp (including)
// publish query result to pubnub
// (there may be duplicated messages for a specific timestamp, deduplicate by selecting the later messages(published later))
// (because there may be edge cases where the timestamp has not fully been processed yet)

import PubNub from "pubnub";
import { ClickHouseClient } from "@clickhouse/client";
import { PUBNUB_CHANNELS } from "@mevscan/shared/pubnub";

export interface ExpressLaneProfitData {
    time: number;
    profit: number;
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
            lastStoredTime = Math.floor((Date.now() - 60 * 60 * 1000) / 1000);
        } else {
            const expressLaneProfitData = fetchedMessage[0]!.message as unknown as ExpressLaneProfitData[];
            lastStoredTime = expressLaneProfitData[expressLaneProfitData.length - 1]!.time + 1;
        }
    }

    // const expressLaneProfitData = await getExpressLaneProfitData(clickhouseClient, lastStoredTime);
    // if (!expressLaneProfitData || expressLaneProfitData.length === 0) {
    //     return;
    // }
    // console.log(expressLaneProfitData);

    // pubnub.publish({
    //     channel: PUBNUB_CHANNELS.EXPRESS_LANE_PROFIT,
    //     message: expressLaneProfitData as any
    // }, (status, response) => {
    //     if (status.error) {
    //         console.error('Error publishing Express Lane Profit data:', status.error);
    //     }
    // });

    // channelLastStoredTime[PUBNUB_CHANNELS.EXPRESS_LANE_PROFIT] = expressLaneProfitData[expressLaneProfitData.length - 1]!.time;
} 