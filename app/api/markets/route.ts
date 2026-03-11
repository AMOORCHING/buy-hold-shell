import { NextResponse } from "next/server";
import { getAllMarkets } from "@/lib/db";
import { getProbabilities } from "@/lib/lmsr";

export async function GET() {
  const markets = getAllMarkets();
  const enriched = markets.map((m) => {
    const quantities = JSON.parse(m.quantities) as number[];
    const probabilities = getProbabilities(quantities, m.b);
    return {
      ...m,
      outcomes: JSON.parse(m.outcomes),
      quantities,
      probabilities,
    };
  });
  return NextResponse.json(enriched);
}
