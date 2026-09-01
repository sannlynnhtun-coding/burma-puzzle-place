import type { CatalogPrize } from './catalog';

export type PrizeTier = 'jackpot' | 'big-cash' | 'cash' | 'lucky' | 'surprise';
export type PrizePattern = 'burst' | 'checker' | 'rings' | 'stripes' | 'dots';

export type PrizeVisual = {
  tier: PrizeTier;
  category: string;
  background: string;
  accent: string;
  pattern: PrizePattern;
  iconIndex: number;
  tilt: number;
};

const PALETTES: Record<PrizeTier, readonly { background: string; accent: string }[]> = {
  jackpot: [
    { background: '#FFBD1C', accent: '#FFF36A' },
    { background: '#FF9F1C', accent: '#FFE44D' },
    { background: '#F6C945', accent: '#FFF8B0' },
    { background: '#FFCB36', accent: '#FF6B45' },
  ],
  'big-cash': [
    { background: '#83D72F', accent: '#D9FF43' },
    { background: '#54C93F', accent: '#F1FF85' },
    { background: '#A4D82D', accent: '#FFF064' },
    { background: '#39C877', accent: '#B9FF6A' },
  ],
  cash: [
    { background: '#18BBB7', accent: '#98FFF3' },
    { background: '#2385E8', accent: '#63E6FF' },
    { background: '#20A9D8', accent: '#B4F3FF' },
    { background: '#30C6A4', accent: '#B7FFE9' },
  ],
  lucky: [
    { background: '#F15B2A', accent: '#FFE339' },
    { background: '#FF7A35', accent: '#FFD45A' },
    { background: '#F54278', accent: '#FFB1CE' },
    { background: '#FF9650', accent: '#FFF072' },
  ],
  surprise: [
    { background: '#8B3FF5', accent: '#D9A8FF' },
    { background: '#F53C78', accent: '#FFB1CE' },
    { background: '#B04BE3', accent: '#F0B7FF' },
    { background: '#EA4CA5', accent: '#FFD1ED' },
  ],
};

const PATTERNS: readonly PrizePattern[] = ['burst', 'checker', 'rings', 'stripes', 'dots'];
const SURPRISE_LABELS = ['SURPRISE', 'JOKE', 'WILD CARD', 'LUCK TEST'];

function hashText(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getPrizeTier(prize: CatalogPrize): PrizeTier {
  if (prize.valueMmk >= 1_000_000) return 'jackpot';
  if (prize.valueMmk >= 100_000) return 'big-cash';
  if (prize.valueMmk >= 10_000) return 'cash';
  if (prize.valueMmk > 0) return 'lucky';
  return 'surprise';
}

export function getPrizeVisual(prize: CatalogPrize): PrizeVisual {
  const hash = hashText(`${prize.id}:${prize.label}:${prize.sortOrder}`);
  const tier = getPrizeTier(prize);
  const palette = PALETTES[tier][prize.sortOrder % PALETTES[tier].length];
  const category = tier === 'jackpot'
    ? 'JACKPOT'
    : tier === 'big-cash'
      ? 'BIG CASH'
      : tier === 'cash'
        ? 'CASH'
        : tier === 'lucky'
          ? 'LUCKY CASH'
          : SURPRISE_LABELS[prize.sortOrder % SURPRISE_LABELS.length];

  return {
    tier,
    category,
    ...palette,
    pattern: PATTERNS[prize.sortOrder % PATTERNS.length],
    iconIndex: prize.sortOrder,
    tilt: (prize.sortOrder % 5) - 2 + (hash % 3) * 0.15,
  };
}
