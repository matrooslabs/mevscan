// check last saved from local cache or from pubnub history
// query for this round from this timestamp (including)
// publish query result to pubnub
// (there may be duplicated messages for a specific timestamp, deduplicate by selecting the later messages(published later))
// (because there may be edge cases where the timestamp has not fully been processed yet)

import PubNub from "pubnub";
import Ably from 'ably';
import { ClickHouseClient } from "@clickhouse/client";
import { ABLY_CHANNELS } from "@mevscan/shared/ablyConstants";
import { config, NodeEnv } from "@mevscan/shared/config";
import { ExpressLaneProfitData, ExpressLaneTransaction } from "@mevscan/shared/types";

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

async function getExpressLaneTransactions(clickhouseClient: ClickHouseClient, blockNumber: number, txIndex: number): Promise<ExpressLaneTransaction[]> {
    const query = ` SELECT
        eth.block_timestamp as blockTimestamp,
        bh.block_number as blockNumber,
        bh.tx_index as txIndex,
        bh.tx_hash as txHash,
        bh.profit_usd as profitUsd,
        bh.express_lane_price as expressLanePrice,
        bh.express_lane_round as expressLaneRound
    FROM mev.bundle_header bh
    INNER JOIN ethereum.blocks eth
        ON eth.block_number = bh.block_number
    WHERE bh.timeboosted = true
        AND bh.express_lane_round = (SELECT max(express_lane_round) FROM mev.bundle_header WHERE timeboosted = true)
        AND (
            bh.block_number > {block_number:UInt64}
            OR (bh.block_number = {block_number:UInt64} AND bh.tx_index > {tx_index:UInt32})
        )
    ORDER BY bh.block_number DESC, bh.tx_index ASC
    LIMIT 100
    `;

    const result = await clickhouseClient.query({
        query,
        query_params: { blockNumber, txIndex },
        format: 'JSONEachRow',
    });

    const data = await result.json<Array<ExpressLaneTransaction>>();
    return data;
}

async function getLatestRoundBlockNumber(clickhouseClient: ClickHouseClient): Promise<number> {
    const query = ` SELECT
        max(bh.block_number) as blockNumber
    FROM mev.bundle_header bh
    WHERE bh.timeboosted = true
    `;
    const result = await clickhouseClient.query({
        query,
        format: 'JSONEachRow',
    });
    const data = await result.json<Array<{
        blockNumber: number;
    }>>();
    return data[0]?.blockNumber || 0;
}

export async function publishExpressLaneTransactions(ably: Ably.Realtime, clickhouseClient: ClickHouseClient, lastStoredBlockNumberTxIndex: Record<string, [number, number]>) {
    let ablyChannel = ably.channels.get(ABLY_CHANNELS.EXPRESS_LANE_TRANSACTIONS);
    let [lastStoredBlockNumber, lastStoredTxIndex] = lastStoredBlockNumberTxIndex[ABLY_CHANNELS.EXPRESS_LANE_TRANSACTIONS] || [null, null];

    if (lastStoredBlockNumber === null || lastStoredTxIndex === null) {
        const history = await ablyChannel.history({ limit: 1 });
        const message = history.items.map((message) => message.data);
        if (!message || message.length === 0) {
            lastStoredBlockNumber = await getLatestRoundBlockNumber(clickhouseClient);
            lastStoredTxIndex = 0;
        } else {
            const expressLaneTransactionData = message[0] as unknown as ExpressLaneTransaction[];
            lastStoredBlockNumber = expressLaneTransactionData[expressLaneTransactionData.length - 1]!.blockNumber;
            lastStoredTxIndex = expressLaneTransactionData[expressLaneTransactionData.length - 1]!.txIndex;
        }
    }

    const transactions = await getExpressLaneTransactions(clickhouseClient, lastStoredBlockNumber, lastStoredTxIndex);
    if (!transactions || transactions.length === 0) {
        return;
    }

    if (config.nodeEnv === NodeEnv.TEST) {
        console.log('Publishing Express Lane Transactions data:', transactions);
        return;
    } else {
        await ablyChannel.publish(ABLY_CHANNELS.EXPRESS_LANE_TRANSACTIONS, transactions);
    }
    lastStoredBlockNumberTxIndex[ABLY_CHANNELS.EXPRESS_LANE_TRANSACTIONS] = [transactions[transactions.length - 1]!.blockNumber, transactions[transactions.length - 1]!.txIndex];
}

export async function publishExpressLaneProfit(ably: Ably.Realtime, clickhouseClient: ClickHouseClient, channelLastStoredTime: Record<string, number>) {
    let ableChannel = ably.channels.get(ABLY_CHANNELS.EXPRESS_LANE_PROFIT);
    let lastStoredTime = channelLastStoredTime[ABLY_CHANNELS.EXPRESS_LANE_PROFIT];

    if (!lastStoredTime) {
        const history = await ableChannel.history({ limit: 1 });
        const message = history.items.map((message) => message.data);
        if (!message || message.length === 0) {
            lastStoredTime = Math.floor((Date.now() - 5 * 60 * 1000) / 1000); // 5 minutes ago
        } else {
            const expressLaneProfitData = message[0] as unknown as ExpressLaneProfitData[];
            lastStoredTime = expressLaneProfitData[expressLaneProfitData.length - 1]!.time;
        }
    }

    const expressLaneProfitData = await getExpressLaneProfitData(clickhouseClient, lastStoredTime);
    if (!expressLaneProfitData || expressLaneProfitData.length === 0) {
        return;
    }

    if (config.ably.isTest) {
        console.log('Publishing Express Lane Profit data:', expressLaneProfitData);
        return;
    } else {
        await ableChannel.publish(ABLY_CHANNELS.EXPRESS_LANE_PROFIT, expressLaneProfitData);
    }
    channelLastStoredTime[ABLY_CHANNELS.EXPRESS_LANE_PROFIT] = expressLaneProfitData[expressLaneProfitData.length - 1]!.time;
} 