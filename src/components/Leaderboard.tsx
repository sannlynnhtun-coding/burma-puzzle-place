import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Medal, Award } from 'lucide-react';

type LeaderboardEntry = {
  id: string;
  player_username: string;
  event_name: string;
  won_prize_name: string;
  won_prize_value: number;
  played_at: string;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('game_history')
        .select(
          `
          id,
          won_prize_name,
          won_prize_value,
          played_at,
          player_id,
          profiles!game_history_player_id_fkey (username),
          game_events!game_history_event_id_fkey (event_name)
        `
        )
        .gt('won_prize_value', 0)
        .order('won_prize_value', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const formattedData: LeaderboardEntry[] = data.map((entry: any) => ({
        id: entry.id,
        player_username: entry.profiles?.username || 'Unknown',
        event_name: entry.game_events?.event_name || 'Unknown Event',
        won_prize_name: entry.won_prize_name,
        won_prize_value: entry.won_prize_value,
        played_at: entry.played_at,
      }));

      setLeaderboard(formattedData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="text-yellow-500" size={24} />;
    if (rank === 2) return <Medal className="text-gray-400" size={24} />;
    if (rank === 3) return <Award className="text-orange-600" size={24} />;
    return null;
  };

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300';
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300';
    if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300';
    return 'bg-white border-gray-200';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center text-gray-600">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="text-yellow-500" size={32} />
        <h2 className="text-3xl font-bold text-gray-800">Global Leaderboard</h2>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center text-gray-600 py-8">
          No winners yet. Be the first to play and win!
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const rank = index + 1;
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all hover:shadow-md ${getRankClass(
                  rank
                )}`}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 font-bold text-gray-700">
                  {getRankIcon(rank) || `#${rank}`}
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Player</p>
                    <p className="font-semibold text-gray-800">{entry.player_username}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Event</p>
                    <p className="font-medium text-gray-700 truncate">{entry.event_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Prize</p>
                    <p className="font-medium text-gray-700 truncate">{entry.won_prize_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase">Value</p>
                    <p className="font-bold text-green-600 text-lg">
                      ${entry.won_prize_value.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
