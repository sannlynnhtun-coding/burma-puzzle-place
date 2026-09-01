export type GameTheme = {
  kicker: string;
  background: string;
  accent: string;
};

const GAME_THEMES: readonly GameTheme[] = [
  { kicker: 'Office hustle', background: '#8B3FF5', accent: '#D9FF43' },
  { kicker: 'Food frenzy', background: '#FF8A1F', accent: '#FFE44D' },
  { kicker: 'Cash quest', background: '#54C93F', accent: '#F7FF72' },
  { kicker: 'Fix it', background: '#2474E8', accent: '#63E6FF' },
  { kicker: 'Laugh track', background: '#F53C78', accent: '#FFD84D' },
  { kicker: 'Scene take', background: '#18BBB7', accent: '#98FFF3' },
  { kicker: 'Dice dash', background: '#FFBD1C', accent: '#FF6B45' },
  { kicker: 'Phone fix', background: '#2385E8', accent: '#7DFFEF' },
  { kicker: 'Heart match', background: '#F54278', accent: '#FFB1CE' },
  { kicker: 'Lantern night', background: '#7B36D8', accent: '#FFD442' },
  { kicker: 'Spicy heat', background: '#F15B2A', accent: '#FFE339' },
  { kicker: 'Gift connect', background: '#55C945', accent: '#C9FF46' },
];

export function getGameTheme(index: number): GameTheme {
  return GAME_THEMES[index] ?? GAME_THEMES[0];
}
