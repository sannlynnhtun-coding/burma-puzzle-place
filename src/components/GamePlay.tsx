import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Prize, GameEvent } from '../lib/supabase';
import { ArrowLeft, Gift, DollarSign, TrendingUp } from 'lucide-react';

type ShuffledCase = {
  caseNumber: number;
  prize: Prize;
  opened: boolean;
};

type GamePhase = 'pick-case' | 'elimination' | 'banker-offer' | 'final-swap' | 'game-over';

type GamePlayProps = {
  event: GameEvent;
  onBack: () => void;
};

export default function GamePlay({ event, onBack }: GamePlayProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<ShuffledCase[]>([]);
  const [playerCase, setPlayerCase] = useState<ShuffledCase | null>(null);
  const [phase, setPhase] = useState<GamePhase>('pick-case');
  const [bankerOffer, setBankerOffer] = useState(0);
  const [casesToOpen, setCasesToOpen] = useState(5);
  const [casesOpenedThisRound, setCasesOpenedThisRound] = useState(0);
  const [revealingCase, setRevealingCase] = useState<number | null>(null);
  const [finalPrize, setFinalPrize] = useState<Prize | null>(null);
  const [message, setMessage] = useState('');

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
    setPlayerCase(selectedCase);
    setPhase('elimination');
    setMessage(`You picked Case ${selectedCase.caseNumber}! Now open ${casesToOpen} cases.`);
  };

  const handleOpenCase = async (selectedCase: ShuffledCase) => {
    if (revealingCase !== null || selectedCase.opened || selectedCase === playerCase) return;

    setRevealingCase(selectedCase.caseNumber);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    setCases(
      cases.map((c) =>
        c.caseNumber === selectedCase.caseNumber ? { ...c, opened: true } : c
      )
    );

    setRevealingCase(null);
    const newCount = casesOpenedThisRound + 1;
    setCasesOpenedThisRound(newCount);

    if (newCount >= casesToOpen) {
      const unopenedCases = cases.filter((c) => !c.opened && c !== playerCase);
      if (unopenedCases.length === 1) {
        setPhase('final-swap');
        setMessage('Only 2 cases left! Do you want to swap your case with the last one?');
      } else {
        const offer = calculateBankerOffer();
        setBankerOffer(offer);
        setPhase('banker-offer');
        setMessage(`The Banker offers you $${offer.toFixed(2)}!`);
      }
      setCasesOpenedThisRound(0);
    }
  };

  const calculateBankerOffer = (): number => {
    const unopenedCases = cases.filter((c) => !c.opened && c !== playerCase);
    if (playerCase) {
      unopenedCases.push(playerCase);
    }

    const totalValue = unopenedCases.reduce((sum, c) => sum + c.prize.value, 0);
    const average = totalValue / unopenedCases.length;

    const totalCases = cases.length;
    const remainingCases = unopenedCases.length;

    let percentage = 0.6;
    if (remainingCases <= 2) {
      percentage = 1.0;
    } else if (remainingCases <= 4) {
      percentage = 0.85;
    } else if (remainingCases <= 7) {
      percentage = 0.75;
    }

    return average * percentage;
  };

  const handleDeal = async () => {
    if (!user || !profile) return;

    try {
      await supabase.from('game_history').insert({
        event_id: event.id,
        player_id: user.id,
        won_prize_name: `Banker's Offer`,
        won_prize_value: bankerOffer,
      });

      setFinalPrize({
        id: 'banker',
        event_id: event.id,
        name: `Banker's Offer`,
        value: bankerOffer,
        is_blank: false,
        sort_order: 0,
      });
      setPhase('game-over');
      setMessage(`Deal! You won $${bankerOffer.toFixed(2)}!`);
    } catch (error) {
      console.error('Error saving game:', error);
    }
  };

  const handleNoDeal = () => {
    const newCasesToOpen = Math.max(1, Math.floor(cases.filter((c) => !c.opened && c !== playerCase).length / 3));
    setCasesToOpen(newCasesToOpen);
    setPhase('elimination');
    setMessage(`No Deal! Open ${newCasesToOpen} more cases.`);
  };

  const handleSwap = async (swap: boolean) => {
    if (!user || !profile || !playerCase) return;

    const lastCase = cases.find((c) => !c.opened && c !== playerCase);
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
      setPhase('game-over');
      setMessage(
        swap
          ? `You swapped! You won: ${wonCase.prize.name}`
          : `You kept your case! You won: ${wonCase.prize.name}`
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

  const handleKeepCase = async () => {
    if (!user || !profile || !playerCase) return;

    try {
      await supabase.from('game_history').insert({
        event_id: event.id,
        player_id: user.id,
        won_prize_name: playerCase.prize.name,
        won_prize_value: playerCase.prize.value,
      });

      setFinalPrize(playerCase.prize);
      setPhase('game-over');
      setMessage(`You kept your case! You won: ${playerCase.prize.name}`);

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

  const getPrizeColor = (value: number) => {
    if (value === 0) return 'bg-green-100 border-green-300 text-green-800';
    if (value < 50) return 'bg-blue-100 border-blue-300 text-blue-800';
    if (value < 500) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    return 'bg-red-100 border-red-300 text-red-800';
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
          </div>

          {phase === 'banker-offer' && (
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400 rounded-xl p-6 mb-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <TrendingUp size={32} className="text-yellow-600" />
                <h3 className="text-3xl font-bold text-gray-800">Banker's Offer</h3>
              </div>
              <p className="text-5xl font-bold text-green-600 mb-6">
                ${bankerOffer.toFixed(2)}
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleDeal}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition text-xl"
                >
                  DEAL
                </button>
                <button
                  onClick={handleNoDeal}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition text-xl"
                >
                  NO DEAL
                </button>
              </div>
            </div>
          )}

          {phase === 'final-swap' && (
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-400 rounded-xl p-6 mb-8 text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Final Decision</h3>
              <p className="text-lg text-gray-700 mb-6">
                Do you want to swap your case with the last remaining case?
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => handleSwap(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition"
                >
                  SWAP
                </button>
                <button
                  onClick={() => handleSwap(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition"
                >
                  KEEP MY CASE
                </button>
              </div>
            </div>
          )}

          {phase === 'game-over' && finalPrize && (
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 rounded-xl p-8 mb-8 text-center">
              <Gift size={64} className="mx-auto mb-4 text-green-600" />
              <h3 className="text-3xl font-bold text-gray-800 mb-4">Congratulations!</h3>
              <p className="text-2xl font-semibold text-gray-700 mb-2">You won:</p>
              <p className="text-4xl font-bold text-green-600 mb-4">{finalPrize.name}</p>
              {finalPrize.value > 0 && (
                <p className="text-3xl font-semibold text-gray-700">
                  Value: ${finalPrize.value.toFixed(2)}
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
                  } else if (phase === 'elimination' && !caseItem.opened && caseItem !== playerCase) {
                    handleOpenCase(caseItem);
                  }
                }}
                disabled={
                  caseItem.opened ||
                  phase === 'banker-offer' ||
                  phase === 'final-swap' ||
                  phase === 'game-over' ||
                  (phase === 'elimination' && caseItem === playerCase) ||
                  revealingCase !== null
                }
                className={`
                  aspect-square rounded-lg font-bold text-lg transition-all transform hover:scale-105
                  ${caseItem === playerCase && !caseItem.opened ? 'bg-blue-500 text-white ring-4 ring-blue-300' : ''}
                  ${caseItem.opened ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border-2 border-gray-300 hover:border-blue-400 text-gray-800'}
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
                      {c.prize.value > 0 ? `$${c.prize.value.toFixed(2)}` : 'Joke/Blank'}
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
