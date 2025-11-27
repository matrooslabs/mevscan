import dotenv from 'dotenv';
import PubNub from 'pubnub';
import { PUBNUB_CHANNELS } from '@mevscan/shared/constants';

dotenv.config();

const pubnub = new PubNub({
    subscribeKey: process.env.PUBNUB_SUBSCRIBE_KEY || "",
    publishKey: process.env.PUBNUB_PUBLISH_KEY || "",
    secretKey: process.env.PUBNUB_SECRET_KEY || "",
});

