// check last saved from local cache or from pubnub history
// query for this round from this timestamp (including)
// publish query result to pubnub
// (there may be duplicated messages for a specific timestamp, deduplicate by selecting the later messages(published later))
// (because there may be edge cases where the timestamp has not fully been processed yet)

import Ably from 'ably';
import { ClickHouseClient } from "@clickhouse/client";
import { ABLY_CHANNELS } from "@mevscan/shared/ablyConstants";
import { config, NodeEnv } from "@mevscan/shared/config";
import { ExpressLaneTransaction } from "@mevscan/shared/types";

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
        AND (
            bh.block_number > {blockNumber:UInt64}
            OR (bh.block_number = {blockNumber:UInt64} AND bh.tx_index > {txIndex:UInt32})
        )
    ORDER BY bh.block_number ASC, bh.tx_index ASC
    `;

    const result = await clickhouseClient.query({
        query,
        query_params: { blockNumber, txIndex },
        format: 'JSONEachRow',
    });

    const data = await result.json<Array<ExpressLaneTransaction>>();
    return data;
}

async function getLastStoredBlockNumberTxIndex(clickhouseClient: ClickHouseClient): Promise<number> {
    const query = `
        SELECT MAX(block_number) as blockNumber
        FROM mev.bundle_header
        WHERE timeboosted = true
    `;

    const result = await clickhouseClient.query({
        query,
        format: 'JSONEachRow',
    });

    const data = await result.json<Array<{ blockNumber: number }>>();
    return data[0]?.blockNumber ?? 0;
}

export async function publishExpressLaneTransactions(ably: Ably.Realtime, clickhouseClient: ClickHouseClient, lastStoredBlockNumberTxIndex: Record<string, [number, number]>) {
    let ablyChannel = ably.channels.get(ABLY_CHANNELS.EXPRESS_LANE_TRANSACTIONS);
    let [lastStoredBlockNumber, lastStoredTxIndex] = lastStoredBlockNumberTxIndex[ABLY_CHANNELS.EXPRESS_LANE_TRANSACTIONS] || [null, null];

    if (lastStoredBlockNumber === null || lastStoredTxIndex === null) {
        const history = await ablyChannel.history({ limit: 1 });
        const message = history.items.map((message) => message.data);
        if (!message || message.length === 0) {
            lastStoredBlockNumber = await getLastStoredBlockNumberTxIndex(clickhouseClient);
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
    } else {
        await ablyChannel.publish(ABLY_CHANNELS.EXPRESS_LANE_TRANSACTIONS, transactions);
    }
    lastStoredBlockNumberTxIndex[ABLY_CHANNELS.EXPRESS_LANE_TRANSACTIONS] = [transactions[transactions.length - 1]!.blockNumber, transactions[transactions.length - 1]!.txIndex];
}