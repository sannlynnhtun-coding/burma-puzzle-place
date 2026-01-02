const mmkNumberFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMMK(amount: number) {
  return `${mmkNumberFormatter.format(amount)} MMK`;
}


