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
    console.log("[useAuctionInfo] Received message:", message);
    console.log("[useAuctionInfo] Parsed data:", data);

    if (!data) {
      console.log("[useAuctionInfo] No data, skipping");
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
        console.log("[useAuctionInfo] Loading history...");
        const history = await channel.history({
          limit: 1,
          direction: "forwards",
        });
        if (isCancelled) return;

        const items = history?.items ?? [];
        console.log("[useAuctionInfo] History items:", items);
        if (items.length === 0) {
          console.log("[useAuctionInfo] No history items found");
          return;
        }

        const data = items[0].data as AuctionInfo;
        console.log("[useAuctionInfo] History data:", data);
        setAuctionInfo(data);
        setIsConnected(true);
      } catch (error) {
        console.error("[useAuctionInfo] Failed to load auction info history", error);
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
