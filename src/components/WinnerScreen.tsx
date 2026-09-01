import { ArrowLeft, Gamepad2, RotateCcw, Sparkles, Star } from 'lucide-react';
import type { CatalogPrize } from '../lib/catalog';
import CongratsConfetti from './CongratsConfetti';
import PrizeCard from './PrizeCard';

type WinnerScreenProps = {
  displayName: string;
  finalPrize: CatalogPrize;
  finalCaseNumber: number;
  otherPrize: CatalogPrize;
  decision: 'kept' | 'switched';
  onReplay: () => void;
  onChooseGame: () => void;
};

export default function WinnerScreen({
  displayName,
  finalPrize,
  finalCaseNumber,
  otherPrize,
  decision,
  onReplay,
  onChooseGame,
}: WinnerScreenProps) {
  return (
    <section className="winner-stage relative h-full w-full overflow-hidden text-center">
      <CongratsConfetti pieces={42} />
      <div className="winner-rays" aria-hidden="true" />
      <div className="winner-decor winner-decor--left" aria-hidden="true"><Sparkles /></div>
      <div className="winner-decor winner-decor--right" aria-hidden="true"><Star fill="currentColor" /></div>

      <div className="winner-stage__content relative z-10">
        <span className="winner-clear-badge"><Star size={15} fill="currentColor" /> Game clear <Star size={15} fill="currentColor" /></span>
        <h1 className="winner-title">You win!</h1>
        <h2 className="winner-congratulations text-xl font-black text-white sm:text-3xl">Congratulations, {displayName}!</h2>
        <p className="winner-decision text-sm font-bold text-[#48EDA0] sm:text-base">
          You {decision} your lucky case.
        </p>

        <PrizeCard
          prize={finalPrize}
          caseNumber={finalCaseNumber}
          size="winner"
          state="winner"
          className="winner-prize-card"
        />

        <div className="winner-other">
          <p className="winner-other__label text-xs font-black uppercase tracking-[0.24em] text-[#9DA5CB]">The other case</p>
          <PrizeCard prize={otherPrize} size="other" state="muted" />
        </div>

        <div className="winner-actions flex w-full flex-col justify-center gap-3 sm:flex-row">
          <button onClick={onReplay} className="winner-action winner-action--replay">
            <RotateCcw size={21} /> Play again
          </button>
          <button onClick={onChooseGame} className="winner-action winner-action--games">
            <Gamepad2 size={22} /> Choose another game
          </button>
        </div>

        <button onClick={onChooseGame} className="winner-back inline-flex items-center gap-2 text-sm font-bold text-[#9DA5CB] hover:text-white">
          <ArrowLeft size={16} /> Back to game collection
        </button>
      </div>
    </section>
  );
}
