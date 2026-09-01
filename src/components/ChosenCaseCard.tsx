import type { CSSProperties } from 'react';
import { Lock, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import type { CatalogPrize } from '../lib/catalog';
import PrizeCard from './PrizeCard';

type ChosenCaseCardProps = {
  caseNumber: number | null;
  accent: string;
  openedCase?: {
    caseNumber: number;
    prize: CatalogPrize;
  } | null;
};

export default function ChosenCaseCard({ caseNumber, accent, openedCase = null }: ChosenCaseCardProps) {
  const selected = caseNumber !== null;

  if (openedCase) {
    return (
      <aside className="chosen-case chosen-case--revealed" aria-live="polite">
        <h2 className="chosen-case__heading">
          <WalletCards size={17} /> Opened case #{openedCase.caseNumber}
        </h2>
        <PrizeCard
          key={openedCase.caseNumber}
          prize={openedCase.prize}
          caseNumber={openedCase.caseNumber}
          size="reveal"
          className="chosen-case__revealed-card"
        />
        {selected && (
          <p className="chosen-case__kept-note">
            <ShieldCheck size={15} /> Your Case {String(caseNumber).padStart(2, '0')} is still kept safe
          </p>
        )}
      </aside>
    );
  }

  return (
    <aside className="chosen-case" aria-live="polite">
      <h2 className="chosen-case__heading">
        <Sparkles size={17} /> Your case <Sparkles size={17} />
      </h2>
      <div
        className={`chosen-case__card ${selected ? 'chosen-case__card--selected' : 'chosen-case__card--empty'}`}
        style={{ '--chosen-accent': accent } as CSSProperties}
      >
        <div className="chosen-case__pattern" aria-hidden="true" />
        <p className="chosen-case__number">
          {selected ? `Case ${String(caseNumber).padStart(2, '0')}` : 'Choose a case'}
        </p>
        <div className="chosen-case__lock" aria-hidden="true">
          <Lock className="h-12 w-12 stroke-[3] sm:h-14 sm:w-14" />
          <span>?</span>
        </div>
        {selected ? (
          <>
            <p className="chosen-case__safe"><ShieldCheck size={16} /> Kept safe</p>
            <p className="chosen-case__hint">Prize stays hidden until the final choice.</p>
          </>
        ) : (
          <p className="chosen-case__hint">Pick one card from the grid to keep.</p>
        )}
      </div>
    </aside>
  );
}
