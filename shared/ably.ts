import Ably from 'ably';
import { config } from './config';
export function getAbly(): Ably.Realtime {
    return new Ably.Realtime({
        key: config.ably.apiKey,
    });
}

export const ABLY_CHANNELS = {
    EXPRESS_LANE_PROFIT: 'express_lane_profit',
} as const;