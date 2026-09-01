import { describe, expect, it } from 'vitest';
import { getGameCatalog, getGameOptions, validateCatalog, type GameCatalog } from '../lib/catalog';

const OFFICE_GAME_ID = '2b4ae830-a20a-4f61-b991-3d510c2032a3';

describe('static game catalog', () => {
  it('loads every supplied event that has a playable prize pool', () => {
    const games = getGameOptions();
    expect(games).toHaveLength(12);
    expect(games.every((game) => game.prizeCount >= 5)).toBe(true);

    const catalog = getGameCatalog(OFFICE_GAME_ID)!;

    expect(catalog.game).toEqual({
      id: '2b4ae830-a20a-4f61-b991-3d510c2032a3',
      slug: 'game-2b4ae830',
      title: 'Office Luck or Troll?',
      description: '20 Boxes. Only 3 Big Prizes. The rest are nightmares!',
      currency: 'MMK',
    });
    expect(catalog.prizes).toHaveLength(20);
    expect(catalog.prizes.map((prize) => prize.sortOrder)).toEqual([...Array(20).keys()]);
    expect(catalog.prizes[0]).toMatchObject({ label: 'iPhone 15 Pro Max', valueMmk: 1500, kind: 'cash' });
    expect(catalog.prizes[6]).toMatchObject({ label: 'Pen (Blue)', valueMmk: 0.5, kind: 'cash' });
    expect(catalog.prizes[19]).toMatchObject({ label: 'Better Luck Next Time', valueMmk: 0, kind: 'joke' });
  });

  it('loads the correct linked prizes for another selected event', () => {
    const catalog = getGameCatalog('cf3cfc27-981b-4407-a9d6-fea3562e36c7')!;

    expect(catalog.game.title).toBe('မဟာသင်္ကြန် ငွေသားဆုမဲကြီး');
    expect(catalog.prizes).toHaveLength(6);
    expect(catalog.prizes[0]).toMatchObject({ label: 'ငွေသား ကျပ် သိန်း (၅၀)', valueMmk: 5_000_000, sortOrder: 0 });
  });

  it('rejects incomplete and duplicate static data', () => {
    const catalog = getGameCatalog(OFFICE_GAME_ID)!;
    expect(() => validateCatalog({ ...catalog, prizes: catalog.prizes.slice(0, 4) })).toThrow(/at least 5/i);

    const duplicate: GameCatalog = {
      ...catalog,
      prizes: catalog.prizes.map((prize, index) => index === 1 ? { ...prize, id: catalog.prizes[0].id } : prize),
    };
    expect(() => validateCatalog(duplicate)).toThrow(/unique/i);
  });
});
