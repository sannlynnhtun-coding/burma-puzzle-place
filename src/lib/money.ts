const mmkNumberFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMMK(amount: number) {
  return `${mmkNumberFormatter.format(amount)} MMK`;
}

// Compact format for large numbers (e.g., 1.5K, 2.3M, 1.2B)
export function formatMMKCompact(amount: number): string {
  if (amount === 0) return '0 MMK';
  
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  if (absAmount >= 1_000_000_000_000) {
    // Trillions
    return `${sign}${(absAmount / 1_000_000_000_000).toFixed(2)}T MMK`;
  } else if (absAmount >= 1_000_000_000) {
    // Billions
    return `${sign}${(absAmount / 1_000_000_000).toFixed(2)}B MMK`;
  } else if (absAmount >= 1_000_000) {
    // Millions
    return `${sign}${(absAmount / 1_000_000).toFixed(2)}M MMK`;
  } else if (absAmount >= 1_000) {
    // Thousands
    return `${sign}${(absAmount / 1_000).toFixed(2)}K MMK`;
  } else {
    // Less than 1000
    return `${sign}${absAmount.toFixed(2)} MMK`;
  }
}


