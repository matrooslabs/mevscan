export interface Swap {
  trace_idx: number;
  from: string;
  recipient: string;
  pool: string;
  token_in: [string, string];
  token_out: [string, string];
  amount_in: [string, string];
  amount_out: [string, string];
}

export function transformSwapsData(
  row: Record<string, unknown>,
  prefix: string = 'swaps.'
): Swap[] {
  const traceIdx = row[`${prefix}trace_idx`];
  const from = row[`${prefix}from`];
  const recipient = row[`${prefix}recipient`];
  const pool = row[`${prefix}pool`];
  const tokenIn = row[`${prefix}token_in`];
  const tokenOut = row[`${prefix}token_out`];
  const amountIn = row[`${prefix}amount_in`];
  const amountOut = row[`${prefix}amount_out`];

  const swaps: Swap[] = [];

  if (traceIdx && traceIdx.length > 0) {
    for (let i = 0; i < traceIdx.length; i++) {
      swaps.push({
        trace_idx: traceIdx[i],
        from: from?.[i] || '',
        recipient: recipient?.[i] || '',
        pool: pool?.[i] || '',
        token_in: tokenIn?.[i] || ['', ''],
        token_out: tokenOut?.[i] || ['', ''],
        amount_in: amountIn?.[i] || ['', ''],
        amount_out: amountOut?.[i] || ['', ''],
      });
    }
  }

  return swaps;
}
