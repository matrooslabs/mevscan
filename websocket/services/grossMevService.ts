import { ClickHouseClient } from "@clickhouse/client";

export interface GrossMevDataResponse {
    time: number;
    total: number;
    normal: number;
    timeboost: number;
}

export async function getGrossMevFromBlocktime(clickhouse: ClickHouseClient, fromTimestamp: number): Promise<GrossMevDataResponse[]> {
    const query = `
      SELECT
        toUnixTimestamp(toStartOfMinute(toDateTime(e.block_timestamp))) as time,
        sum(m.profit_usd) as total,
        sumIf(m.profit_usd, m.timeboosted = false) as normal,
        sumIf(m.profit_usd, m.timeboosted = true) as timeboost
      FROM
        mev.bundle_header AS m
      LEFT JOIN ethereum.blocks AS e
        ON m.block_number = e.block_number
      LEFT JOIN mev.atomic_arbs AS a
        ON a.tx_hash = m.tx_hash
      WHERE
        (m.mev_type = 'CexDexQuotes' OR m.mev_type = 'AtomicArb' OR m.mev_type = 'Liquidation')
        AND (replaceAll(a.arb_type, '\\n', '') = 'Triangular Arbitrage'
          or a.arb_type = '')
        AND e.block_timestamp >= ${fromTimestamp}
      GROUP BY
        time
      ORDER BY
        time ASC
    `;

    const result = await clickhouse.query({
        query,
        format: 'JSONEachRow',
    });

    const data = await result.json<Array<GrossMevDataResponse>>();

    return data.filter((row) => row.time != null && !isNaN(row.time));
}