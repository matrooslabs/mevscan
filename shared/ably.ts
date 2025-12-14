import Ably from 'ably';
import { config } from './config';
export function getAbly(): Ably.Realtime {
    return new Ably.Realtime({
        key: config.ably.apiKey,
    });
}