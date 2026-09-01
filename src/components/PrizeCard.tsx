import type { CSSProperties } from 'react';
import {
  Banknote,
  Candy,
  Cloud,
  Coins,
  Crown,
  Gift,
  Smile,
  Star,
  Ticket,
  Trophy,
  Utensils,
  WalletCards,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { CatalogPrize } from '../lib/catalog';
import { formatMMK } from '../lib/money';
import { getPrizeVisual, type PrizeTier } from '../lib/prizeThemes';

type PrizeCardSize = 'deck' | 'reveal' | 'winner' | 'other';
type PrizeCardState = 'default' | 'winner' | 'muted' | 'gone';

type PrizeCardProps = {
  prize: CatalogPrize;
  number?: number;
  caseNumber?: number;
  size?: PrizeCardSize;
  state?: PrizeCardState;
  className?: string;
};

const ICONS: Record<PrizeTier, readonly LucideIcon[]> = {
  jackpot: [Crown, Trophy, Star, Gift],
  'big-cash': [Banknote, WalletCards, Coins, Trophy],
  cash: [Coins, Banknote, Ticket, WalletCards],
  lucky: [Ticket, Star, Coins, Gift],
  surprise: [Gift, Candy, Utensils, Smile, Cloud],
};

export function PrizeIcon({ prize, className }: { prize: CatalogPrize; className?: string }) {
  const visual = getPrizeVisual(prize);
  const tierIcons = ICONS[visual.tier];
  const Icon = tierIcons[visual.iconIndex % tierIcons.length];
  return <Icon className={className} aria-hidden="true" />;
}

export default function PrizeCard({
  prize,
  number,
  caseNumber,
  size = 'deck',
  state = 'default',
  className = '',
}: PrizeCardProps) {
  const visual = getPrizeVisual(prize);
  const style = {
    '--prize-bg': visual.background,
    '--prize-accent': visual.accent,
    '--prize-tilt': `${visual.tilt}deg`,
  } as CSSProperties;

  return (
    <article
      className={`prize-card prize-card--${size} prize-card--${state} prize-pattern-${visual.pattern} ${className}`}
      style={style}
    >
      <div className="prize-card__topline">
        <span className="prize-card__number">
          {caseNumber ? `CASE ${String(caseNumber).padStart(2, '0')}` : String((number ?? prize.sortOrder) + 1).padStart(2, '0')}
        </span>
        <span className="prize-card__category">{visual.category}</span>
      </div>

      <div className="prize-card__art" aria-hidden="true">
        <span className="prize-card__spark prize-card__spark--one" />
        <span className="prize-card__spark prize-card__spark--two" />
        <div className="prize-card__icon" style={{ backgroundColor: visual.accent }}>
          <PrizeIcon prize={prize} className="h-10 w-10 stroke-[2.8] sm:h-12 sm:w-12" />
        </div>
      </div>

      <div className="prize-card__copy">
        <h3 title={prize.label}>{prize.label}</h3>
        <p>{prize.valueMmk > 0 ? formatMMK(prize.valueMmk) : 'No cash value'}</p>
      </div>

      {state === 'winner' && (
        <span className="prize-card__winner-badge" aria-label="Winning prize">
          <Crown size={22} strokeWidth={3} />
        </span>
      )}
      {state === 'muted' && <span className="prize-card__stamp">Other case</span>}
      {state === 'gone' && (
        <span className="prize-card__gone" aria-label={`${prize.label} is gone`}>
          <X aria-hidden="true" />
          <span>Gone</span>
        </span>
      )}
    </article>
  );
}
