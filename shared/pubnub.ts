import PubNub from 'pubnub';
import { config } from './config';
import { PUBNUB_CHANNELS } from './pubnubConstants';

export { PUBNUB_CHANNELS };

export function getPubNub(): PubNub {
    return new PubNub({
        subscribeKey: config.pubnub.subscribeKey,
        publishKey: config.pubnub.publishKey,
        secretKey: config.pubnub.secretKey,
        userId: config.pubnub.userId,
    });
}
