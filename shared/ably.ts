import Ably from 'ably';

interface AblyConfig {
  apiKey: string;
}

export function getAbly(config: AblyConfig): Ably.Realtime {
    return new Ably.Realtime({
        key: config.apiKey,
    });
}

export const ABLY_CHANNELS = {
    EXPRESS_LANE_PROFIT: 'express_lane_profit',
} as const;