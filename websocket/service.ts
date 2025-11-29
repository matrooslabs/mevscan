import { ClickHouseClient } from "@clickhouse/client";
import { getGrossMEV } from "../server/services/grossMEVService";
import { TimeSeriesResponse } from "@mevscan/shared";
import { TIME_RANGES } from "@mevscan/shared/constants";

interface GrossMevDataResponse {
    [key: string]: TimeSeriesResponse;
}

export async function generateGrossMevData(clickHouseClient: ClickHouseClient): Promise<GrossMevDataResponse> {
    const response: GrossMevDataResponse = {};

    const promises = TIME_RANGES.map(timeRange =>
        getGrossMEV(clickHouseClient, timeRange).then(res => ({ timeRange, res }))
    );

    // Await all promises in parallel
    const results = await Promise.all(promises);

    // Map results to response object
    results.forEach(({ timeRange, res }) => {
        response[timeRange] = res;
    });

    return response;
}