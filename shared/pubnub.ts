import PubNub from 'pubnub';
import { config } from './config';

export function getPubNub(): PubNub {
    return new PubNub({
        subscribeKey: config.pubnub.subscribeKey,
        publishKey: config.pubnub.publishKey,
        secretKey: config.pubnub.secretKey,
        userId: config.pubnub.userId,
    });
}

export const PUBNUB_CHANNELS = {
    EXPRESS_LANE_PROFIT: 'express_lane_profit',
} as const;