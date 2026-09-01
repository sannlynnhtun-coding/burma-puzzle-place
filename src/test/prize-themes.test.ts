import { describe, expect, it } from 'vitest';
import { getGameCatalog } from '../lib/catalog';
import { getPrizeTier, getPrizeVisual } from '../lib/prizeThemes';

describe('prize card themes', () => {
  it('gives every prize in the 20-card game a distinct deterministic design', () => {
    const prizes = getGameCatalog('2b4ae830-a20a-4f61-b991-3d510c2032a3')!.prizes;
    const signatures = prizes.map((prize) => {
      const visual = getPrizeVisual(prize);
      return `${visual.background}:${visual.pattern}:${visual.iconIndex % 4}:${visual.tilt}`;
    });

    expect(new Set(signatures)).toHaveLength(prizes.length);
    expect(getPrizeVisual(prizes[0])).toEqual(getPrizeVisual(prizes[0]));
  });

  it('maps prize values to the intended visual tiers', () => {
    const base = { id: 'test', label: 'Prize', kind: 'cash' as const, sortOrder: 0 };

    expect(getPrizeTier({ ...base, valueMmk: 2_000_000 })).toBe('jackpot');
    expect(getPrizeTier({ ...base, valueMmk: 250_000 })).toBe('big-cash');
    expect(getPrizeTier({ ...base, valueMmk: 25_000 })).toBe('cash');
    expect(getPrizeTier({ ...base, valueMmk: 500 })).toBe('lucky');
    expect(getPrizeTier({ ...base, valueMmk: 0, kind: 'joke' })).toBe('surprise');
  });
});
