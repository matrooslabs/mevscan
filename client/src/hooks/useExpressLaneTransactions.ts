import { useState, useCallback, useMemo } from 'react';
import { useChannel } from 'ably/react';
import { ABLY_CHANNELS } from '../constants/ably';
import type { ExpressLaneTransaction } from '@mevscan/shared';

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

const MAX_TRANSACTIONS = 100; // Keep last 100 transactions

export function useExpressLaneTransactions(): UseExpressLaneTransactionsResult {
  const [transactions, setTransactions] = useState<ExpressLaneTransaction[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Handle incoming messages from Ably
  const handleMessage = useCallback((message: { data?: unknown }) => {
    const newTransactions = message.data as ExpressLaneTransaction[] | undefined;

    console.log('New transactions received from Ably:', newTransactions);
    
    if (!newTransactions || !Array.isArray(newTransactions) || newTransactions.length === 0) {
      console.error('Invalid transactions data received from Ably');
      console.error(JSON.stringify(message.data, null, 2));
      return;
    }

    setTransactions(prev => {
      // Append new transactions (they come in ASC order and are always newer)
      const combined = [...prev, ...newTransactions];
      // If over limit, remove oldest entries from the front
      if (combined.length > MAX_TRANSACTIONS) {
        return combined.slice(combined.length - MAX_TRANSACTIONS);
      }
      return combined;
    });
  }, []);

  // Subscribe to the express lane transactions channel
  useChannel(ABLY_CHANNELS.EXPRESS_LANE_TRANSACTIONS, (message) => {
    setIsConnected(true);
    handleMessage(message);
  });

  // Compute round info from latest transaction
  const roundInfo = useMemo<RoundInfo>(() => {
    if (transactions.length === 0) {
      return {
        currentRound: 0,
        currentOwner: '0x0000000000000000000000000000000000000000',
        expressLanePriceEth: '0',
        expressLanePriceUsd: 0,
        currentBlockNumber: 0,
        gasUsed: 0,
      };
    }

    const latestTx = transactions[transactions.length - 1]; // Stored in ASC order, newest is last
    
    return {
      currentRound: latestTx.expressLaneRound ?? 0,
      currentOwner: latestTx.expressLaneController ?? '0x0000000000000000000000000000000000000000',
      expressLanePriceEth: latestTx.expressLanePrice ?? '0',
      expressLanePriceUsd: latestTx.expressLanePriceUsd ?? 0,
      currentBlockNumber: latestTx.blockNumber,
      gasUsed: 0, // Would need gas data from the transaction
    };
  }, [transactions]);

  // Compute profit by MEV type for chart
  const profitByType = useMemo<ProfitByTypeDataPoint[]>(() => {
    if (transactions.length === 0) return [];

    // Group transactions by time buckets (5-second intervals)
    const buckets = new Map<number, { Atomic: number; CexDex: number; Liquidation: number }>();
    
    transactions.forEach(tx => {
      // Round to 5-second intervals (in seconds)
      const bucketTimestamp = Math.floor(tx.blockTimestamp / 5) * 5;

      if (!buckets.has(bucketTimestamp)) {
        buckets.set(bucketTimestamp, { Atomic: 0, CexDex: 0, Liquidation: 0 });
      }

      const bucket = buckets.get(bucketTimestamp)!;
      
      // Map mevType to chart categories
      if (tx.mevType === 'atomic' || tx.mevType === 'Atomic') {
        bucket.Atomic += tx.profitUsd;
      } else if (tx.mevType === 'cex_dex' || tx.mevType === 'CexDex') {
        bucket.CexDex += tx.profitUsd;
      } else if (tx.mevType === 'liquidation' || tx.mevType === 'Liquidation') {
        bucket.Liquidation += tx.profitUsd;
      }
    });

    // Convert to array and sort by timestamp
    return Array.from(buckets.entries())
      .map(([timestamp, data]) => ({ timestamp, ...data }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [transactions]);

  // Calculate cumulative profit
  const cumulativeProfit = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + tx.profitUsd, 0);
  }, [transactions]);

  // Reverse transactions for display (newest first)
  const displayTransactions = useMemo(() => {
    return transactions.reverse();
  }, [transactions]);

  return {
    transactions: displayTransactions,
    roundInfo,
    profitByType,
    cumulativeProfit,
    isConnected,
  };
}
