import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy } from 'lucide-react';

type LeaderboardEntry = {
  id: string;
  player_username: string;
  event_name: string;
  won_prize_name: string;
  played_at: string;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const pageSize = 15;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [totalCount]);

  const loadLeaderboard = useCallback(async (pageNumber: number) => {
    setLoading(true);
    try {
      const from = (pageNumber - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('game_history')
        .select(
          `
          id,
          won_prize_name,
          played_at,
          profiles!game_history_player_id_fkey (username),
          game_events!game_history_event_id_fkey (event_name)
        `,
          { count: 'exact' }
        )
        // .gt('won_prize_value', 0)
        .order('played_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setTotalCount(count ?? 0);

      const formattedData: LeaderboardEntry[] = data.map((entry: any) => ({
        id: entry.id,
        player_username: entry.profiles?.username || 'Unknown',
        event_name: entry.game_events?.event_name || 'Unknown Event',
        won_prize_name: entry.won_prize_name,
        played_at: entry.played_at,
      }));

      setLeaderboard(formattedData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    loadLeaderboard(page);
  }, [page, loadLeaderboard]);

  const formatPlayedAt = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
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
        <h2 className="text-3xl font-bold text-gray-800">Latest Played Users</h2>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center text-gray-600 py-8">
          No recent plays yet. Be the first to play!
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const rank = (page - 1) * pageSize + index + 1;
            return (
              <div
                key={entry.id}
                className="flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 bg-white transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 font-bold text-gray-700">
                  #{rank}
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
                  <div className="md:text-right">
                    <p className="text-xs text-gray-500 uppercase">Played at</p>
                    <p className="font-medium text-gray-700">{formatPlayedAt(entry.played_at)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-gray-600">
          Page <span className="font-semibold">{page}</span> of{' '}
          <span className="font-semibold">{totalPages}</span>
          {totalCount > 0 ? (
            <>
              {' '}
              • <span className="font-semibold">{totalCount}</span> total plays
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={loading || page <= 1}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={loading || page >= totalPages}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
