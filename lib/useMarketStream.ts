"use client";

import { useState, useEffect, useRef } from "react";

interface Trade {
  id: number;
  user_id: string;
  market_id: number;
  outcome_index: number;
  shares: number;
  cost: number;
  created_at: string;
  user_name: string;
  user_image: string | null;
}

interface MarketStreamData {
  probabilities: number[];
  quantities: number[];
  recentTrades: Trade[];
  totalVolume: number;
  isConnected: boolean;
}

export function useMarketStream(marketId: string): MarketStreamData {
  const [probabilities, setProbabilities] = useState<number[]>([0.25, 0.25, 0.25, 0.25]);
  const [quantities, setQuantities] = useState<number[]>([0, 0, 0, 0]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (esRef.current) {
      esRef.current.close();
    }

    const es = new EventSource(`/api/markets/${marketId}/stream`);
    esRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
    };

    es.addEventListener("market_update", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setProbabilities(data.probabilities);
        setQuantities(data.quantities);
        setRecentTrades(data.recentTrades);
        setTotalVolume(data.totalVolume);
      } catch {
        // ignore parse errors
      }
    });

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      esRef.current = null;
      // Auto-reconnect with 3s backoff
      retryTimeoutRef.current = setTimeout(connect, 3000);
    };
  };

  useEffect(() => {
    connect();
    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketId]);

  return { probabilities, quantities, recentTrades, totalVolume, isConnected };
}
