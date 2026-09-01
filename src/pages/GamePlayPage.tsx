import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, Sparkles, WalletCards } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChosenCaseCard from '../components/ChosenCaseCard';
import PrizeCard, { PrizeIcon } from '../components/PrizeCard';
import WinnerScreen from '../components/WinnerScreen';
import { useGuestSession } from '../contexts/GuestSessionContext';
import { getGameCatalog, getGameOptions, type CatalogPrize } from '../lib/catalog';
import { getGameTheme } from '../lib/gameThemes';
import { getPrizeVisual, type PrizePattern } from '../lib/prizeThemes';
import { shuffle } from '../lib/shuffle';

type ShuffledCase = {
  caseNumber: number;
  prize: CatalogPrize;
  opened: boolean;
};

type GamePhase = 'pick-case' | 'elimination' | 'final-swap' | 'game-over';

const CASE_COLORS = ['#8B3FF5', '#FF8A1F', '#54C93F', '#2474E8', '#F53C78', '#18BBB7', '#FFBD1C'];
const CASE_PATTERNS: readonly PrizePattern[] = ['checker', 'dots', 'stripes', 'rings', 'burst'];

function buildCases(prizes: readonly CatalogPrize[]): ShuffledCase[] {
  return shuffle(prizes).map((prize, index) => ({
    caseNumber: index + 1,
    prize,
    opened: false,
  }));
}

function PrizeDeck({
  cases,
  showAll = false,
  title,
  subtitle,
}: {
  cases: ShuffledCase[];
  showAll?: boolean;
  title: string;
  subtitle: string;
}) {
  const visibleCases = [...cases]
    .sort((left, right) => left.prize.sortOrder - right.prize.sortOrder);
  const availableCount = cases.filter((item) => !item.opened).length;

  return (
    <section className="prize-deck-section">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#48EDA0]">
            <WalletCards size={24} />
            <h2 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">{title}</h2>
          </div>
          <p className="mt-1 text-sm font-medium text-[#9DA5CB]">{subtitle}</p>
        </div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D9FF43]">
          {showAll ? `${visibleCases.length} cards` : `${availableCount} still in play`}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {visibleCases.map((item) => (
          <PrizeCard
            key={item.prize.id}
            prize={item.prize}
            number={item.prize.sortOrder}
            state={!showAll && item.opened ? 'gone' : 'default'}
          />
        ))}
      </div>
    </section>
  );
}

export default function GamePlayPage() {
  const navigate = useNavigate();
  const { displayName, selectedEventId } = useGuestSession();
  const catalog = useMemo(() => {
    const selectedCatalog = getGameCatalog(selectedEventId ?? '');
    if (!selectedCatalog) throw new Error('Selected static game is unavailable');
    return selectedCatalog;
  }, [selectedEventId]);
  const game = catalog.game;
  const gameIndex = getGameOptions().findIndex((option) => option.id === game.id);
  const theme = getGameTheme(gameIndex);
  const [cases, setCases] = useState<ShuffledCase[]>(() => buildCases(catalog.prizes));
  const [playerCaseNumber, setPlayerCaseNumber] = useState<number | null>(null);
  const [phase, setPhase] = useState<GamePhase>('pick-case');
  const [revealingCase, setRevealingCase] = useState<number | null>(null);
  const [lastOpenedCaseNumber, setLastOpenedCaseNumber] = useState<number | null>(null);
  const [finalPrize, setFinalPrize] = useState<CatalogPrize | null>(null);
  const [finalCaseNumber, setFinalCaseNumber] = useState<number | null>(null);
  const [otherPrize, setOtherPrize] = useState<CatalogPrize | null>(null);
  const [finalDecision, setFinalDecision] = useState<'kept' | 'switched' | null>(null);
  const [message, setMessage] = useState('Pick one case to keep.');

  const playerCase = useMemo(() => {
    if (playerCaseNumber === null) return null;
    return cases.find((item) => item.caseNumber === playerCaseNumber) ?? null;
  }, [cases, playerCaseNumber]);

  const lastRemainingCase = useMemo(() => {
    if (playerCaseNumber === null) return null;
    return cases.find((item) => !item.opened && item.caseNumber !== playerCaseNumber) ?? null;
  }, [cases, playerCaseNumber]);

  const lastOpenedCase = useMemo(() => {
    if (lastOpenedCaseNumber === null) return null;
    return cases.find((item) => item.caseNumber === lastOpenedCaseNumber) ?? null;
  }, [cases, lastOpenedCaseNumber]);

  const startRound = useCallback(() => {
    setCases(buildCases(catalog.prizes));
    setPlayerCaseNumber(null);
    setPhase('pick-case');
    setRevealingCase(null);
    setLastOpenedCaseNumber(null);
    setFinalPrize(null);
    setFinalCaseNumber(null);
    setOtherPrize(null);
    setFinalDecision(null);
    setMessage('Pick one case to keep.');
  }, [catalog.prizes]);

  const handlePickCase = (selectedCase: ShuffledCase) => {
    setPlayerCaseNumber(selectedCase.caseNumber);
    setPhase('elimination');
    setMessage(`Case ${selectedCase.caseNumber} is yours. Open cases until only two remain.`);
  };

  const handleOpenCase = async (selectedCase: ShuffledCase) => {
    if (
      phase !== 'elimination' ||
      revealingCase !== null ||
      playerCaseNumber === null ||
      selectedCase.opened ||
      selectedCase.caseNumber === playerCaseNumber
    ) return;

    setRevealingCase(selectedCase.caseNumber);
    await new Promise((resolve) => window.setTimeout(resolve, 450));

    const nextCases = cases.map((item) => (
      item.caseNumber === selectedCase.caseNumber ? { ...item, opened: true } : item
    ));
    setCases(nextCases);
    setRevealingCase(null);
    setLastOpenedCaseNumber(selectedCase.caseNumber);

    const remaining = nextCases.filter((item) => !item.opened);
    if (remaining.length === 2) {
      const lastCase = remaining.find((item) => item.caseNumber !== playerCaseNumber);
      setPhase('final-swap');
      setMessage(lastCase
        ? `Final choice: keep Case ${playerCaseNumber}, or switch to Case ${lastCase.caseNumber}?`
        : 'Only two cases remain. Make your final choice.');
    } else {
      setMessage(`${remaining.length} unopened cases remain.`);
    }
  };

  const handleFinalChoice = (swap: boolean) => {
    if (playerCaseNumber === null || !playerCase || !lastRemainingCase) return;

    const wonCase = swap ? lastRemainingCase : playerCase;
    const unchosenCase = swap ? playerCase : lastRemainingCase;

    setFinalPrize(wonCase.prize);
    setFinalCaseNumber(wonCase.caseNumber);
    setOtherPrize(unchosenCase.prize);
    setFinalDecision(swap ? 'switched' : 'kept');
    setPhase('game-over');
    setMessage(swap
      ? `${displayName} switched to Case ${wonCase.caseNumber}.`
      : `${displayName} kept Case ${wonCase.caseNumber}.`);
    setCases((current) => current.map((item) => ({ ...item, opened: true })));
  };

  const handleReplay = () => {
    startRound();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (phase === 'pick-case' || phase === 'game-over') {
      navigate('/');
      return;
    }

    if (window.confirm('Leave this game? Your current progress will be lost.')) navigate('/');
  };

  if (phase === 'game-over' && finalPrize && finalCaseNumber !== null && otherPrize && finalDecision) {
    return (
      <main className="game-shell winner-page text-white">
        <div className="arcade-shape arcade-shape-left" aria-hidden="true" />
        <div className="arcade-shape arcade-shape-right" aria-hidden="true" />
        <div className="winner-page__topbar">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 rounded-lg border border-transparent px-2 py-2 font-bold text-[#C6CBE5] hover:border-white/20 hover:bg-white/10 hover:text-white">
              <ArrowLeft size={20} /> <span className="hidden sm:inline">Games</span>
            </button>
            <div className="rounded-full border-2 border-white/20 bg-[#0E0B28] px-4 py-2 text-sm font-semibold text-[#BFC5E3] shadow-[3px_3px_0_#02010B]">
              Playing as <span className="text-[#48EDA0]">{displayName}</span>
            </div>
        </div>

        <WinnerScreen
          displayName={displayName}
          finalPrize={finalPrize}
          finalCaseNumber={finalCaseNumber}
          otherPrize={otherPrize}
          decision={finalDecision}
          onReplay={handleReplay}
          onChooseGame={() => navigate('/')}
        />
      </main>
    );
  }

  return (
    <main className="game-shell min-h-screen px-3 py-5 text-white sm:px-5 sm:py-8">
      <div className="arcade-shape arcade-shape-left" aria-hidden="true" />
      <div className="arcade-shape arcade-shape-right" aria-hidden="true" />
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button onClick={handleBack} className="flex items-center gap-2 rounded-lg border border-transparent px-2 py-2 font-bold text-[#C6CBE5] hover:border-white/20 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#48EDA0]">
            <ArrowLeft size={20} /> <span className="hidden sm:inline">Back</span>
          </button>
          <div className="rounded-full border-2 border-white/20 bg-[#0E0B28] px-4 py-2 text-sm font-semibold text-[#BFC5E3] shadow-[3px_3px_0_#02010B]">
            Playing as <span className="text-[#48EDA0]">{displayName}</span>
          </div>
        </div>

        <section className="game-panel rounded-2xl p-4 sm:p-6 lg:p-8">
          <header className="mb-6 text-center sm:mb-8">
            <div className="mb-3 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#48EDA0]">
              <Sparkles size={15} /> {theme.kicker}
            </div>
            <h1 className="arcade-title text-2xl font-black sm:text-4xl">{game.title}</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-[#9DA5CB] sm:text-base">{game.description}</p>
            <p className="mx-auto mt-5 max-w-2xl rounded-xl border-2 border-white/15 bg-[#08051D] px-4 py-3 text-sm font-bold text-white sm:text-base">{message}</p>
            {playerCaseNumber !== null && phase !== 'pick-case' && (
              <p className="mt-3 text-sm text-[#48EDA0]">Your case: <strong>#{playerCaseNumber}</strong></p>
            )}
          </header>

          {phase === 'final-swap' && (
            <div className="mb-7 rounded-2xl border-[3px] border-[#F8F7EF] bg-[#7B36D8] p-5 text-center shadow-[6px_7px_0_#02010B] sm:p-7">
              <h2 className="arcade-title text-2xl font-black uppercase">Keep or switch?</h2>
              <p className="mt-3 font-medium text-white/80">This is your final decision, {displayName}.</p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <button onClick={() => handleFinalChoice(false)} className="rounded-xl border-[3px] border-white bg-[#0E0B28] px-6 py-3 font-black text-white shadow-[4px_4px_0_#02010B] hover:-translate-y-1">
                  Keep Case {playerCaseNumber}
                </button>
                <button onClick={() => handleFinalChoice(true)} className="rounded-xl border-[3px] border-white bg-[#48EDA0] px-6 py-3 font-black text-[#09051B] shadow-[4px_4px_0_#02010B] hover:-translate-y-1 hover:bg-[#D9FF43]">
                  Switch to Case {lastRemainingCase?.caseNumber}
                </button>
              </div>
            </div>
          )}

          <div className="case-board mb-8">
            <div className="case-grid grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-3">
              {cases.map((caseItem) => {
                const revealed = caseItem.opened || revealingCase === caseItem.caseNumber;
                const selected = caseItem.caseNumber === playerCaseNumber && !caseItem.opened;
                const prizeVisual = getPrizeVisual(caseItem.prize);
                const pattern = revealed ? prizeVisual.pattern : CASE_PATTERNS[(caseItem.caseNumber - 1) % CASE_PATTERNS.length];

                return (
                  <button
                    key={caseItem.caseNumber}
                    onClick={() => phase === 'pick-case' ? handlePickCase(caseItem) : void handleOpenCase(caseItem)}
                    disabled={
                      caseItem.opened ||
                      phase === 'final-swap' ||
                      phase === 'game-over' ||
                      (phase === 'elimination' && selected) ||
                      revealingCase !== null
                    }
                    aria-label={revealed ? `Case ${caseItem.caseNumber}: ${caseItem.prize.label}` : `Case ${caseItem.caseNumber}`}
                    style={{ backgroundColor: revealed ? prizeVisual.background : selected ? '#0E0B28' : CASE_COLORS[(caseItem.caseNumber - 1) % CASE_COLORS.length] }}
                    className={`game-case prize-pattern-${pattern} aspect-square rounded-xl p-1 text-sm font-black text-[#09051B] transition-transform enabled:hover:-translate-y-1 sm:text-base lg:aspect-[3/2] ${
                      selected
                        ? 'game-case--yours text-[#D9FF43]'
                        : 'enabled:hover:ring-2 enabled:hover:ring-white/80'
                    } ${revealingCase === caseItem.caseNumber ? 'animate-pulse' : ''}`}
                  >
                    {revealed ? (
                      <span className="relative z-10 flex h-full flex-col items-center justify-center gap-1">
                        <PrizeIcon prize={caseItem.prize} className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                        <span className="line-clamp-2 text-[0.5rem] leading-tight sm:text-[0.62rem]">{caseItem.prize.label}</span>
                      </span>
                    ) : selected ? (
                      <span className="relative z-10 flex flex-col uppercase leading-none">
                        <span className="text-[0.62rem] tracking-[0.12em]">Yours</span>
                        <span className="mt-1 text-base">#{caseItem.caseNumber}</span>
                      </span>
                    ) : <span className="relative z-10">{caseItem.caseNumber}</span>}
                  </button>
                );
              })}
            </div>

            <ChosenCaseCard
              caseNumber={playerCaseNumber}
              accent={theme.accent}
              openedCase={lastOpenedCase}
            />
          </div>

          <PrizeDeck
            cases={cases}
            title="Prize deck"
            subtitle="Crossed-out prizes are gone. Unmarked prizes are still in play."
          />
        </section>
      </div>
    </main>
  );
}
