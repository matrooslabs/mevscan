import PubNub from 'pubnub';
import { ClickHouseClient } from '@clickhouse/client';
import { initClickHouseClient } from '@mevscan/shared/clickhouse';
import { getPubNub } from '@mevscan/shared/pubnub';

let channelLastStoredTime: Record<string, number> = {};
let refreshInterval = 20 * 1000; // 20 seconds

interface InitResult {
    pubnub: PubNub;
    clickhouseClient: ClickHouseClient;
}

async function init(): Promise<InitResult> {
    try {
        const pubnub = getPubNub();
        const clickhouseClient = initClickHouseClient();
        const pingResult = await clickhouseClient.ping();
        if (!pingResult.success) {
            console.error('ERROR: Failed to ping ClickHouse client');
            process.exit(1);
        }
        console.log('✓ ClickHouse client initialized successfully');
        return { pubnub, clickhouseClient };
    } catch (error) {
        console.error('ERROR: Failed to initialize ClickHouse client:', error);
        process.exit(1);
    }
}

// async function refreshAndPublish(clickhouseClient: ClickHouseClient, pubnub: PubNub) {
//     let lastStoredTime = channelLastStoredTime[PUBNUB_CHANNELS.GROSS_MEV];
//     if (!lastStoredTime) {
//         // Fetch from pubnub message to get last stored time
//         const message = await pubnub.fetchMessages({
//             channels: [PUBNUB_CHANNELS.GROSS_MEV],
//             count: 1,
//         });

//         const fetchedMessage = message.channels[PUBNUB_CHANNELS.GROSS_MEV];
//         if (!fetchedMessage || fetchedMessage.length === 0) {
//             lastStoredTime = Math.floor((Date.now() - 60 * 60 * 1000) / 1000);
//         } else {
//             const grossData = fetchedMessage[0]!.message as unknown as GrossMevDataResponse[];
//             lastStoredTime = grossData[grossData.length - 1]!.time + 1;
//         }
//     }

//     const grossMevData = await getGrossMevFromBlocktime(clickhouseClient, lastStoredTime);
//     if (!grossMevData || grossMevData.length === 0) {
//         return;
//     }
//     console.log(grossMevData);

//     pubnub.publish({
//         channel: PUBNUB_CHANNELS.GROSS_MEV,
//         message: grossMevData as any
//     }, (status, response) => {
//         if (status.error) {
//             console.error('Error publishing Gross MEV data:', status.error);
//         }
//     });

//     channelLastStoredTime[PUBNUB_CHANNELS.GROSS_MEV] = grossMevData[grossMevData.length - 1]!.time;
// }


(async () => {
    const { pubnub, clickhouseClient } = await init();

    while (true) {
        // await refreshAndPublish(clickhouseClient, pubnub);
        await new Promise(resolve => setTimeout(resolve, refreshInterval));
    }
})();