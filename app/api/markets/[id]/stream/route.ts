import { getDb, getMarket } from "@/lib/db";
import { getProbabilities } from "@/lib/lmsr";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const marketId = parseInt(id);
  if (isNaN(marketId)) {
    return new Response("Invalid market ID", { status: 400 });
  }

  const encoder = new TextEncoder();
  let lastTradeId = 0;
  let heartbeatCounter = 0;

  const stream = new ReadableStream({
    start(controller) {
      const send = (eventName: string, data: unknown) => {
        const msg = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(msg));
      };

      // Send initial state immediately
      const market = getMarket(marketId);
      if (market) {
        const quantities = JSON.parse(market.quantities) as number[];
        const probabilities = getProbabilities(quantities, market.b);
        const db = getDb();

        const recentTrades = db
          .prepare(
            `SELECT t.*, u.name as user_name, u.image as user_image
             FROM trades t
             JOIN users u ON t.user_id = u.id
             WHERE t.market_id = ?
             ORDER BY t.created_at DESC
             LIMIT 20`
          )
          .all(marketId);

        const maxTrade = db
          .prepare("SELECT COALESCE(MAX(id), 0) as max_id FROM trades WHERE market_id = ?")
          .get(marketId) as { max_id: number };
        lastTradeId = maxTrade.max_id;

        const volumeRow = db
          .prepare(
            "SELECT COALESCE(SUM(cost), 0) as vol FROM trades WHERE market_id = ? AND cost > 0"
          )
          .get(marketId) as { vol: number };

        send("market_update", {
          probabilities,
          quantities,
          recentTrades,
          totalVolume: volumeRow.vol,
        });
      }

      const interval = setInterval(() => {
        try {
          heartbeatCounter++;

          const market = getMarket(marketId);
          if (!market) return;

          const db = getDb();

          // Check for new trades
          const newMaxTrade = db
            .prepare(
              "SELECT COALESCE(MAX(id), 0) as max_id FROM trades WHERE market_id = ?"
            )
            .get(marketId) as { max_id: number };

          if (newMaxTrade.max_id > lastTradeId || heartbeatCounter >= 15) {
            lastTradeId = newMaxTrade.max_id;
            heartbeatCounter = 0;

            const quantities = JSON.parse(market.quantities) as number[];
            const probabilities = getProbabilities(quantities, market.b);

            const recentTrades = db
              .prepare(
                `SELECT t.*, u.name as user_name, u.image as user_image
                 FROM trades t
                 JOIN users u ON t.user_id = u.id
                 WHERE t.market_id = ?
                 ORDER BY t.created_at DESC
                 LIMIT 20`
              )
              .all(marketId);

            const volumeRow = db
              .prepare(
                "SELECT COALESCE(SUM(cost), 0) as vol FROM trades WHERE market_id = ? AND cost > 0"
              )
              .get(marketId) as { vol: number };

            if (newMaxTrade.max_id > lastTradeId || true) {
              send("market_update", {
                probabilities,
                quantities,
                recentTrades,
                totalVolume: volumeRow.vol,
              });
            }
          } else if (heartbeatCounter % 15 === 0) {
            send("heartbeat", {});
          }
        } catch {
          // DB might be temporarily unavailable
        }
      }, 2000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
