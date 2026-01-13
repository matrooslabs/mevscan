import { useState, useCallback, useEffect } from "react";
import { useChannel } from "ably/react";
import { ABLY_CHANNELS } from "../constants/ably";
import type { AuctionInfo } from "@mevscan/shared";

export interface UseAuctionInfoResult {
  auctionInfo: AuctionInfo | null;
  isConnected: boolean;
}

export function useAuctionInfo(): UseAuctionInfoResult {
  const [auctionInfo, setAuctionInfo] = useState<AuctionInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleMessage = useCallback((message: { data?: unknown }) => {
    const data = message.data as AuctionInfo | undefined;

    if (!data) {
      return;
    }

    setAuctionInfo(data);
  }, []);

  const { channel } = useChannel(
    ABLY_CHANNELS.AUCTION_INFO,
    (message) => {
      setIsConnected(true);
      handleMessage(message);
    }
  );

  // Fetch history on cold start
  useEffect(() => {
    if (!channel) return;

    let isCancelled = false;

    const loadHistory = async () => {
      try {
        const history = await channel.history({
          limit: 1,
          direction: "forwards",
        });
        if (isCancelled) return;

        const items = history?.items ?? [];
        if (items.length === 0) {
          return;
        }

        const data = items[0].data as AuctionInfo;
        setAuctionInfo(data);
        setIsConnected(true);
      } catch (error) {
        console.error("Failed to load auction info history", error);
        setIsConnected(false);
      }
    };

    loadHistory();

    return () => {
      isCancelled = true;
    };
  }, [channel]);

  return {
    auctionInfo,
    isConnected,
  };
}
