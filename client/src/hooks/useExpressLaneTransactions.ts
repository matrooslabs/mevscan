import { useState, useCallback, useMemo, useEffect } from "react";
import { useChannel } from "ably/react";
import { ABLY_CHANNELS } from "../constants/ably";
import type { ExpressLaneTransaction } from "@mevscan/shared";

export interface RoundInfo {
  currentRound: number;
  currentOwner: string;
  expressLanePriceEth: string;
  expressLanePriceUsd: number;
  currentBlockNumber: number;
  gasUsed: number;
}

export interface ProfitByTypeDataPoint {
  timestamp: number;
  Atomic: number;
  CexDex: number;
  Liquidation: number;
}

export interface UseExpressLaneTransactionsResult {
  transactions: ExpressLaneTransaction[];
  roundInfo: RoundInfo;
  profitByType: ProfitByTypeDataPoint[];
  cumulativeProfit: number;
  isConnected: boolean;
}

export function useExpressLaneTransactions(): UseExpressLaneTransactionsResult {
  const [transactions, setTransactions] = useState<ExpressLaneTransaction[]>(
    []
  );
  const [isConnected, setIsConnected] = useState(false);

  // Handle incoming messages from Ably
  const handleMessage = useCallback((message: { data?: unknown }) => {
    console.log("[useExpressLaneTransactions] Received message:", message);
    const newTransactions = message.data as
      | ExpressLaneTransaction[]
      | undefined;

    if (
      !newTransactions ||
      !Array.isArray(newTransactions) ||
      newTransactions.length === 0
    ) {
      return;
    }

    setTransactions((prev) => {
      // Append new transactions (they come in ASC order and are always newer)
      // Find the maximum value of express_lane_round from all transactions
      const maxExpressLaneRound: number = newTransactions.reduce(
        (max, tx) => (tx.expressLaneRound > max ? tx.expressLaneRound : max),
        0
      );
      const combined = [...prev, ...newTransactions];
      const filtered = combined.filter(
        (tx) => tx.expressLaneRound === maxExpressLaneRound
      );
      return filtered;
    });
  }, []);

  // Subscribe to the express lane transactions channel
  const { channel } = useChannel(
    ABLY_CHANNELS.EXPRESS_LANE_TRANSACTIONS,
    (message) => {
      setIsConnected(true);
      handleMessage(message);
    }
  );

  // Fetch a snapshot of the most recent 60 messages on cold start
  useEffect(() => {
    if (!channel) return;

    let isCancelled = false;

    const loadHistory = async () => {
      try {
        const history = await channel.history({
          limit: 30,
          direction: "forwards",
        });
        if (isCancelled) return;

        const items = history?.items ?? [];
        if (items.length === 0) {
          return;
        }
        const transactions: ExpressLaneTransaction[] = items.flatMap(
          (item) => item.data as ExpressLaneTransaction[]
        );
        const maxExpressLaneRound: number = transactions.reduce(
          (max, tx) => (tx.expressLaneRound > max ? tx.expressLaneRound : max),
          0
        );
        const filteredTransactions = transactions.filter(
          (tx) => tx.expressLaneRound === maxExpressLaneRound
        );
        setTransactions(filteredTransactions);
        setIsConnected(true);
      } catch (error) {
        console.error("Failed to load express lane transaction history", error);
        setIsConnected(false);
      }
    };

    loadHistory();

    return () => {
      isCancelled = true;
    };
  }, [channel]);

  // Compute round info from latest transaction
  const roundInfo = useMemo<RoundInfo>(() => {
    if (transactions.length === 0) {
      return {
        currentRound: 0,
        currentOwner: "0x0000000000000000000000000000000000000000",
        expressLanePriceEth: "0",
        expressLanePriceUsd: 0,
        currentBlockNumber: 0,
        gasUsed: 0,
      };
    }

    const latestTx = transactions[transactions.length - 1]; // Stored in ASC order, newest is last

    return {
      currentRound: latestTx.expressLaneRound ?? 0,
      currentOwner:
        latestTx.expressLaneController ??
        "0x0000000000000000000000000000000000000000",
      expressLanePriceEth: latestTx.expressLanePrice ?? "0",
      expressLanePriceUsd: latestTx.expressLanePriceUsd ?? 0,
      currentBlockNumber: latestTx.blockNumber,
      gasUsed: 0, // Would need gas data from the transaction
    };
  }, [transactions]);

  // Compute profit by MEV type for chart
  const profitByType = useMemo<ProfitByTypeDataPoint[]>(() => {
    if (transactions.length === 0) return [];

    // Group transactions by distinct timestamp
    const timestampMap = new Map<
      number,
      { Atomic: number; CexDex: number; Liquidation: number }
    >();

    transactions.forEach((tx) => {
      const timestamp = tx.blockTimestamp;

      if (!timestampMap.has(timestamp)) {
        timestampMap.set(timestamp, { Atomic: 0, CexDex: 0, Liquidation: 0 });
      }

      const entry = timestampMap.get(timestamp)!;

      // Map mevType to chart categories
      if (tx.mevType === "AtomicArb") {
        entry.Atomic += tx.profitUsd;
      } else if (tx.mevType === "CexDexQuotes") {
        entry.CexDex += tx.profitUsd;
      } else if (tx.mevType === "Liquidation") {
        entry.Liquidation += tx.profitUsd;
      }
    });

    // Convert to array and sort by timestamp
    return Array.from(timestampMap.entries())
      .map(([timestamp, data]) => ({ timestamp, ...data }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [transactions]);

  // Calculate cumulative profit
  const cumulativeProfit = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + tx.profitUsd, 0);
  }, [transactions]);
  return {
    transactions,
    roundInfo,
    profitByType,
    cumulativeProfit,
    isConnected,
  };
}
