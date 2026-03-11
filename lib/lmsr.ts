// LMSR (Logarithmic Market Scoring Rule) implementation
// b = 50 tuned for ~30-50 traders making $1-5 bets
// Max market maker loss = b * ln(4) ≈ $69.31

/**
 * Cost function: C(q) = b * ln(sum(exp(q_i / b)))
 * Uses log-sum-exp trick for numerical stability
 */
export function cost(quantities: number[], b: number): number {
  const scaled = quantities.map((q) => q / b);
  const maxScaled = Math.max(...scaled);
  const sumExp = scaled.reduce((acc, s) => acc + Math.exp(s - maxScaled), 0);
  return b * (Math.log(sumExp) + maxScaled);
}

/**
 * Cost to buy `amount` shares of outcome `outcomeIndex`:
 * cost = C(q_after) - C(q_before)
 */
export function costToBuy(
  quantities: number[],
  outcomeIndex: number,
  amount: number,
  b: number
): number {
  const qAfter = [...quantities];
  qAfter[outcomeIndex] += amount;
  return cost(qAfter, b) - cost(quantities, b);
}

/**
 * Revenue from selling `amount` shares of outcome `outcomeIndex`:
 * revenue = C(q_before) - C(q_after)  (where q_after has reduced shares)
 */
export function revenueToSell(
  quantities: number[],
  outcomeIndex: number,
  amount: number,
  b: number
): number {
  const qAfter = [...quantities];
  qAfter[outcomeIndex] -= amount;
  return cost(quantities, b) - cost(qAfter, b);
}

/**
 * Current instantaneous price (implied probability) for each outcome:
 * p_i = exp(q_i / b) / sum(exp(q_j / b))
 */
export function getProbabilities(quantities: number[], b: number): number[] {
  const scaled = quantities.map((q) => q / b);
  const maxScaled = Math.max(...scaled);
  const exps = scaled.map((s) => Math.exp(s - maxScaled));
  const sumExps = exps.reduce((acc, e) => acc + e, 0);
  return exps.map((e) => e / sumExps);
}

/**
 * Given a dollar amount, compute how many shares the user gets via binary search.
 * Finds `shares` where costToBuy(q, idx, shares, b) ≈ dollarAmount
 * Tolerance: within $0.001
 */
export function sharesToBuy(
  quantities: number[],
  outcomeIndex: number,
  dollarAmount: number,
  b: number
): number {
  const tolerance = 0.001;
  let lo = 0;
  let hi = dollarAmount * 100; // upper bound: can never get more than 100x shares per dollar

  // Binary search
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const c = costToBuy(quantities, outcomeIndex, mid, b);
    if (Math.abs(c - dollarAmount) < tolerance) {
      return mid;
    }
    if (c < dollarAmount) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

/**
 * Get current price per share for a given outcome (marginal price)
 */
export function getOutcomePrice(quantities: number[], outcomeIndex: number, b: number): number {
  const probs = getProbabilities(quantities, b);
  return probs[outcomeIndex];
}

/**
 * Calculate portfolio value for a set of positions given current quantities
 * Value = sum of (shares * sell revenue per share)
 */
export function positionValue(
  quantities: number[],
  outcomeIndex: number,
  shares: number,
  b: number
): number {
  if (shares <= 0) return 0;
  return revenueToSell(quantities, outcomeIndex, shares, b);
}
