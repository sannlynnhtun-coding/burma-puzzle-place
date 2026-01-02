import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Prize, GameEvent } from '../lib/supabase';
import { ArrowLeft, Gift, DollarSign } from 'lucide-react';
import CongratsConfetti from './CongratsConfetti';
import { formatMMK } from '../lib/money';

type ShuffledCase = {
  caseNumber: number;
  prize: Prize;
  opened: boolean;
};

type GamePhase = 'pick-case' | 'elimination' | 'final-swap' | 'game-over';

type GamePlayProps = {
  event: GameEvent;
  onBack: () => void;
};

export default function GamePlay({ event, onBack }: GamePlayProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<ShuffledCase[]>([]);
  const [playerCaseNumber, setPlayerCaseNumber] = useState<number | null>(null);
  const [phase, setPhase] = useState<GamePhase>('pick-case');
  const [revealingCase, setRevealingCase] = useState<number | null>(null);
  const [finalPrize, setFinalPrize] = useState<Prize | null>(null);
  const [finalCaseNumber, setFinalCaseNumber] = useState<number | null>(null);
  const [otherPrize, setOtherPrize] = useState<Prize | null>(null);
  const [message, setMessage] = useState('');

  const playerCase = useMemo(() => {
    if (playerCaseNumber === null) return null;
    return cases.find((c) => c.caseNumber === playerCaseNumber) ?? null;
  }, [cases, playerCaseNumber]);

  const lastRemainingCase = useMemo(() => {
    if (playerCaseNumber === null) return null;
    return cases.find((c) => !c.opened && c.caseNumber !== playerCaseNumber) ?? null;
  }, [cases, playerCaseNumber]);

  useEffect(() => {
    loadAndShufflePrizes();
  }, []);

  const loadAndShufflePrizes = async () => {
    try {
      const { data, error } = await supabase
        .from('prize_pool')
        .select('*')
        .eq('event_id', event.id)
        .order('sort_order');

      if (error) throw error;

      const shuffled = [...data].sort(() => Math.random() - 0.5);
      const casesWithNumbers: ShuffledCase[] = shuffled.map((prize, index) => ({
        caseNumber: index + 1,
        prize,
        opened: false,
      }));

      setCases(casesWithNumbers);
      setLoading(false);
    } catch (error) {
      console.error('Error loading prizes:', error);
      setLoading(false);
    }
  };

  const handlePickCase = (selectedCase: ShuffledCase) => {
    setPlayerCaseNumber(selectedCase.caseNumber);
    setPhase('elimination');
    setMessage(`You picked Case ${selectedCase.caseNumber}! Now open cases until only 2 remain.`);
  };

  const handleOpenCase = async (selectedCase: ShuffledCase) => {
    if (phase !== 'elimination') return;
    if (revealingCase !== null) return;
    if (playerCaseNumber === null) return;
    if (selectedCase.opened) return;
    if (selectedCase.caseNumber === playerCaseNumber) return;

    setRevealingCase(selectedCase.caseNumber);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const nextCases = cases.map((c) =>
      c.caseNumber === selectedCase.caseNumber ? { ...c, opened: true } : c
    );

    setCases(nextCases);

    setRevealingCase(null);

    const remainingUnopened = nextCases.filter((c) => !c.opened).length;
    if (remainingUnopened === 2) {
      const lastCase = nextCases.find(
        (c) => !c.opened && c.caseNumber !== playerCaseNumber
      );
      setPhase('final-swap');
      setMessage(
        lastCase
          ? `Only 2 cases left! Keep Case ${playerCaseNumber} or switch to Case ${lastCase.caseNumber}?`
          : 'Only 2 cases left! Make your final decision.'
      );
    } else {
      setMessage(`Open a case. Remaining unopened cases: ${remainingUnopened}.`);
    }
  };

  const handleSwap = async (swap: boolean) => {
    if (!user || !profile) return;
    if (playerCaseNumber === null) return;
    if (!playerCase) return;

    const lastCase = cases.find((c) => !c.opened && c.caseNumber !== playerCaseNumber);
    if (!lastCase) return;

    const wonCase = swap ? lastCase : playerCase;

    try {
      await supabase.from('game_history').insert({
        event_id: event.id,
        player_id: user.id,
        won_prize_name: wonCase.prize.name,
        won_prize_value: wonCase.prize.value,
      });

      setFinalPrize(wonCase.prize);
      setFinalCaseNumber(wonCase.caseNumber);
      setOtherPrize((swap ? playerCase : lastCase).prize);
      setPhase('game-over');
      setMessage(
        swap
          ? `You switched to Case ${wonCase.caseNumber}!`
          : `You kept Case ${wonCase.caseNumber}!`
      );

      setCases(
        cases.map((c) => ({
          ...c,
          opened: true,
        }))
      );
    } catch (error) {
      console.error('Error saving game:', error);
    }
  };

  const isGoodPrize = (value: number) => value > 0;

  const getPrizeColor = (value: number) => {
    return isGoodPrize(value)
      ? 'bg-green-100 border-green-300 text-green-800'
      : 'bg-red-100 border-red-300 text-red-800';
  };

  const getCaseRevealColor = (value: number) => {
    return isGoodPrize(value)
      ? 'bg-green-200 border-green-400 text-green-900'
      : 'bg-red-200 border-red-400 text-red-900';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <div className="max-w-7xl mx-auto">
        {phase === 'game-over' ? (
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
        ) : null}

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{event.event_name}</h2>
            <p className="text-lg text-gray-600">{message}</p>
            {playerCaseNumber !== null && phase !== 'pick-case' && (
              <p className="mt-2 text-sm text-gray-500">
                Your chosen case: <span className="font-semibold">Case {playerCaseNumber}</span>
              </p>
            )}
          </div>

          {phase === 'final-swap' && (
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-400 rounded-xl p-6 mb-8 text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Final Decision</h3>
              <p className="text-lg text-gray-700 mb-6">
                Keep your chosen case, or switch to the last remaining case.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => handleSwap(true)}
                  disabled={!lastRemainingCase}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-8 rounded-lg transition"
                >
                  {lastRemainingCase ? `SWITCH TO CASE ${lastRemainingCase.caseNumber}` : 'SWITCH'}
                </button>
                <button
                  onClick={() => handleSwap(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition"
                >
                  {playerCaseNumber !== null ? `KEEP CASE ${playerCaseNumber}` : 'KEEP MY CASE'}
                </button>
              </div>
            </div>
          )}

          {phase === 'game-over' && finalPrize && (
            <div className="relative overflow-hidden bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 rounded-xl p-8 mb-8 text-center">
              <CongratsConfetti />
              <Gift size={64} className="mx-auto mb-4 text-green-600 relative" />
              <h3 className="text-3xl font-bold text-gray-800 mb-4">Congratulations!</h3>
              {finalCaseNumber !== null && (
                <p className="text-xl font-semibold text-gray-700 mb-2">
                  Final choice: <span className="font-bold">Case {finalCaseNumber}</span>
                </p>
              )}
              <p className="text-2xl font-semibold text-gray-700 mb-2">You won:</p>
              <p className="text-4xl font-bold text-green-600 mb-4">{finalPrize.name}</p>
              {finalPrize.value > 0 && (
                <p className="text-3xl font-semibold text-gray-700">
                  {formatMMK(finalPrize.value)}
                </p>
              )}
              {otherPrize && (
                <p className="mt-4 text-sm text-gray-600">
                  The other case had: <span className="font-semibold">{otherPrize.name}</span>
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mb-8">
            {cases.map((caseItem) => (
              <button
                key={caseItem.caseNumber}
                onClick={() => {
                  if (phase === 'pick-case') {
                    handlePickCase(caseItem);
                  } else if (
                    phase === 'elimination' &&
                    !caseItem.opened &&
                    caseItem.caseNumber !== playerCaseNumber
                  ) {
                    handleOpenCase(caseItem);
                  }
                }}
                disabled={
                  caseItem.opened ||
                  phase === 'final-swap' ||
                  phase === 'game-over' ||
                  (phase === 'elimination' && caseItem.caseNumber === playerCaseNumber) ||
                  revealingCase !== null
                }
                className={`
                  aspect-square rounded-lg font-bold text-lg transition-all transform hover:scale-105
                  ${caseItem.caseNumber === playerCaseNumber && !caseItem.opened ? 'bg-blue-500 text-white ring-4 ring-blue-300' : ''}
                  ${
                    caseItem.opened || revealingCase === caseItem.caseNumber
                      ? `${getCaseRevealColor(caseItem.prize.value)} cursor-not-allowed`
                      : 'bg-white border-2 border-gray-300 hover:border-blue-400 text-gray-800'
                  }
                  ${revealingCase === caseItem.caseNumber ? 'animate-pulse' : ''}
                  ${phase === 'game-over' ? 'cursor-default' : ''}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {caseItem.opened || revealingCase === caseItem.caseNumber ? (
                  <div className="text-xs px-1 break-words">
                    {caseItem.prize.name}
                  </div>
                ) : (
                  caseItem.caseNumber
                )}
              </button>
            ))}
          </div>

          <div className="border-t pt-6">
            <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign size={24} />
              Remaining Prizes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {cases
                .filter((c) => !c.opened)
                .map((c) => (
                  <div
                    key={c.caseNumber}
                    className={`p-3 rounded-lg border-2 ${getPrizeColor(c.prize.value)}`}
                  >
                    <p className="font-semibold truncate">{c.prize.name}</p>
                    <p className="text-sm">
                      {c.prize.value > 0 ? formatMMK(c.prize.value) : 'Joke/Blank'}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
