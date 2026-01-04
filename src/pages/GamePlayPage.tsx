import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Prize, GameEvent } from '../lib/supabase';
import { ArrowLeft, Gift, DollarSign } from 'lucide-react';
import CongratsConfetti from '../components/CongratsConfetti';
import { formatMMK } from '../lib/money';

type ShuffledCase = {
  caseNumber: number;
  prize: Prize;
  opened: boolean;
};

type GamePhase = 'pick-case' | 'elimination' | 'final-swap' | 'game-over';

export default function GamePlayPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [event, setEvent] = useState<GameEvent | null>(null);
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
    loadEventAndPrizes();
  }, [eventId]);

  const loadEventAndPrizes = async () => {
    if (!eventId) {
      navigate('/dashboard');
      return;
    }

    try {
      // Load event details
      const { data: eventData, error: eventError } = await supabase
        .from('game_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      if (!eventData) {
        navigate('/dashboard');
        return;
      }

      setEvent(eventData);

      // Load prizes
      const { data: prizesData, error: prizesError } = await supabase
        .from('prize_pool')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order');

      if (prizesError) throw prizesError;

      const shuffled = [...prizesData].sort(() => Math.random() - 0.5);
      const casesWithNumbers: ShuffledCase[] = shuffled.map((prize, index) => ({
        caseNumber: index + 1,
        prize,
        opened: false,
      }));

      setCases(casesWithNumbers);
      setLoading(false);
    } catch (error) {
      console.error('Error loading event and prizes:', error);
      navigate('/dashboard');
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
    if (!user || !profile || !event) return;
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

  const getCaseRevealColor = (value: number, isFinalChosen: boolean) => {
    if (isFinalChosen) return 'bg-blue-200 border-blue-400 text-blue-900';
    return isGoodPrize(value)
      ? 'bg-green-200 border-green-400 text-green-900'
      : 'bg-red-200 border-red-400 text-red-900';
  };

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDF1EF] to-[#F7D6D2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E56353] mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading game...</p>
        </div>
      </div>
    );
  }

  const handleBackClick = () => {
    if (phase === 'game-over') {
      navigate('/dashboard');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to leave? Your current game progress will be lost.'
    );
    if (confirmed) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF1EF] to-[#F7D6D2] p-3 sm:p-4 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={handleBackClick}
          className="mb-4 sm:mb-6 flex items-center gap-2 text-gray-700 hover:text-gray-900 transition font-medium"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{event.event_name}</h2>
            <p className="text-base sm:text-lg text-gray-600 px-2">{message}</p>
            {playerCaseNumber !== null && phase !== 'pick-case' && (
              <p className="mt-2 text-xs sm:text-sm text-gray-500">
                Your chosen case: <span className="font-semibold">Case {playerCaseNumber}</span>
              </p>
            )}
          </div>

          {phase === 'final-swap' && (
            <div className="bg-gradient-to-r from-[#FCE8E5] to-[#F7D6D2] border-2 border-[#E56353] rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Final Decision</h3>
              <p className="text-sm sm:text-lg text-gray-700 mb-4 sm:mb-6 px-2">
                Keep your chosen case, or switch to the last remaining case.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={() => handleSwap(true)}
                  disabled={!lastRemainingCase}
                  className="bg-[#E56353] hover:bg-[#D55445] disabled:bg-[#E9A39A] text-white font-bold py-3 px-6 sm:px-8 rounded-lg transition shadow-md hover:shadow-lg text-sm sm:text-base"
                >
                  {lastRemainingCase ? `SWITCH TO CASE ${lastRemainingCase.caseNumber}` : 'SWITCH'}
                </button>
                <button
                  onClick={() => handleSwap(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 sm:px-8 rounded-lg transition shadow-md hover:shadow-lg text-sm sm:text-base"
                >
                  {playerCaseNumber !== null ? `KEEP CASE ${playerCaseNumber}` : 'KEEP MY CASE'}
                </button>
              </div>
            </div>
          )}

          {phase === 'game-over' && finalPrize && (
            <div className="relative overflow-hidden bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 rounded-xl p-6 sm:p-8 mb-6 sm:mb-8 text-center">
              <CongratsConfetti />
              <Gift size={48} className="sm:w-16 sm:h-16 mx-auto mb-4 text-green-600 relative" />
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">Congratulations!</h3>
              {finalCaseNumber !== null && (
                <p className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
                  Final choice: <span className="font-bold">Case {finalCaseNumber}</span>
                </p>
              )}
              <p className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">You won:</p>
              <p className="text-2xl sm:text-4xl font-bold text-green-600 mb-3 sm:mb-4 break-words px-2">{finalPrize.name}</p>
              {finalPrize.value > 0 && (
                <p className="text-2xl sm:text-3xl font-semibold text-gray-700">
                  {formatMMK(finalPrize.value)}
                </p>
              )}
              {otherPrize && (
                <p className="mt-4 text-xs sm:text-sm text-gray-600">
                  The other case had: <span className="font-semibold">{otherPrize.name}</span>
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 sm:gap-3 mb-6 sm:mb-8">
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
                  aspect-square rounded-lg font-bold text-sm sm:text-base lg:text-lg transition-all transform hover:scale-105
                  ${
                    caseItem.caseNumber === playerCaseNumber && !caseItem.opened
                      ? 'bg-[#E56353] text-white ring-2 sm:ring-4 ring-[#F2B7B0]'
                      : ''
                  }
                  ${
                    caseItem.opened || revealingCase === caseItem.caseNumber
                      ? `${getCaseRevealColor(caseItem.prize.value, phase === 'game-over' && finalCaseNumber === caseItem.caseNumber)} cursor-not-allowed`
                      : 'bg-white border-2 border-gray-300 hover:border-[#E56353] text-gray-800'
                  }
                  ${revealingCase === caseItem.caseNumber ? 'animate-pulse' : ''}
                  ${phase === 'game-over' ? 'cursor-default' : ''}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {caseItem.opened || revealingCase === caseItem.caseNumber ? (
                  <div className="text-[0.6rem] sm:text-xs px-1 break-words leading-tight">
                    {caseItem.prize.name}
                  </div>
                ) : (
                  caseItem.caseNumber
                )}
              </button>
            ))}
          </div>

          <div className="border-t pt-4 sm:pt-6">
            <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
              <DollarSign size={20} className="sm:w-6 sm:h-6" />
              {phase === 'game-over' ? 'All Prizes' : 'Remaining Prizes'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
              {cases
                .filter((c) => (phase === 'game-over' ? true : !c.opened))
                .slice()
                .sort((a, b) => a.caseNumber - b.caseNumber)
                .map((c) => {
                  const isFinalPrize = phase === 'game-over' && finalCaseNumber === c.caseNumber;
                  return (
                    <div
                      key={c.caseNumber}
                      className={`p-2 sm:p-3 rounded-lg border-2 ${
                        isFinalPrize
                          ? 'bg-blue-100 border-blue-400 text-blue-900'
                          : getPrizeColor(c.prize.value)
                      }`}
                    >
                      <p className="font-semibold truncate text-xs sm:text-sm">
                        {phase === 'game-over' ? `Case ${c.caseNumber}: ` : ''}
                        {c.prize.name}
                      </p>
                      <p className="text-xs sm:text-sm">
                        {c.prize.value > 0 ? formatMMK(c.prize.value) : 'Joke/Blank'}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

