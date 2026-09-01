import gameEvents from '../data/game-events.json';
import prizePool from '../data/prize-pool.json';

export type PrizeKind = 'cash' | 'joke';

export type CatalogGame = {
  id: string;
  slug: string;
  title: string;
  description: string;
  currency: 'MMK';
};

export type CatalogPrize = {
  id: string;
  label: string;
  valueMmk: number;
  kind: PrizeKind;
  sortOrder: number;
};

export type GameCatalog = {
  game: CatalogGame;
  prizes: CatalogPrize[];
};

export type GameOption = CatalogGame & {
  prizeCount: number;
};

export function validateCatalog(catalog: GameCatalog): GameCatalog {
  if (!catalog.game.id || !catalog.game.slug || !catalog.game.title || catalog.game.currency !== 'MMK') {
    throw new Error('Invalid static game metadata');
  }

  if (catalog.prizes.length < 5) {
    throw new Error('A static game must contain at least 5 prizes');
  }

  const ids = new Set<string>();
  const sortOrders = new Set<number>();

  catalog.prizes.forEach((prize, index) => {
    if (
      !prize.id ||
      !prize.label.trim() ||
      !Number.isFinite(prize.valueMmk) ||
      prize.valueMmk < 0 ||
      prize.sortOrder !== index ||
      (prize.kind !== 'cash' && prize.kind !== 'joke') ||
      (prize.valueMmk > 0 ? prize.kind !== 'cash' : prize.kind !== 'joke')
    ) {
      throw new Error('Invalid prize in static game');
    }

    if (ids.has(prize.id) || sortOrders.has(prize.sortOrder)) {
      throw new Error('Static prizes must have unique IDs and sort orders');
    }

    ids.add(prize.id);
    sortOrders.add(prize.sortOrder);
  });

  return catalog;
}

function buildStaticCatalog(event: (typeof gameEvents)[number]): GameCatalog {
  const prizes = prizePool
    .filter((item) => item.event_id === event.id)
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((item, index) => {
      const valueMmk = Number(item.value);
      return {
        id: item.id,
        label: item.name,
        valueMmk,
        kind: valueMmk > 0 ? 'cash' as const : 'joke' as const,
        sortOrder: index,
      };
    });

  return validateCatalog({
    game: {
      id: event.id,
      slug: `game-${event.id.slice(0, 8)}`,
      title: event.event_name,
      description: event.description,
      currency: 'MMK',
    },
    prizes,
  });
}

const STATIC_CATALOGS = gameEvents.map(buildStaticCatalog);

export function getGameOptions(): GameOption[] {
  return STATIC_CATALOGS.map(({ game, prizes }) => ({ ...game, prizeCount: prizes.length }));
}

export function getGameCatalog(eventId: string): GameCatalog | undefined {
  return STATIC_CATALOGS.find((catalog) => catalog.game.id === eventId);
}
