import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, ChevronDown, ChevronUp, TrendingUp, Award } from 'lucide-react';
import { formatMMKCompact } from '../lib/money';

type PlayerStats = {
  player_id: string;
  player_username: string;
  games_played: number;
  total_winnings: number;
};

type GameDetail = {
  id: string;
  event_name: string;
  won_prize_name: string;
  won_prize_value: number;
  played_at: string;
};

export default function Leaderboard() {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [gameDetails, setGameDetails] = useState<Record<string, GameDetail[]>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const pageSize = 25;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [totalCount]);

  const loadLeaderboard = useCallback(async (pageNumber: number) => {
    setLoading(true);
    try {
      const from = (pageNumber - 1) * pageSize;
      const to = from + pageSize - 1;

      // Get all game history to count by player and calculate total winnings
      const { data: allGames, error: allError } = await supabase
        .from('game_history')
        .select('player_id, won_prize_value, profiles!game_history_player_id_fkey (username)');

      if (allError) throw allError;

      // Count games and sum winnings per player
      const playerCounts = new Map<string, { username: string; count: number; totalWinnings: number }>();
      allGames?.forEach((game: any) => {
        const playerId = game.player_id;
        const username = game.profiles?.username || 'Unknown';
        const prizeValue = game.won_prize_value || 0;
        const current = playerCounts.get(playerId);
        if (current) {
          current.count++;
          current.totalWinnings += prizeValue;
        } else {
          playerCounts.set(playerId, { username, count: 1, totalWinnings: prizeValue });
        }
      });

      // Convert to array and sort by count descending
      const sortedPlayers = Array.from(playerCounts.entries())
        .map(([playerId, data]) => ({
          player_id: playerId,
          player_username: data.username,
          games_played: data.count,
          total_winnings: data.totalWinnings,
        }))
        .sort((a, b) => b.games_played - a.games_played);

      setTotalCount(sortedPlayers.length);

      // Paginate
      const paginatedPlayers = sortedPlayers.slice(from, to + 1);
      setPlayerStats(paginatedPlayers);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    loadLeaderboard(page);
  }, [page, loadLeaderboard]);

  const loadPlayerDetails = useCallback(async (playerId: string) => {
    if (gameDetails[playerId]) {
      // Already loaded, just toggle
      setExpandedPlayerId(expandedPlayerId === playerId ? null : playerId);
      return;
    }

    setLoadingDetails((prev) => ({ ...prev, [playerId]: true }));
    try {
      const { data, error } = await supabase
        .from('game_history')
        .select(
          `
          id,
          won_prize_name,
          won_prize_value,
          played_at,
          game_events!game_history_event_id_fkey (event_name)
        `
        )
        .eq('player_id', playerId)
        .order('played_at', { ascending: false });

      if (error) throw error;

      const formattedDetails: GameDetail[] = data.map((entry: any) => ({
        id: entry.id,
        event_name: entry.game_events?.event_name || 'Unknown Event',
        won_prize_name: entry.won_prize_name,
        won_prize_value: entry.won_prize_value || 0,
        played_at: entry.played_at,
      }));

      setGameDetails((prev) => ({ ...prev, [playerId]: formattedDetails }));
      setExpandedPlayerId(playerId);
    } catch (error) {
      console.error('Error loading player details:', error);
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [playerId]: false }));
    }
  }, [gameDetails, expandedPlayerId]);

  const formatPlayedAt = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return d.toLocaleDateString();
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  if (loading && playerStats.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Trophy className="text-yellow-500" size={24} />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Most Active Players</h2>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-md p-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-200 rounded-full flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Trophy className="text-yellow-500" size={24} />
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Most Active Players</h2>
      </div>

      {playerStats.length === 0 ? (
        <div className="text-center text-gray-600 py-8">
          <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
            <Trophy size={40} className="mx-auto mb-3 text-gray-400" />
            <p className="text-base font-medium mb-1">No players yet</p>
            <p className="text-sm text-gray-500">Be the first to play!</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {playerStats.map((player, index) => {
            const rank = (page - 1) * pageSize + index + 1;
            const isTopThree = rank <= 3;
            const isExpanded = expandedPlayerId === player.player_id;
            const details = gameDetails[player.player_id] || [];
            const isLoadingDetails = loadingDetails[player.player_id];
            const medal = getMedalIcon(rank);

            return (
              <div
                key={player.player_id}
                className={`rounded-lg border transition-all duration-200 hover:shadow-md ${
                  isTopThree
                    ? 'bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 border-yellow-300 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                } ${isExpanded ? 'ring-2 ring-blue-200' : ''}`}
                style={{
                  animation: `fadeIn 0.3s ease-out ${index * 0.05}s backwards`,
                }}
              >
                <button
                  type="button"
                  onClick={() => loadPlayerDetails(player.player_id)}
                  className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 transition-all text-left group"
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full font-bold flex-shrink-0 transition-transform group-hover:scale-105 ${
                      isTopThree
                        ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 text-white shadow-md'
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700'
                    }`}
                  >
                    {medal ? (
                      <span className="text-xl">{medal}</span>
                    ) : (
                      <span className="text-sm sm:text-base">#{rank}</span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-800 text-base sm:text-lg truncate">
                          {player.player_username}
                        </p>
                        {isTopThree && (
                          <Award className="text-yellow-600 flex-shrink-0" size={16} />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp size={14} className="text-blue-500" />
                          <span className="text-xs text-gray-600">
                            <span className="font-semibold text-blue-600">{player.games_played}</span> games
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Trophy size={14} className="text-green-500" />
                          <span className="text-xs text-gray-600">
                            <span className="font-semibold text-green-600" title={`${player.total_winnings.toFixed(2)} MMK`}>
                              {formatMMKCompact(player.total_winnings)}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 transition-transform group-hover:scale-110">
                    {isExpanded ? (
                      <ChevronUp className="text-gray-600" size={20} />
                    ) : (
                      <ChevronDown className="text-gray-600" size={20} />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white">
                    {isLoadingDetails ? (
                      <div className="p-4 space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-3 space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : details.length === 0 ? (
                      <div className="text-center text-gray-600 py-6 text-sm">
                        <div className="bg-white rounded-lg p-4 inline-block">
                          <Trophy size={32} className="mx-auto mb-2 text-gray-300" />
                          <p>No game history found</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 sm:p-3.5 space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2">
                            <Trophy size={16} className="text-amber-500" />
                            Game History
                          </h3>
                          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            {details.length} {details.length === 1 ? 'game' : 'games'}
                          </span>
                        </div>
                        <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                          {details.map((game, idx) => (
                            <div
                              key={game.id}
                              className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                              style={{
                                animation: `slideIn 0.2s ease-out ${idx * 0.05}s backwards`,
                              }}
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                                <div className="min-w-0">
                                  <p className="text-xs text-gray-500 mb-1 font-medium">Event</p>
                                  <p className="font-semibold text-gray-800 text-sm truncate">
                                    {game.event_name}
                                  </p>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs text-gray-500 mb-1 font-medium">Prize Won</p>
                                  <p className="font-semibold text-gray-800 text-sm truncate">
                                    {game.won_prize_name}
                                  </p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Trophy size={12} className="text-green-600" />
                                    <p className="text-sm text-green-600 font-bold">
                                      ${game.won_prize_value.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                                <div className="min-w-0 sm:text-right">
                                  <p className="text-xs text-gray-500 mb-1 font-medium">Played</p>
                                  <p className="font-medium text-gray-700 text-sm">
                                    {formatPlayedAt(game.played_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-600 text-center sm:text-left bg-gray-50 rounded-lg px-3 py-2">
            Page <span className="font-bold text-gray-800">{page}</span> of{' '}
            <span className="font-bold text-gray-800">{totalPages}</span>
            {totalCount > 0 && (
              <>
                {' '}
                <span className="text-gray-400">•</span>{' '}
                <span className="font-bold text-blue-600">{totalCount}</span>{' '}
                {totalCount === 1 ? 'player' : 'players'}
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading || page <= 1}
              className="px-4 py-2 rounded-lg bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all text-sm font-semibold shadow-sm"
            >
              ← Prev
            </button>
            <div className="hidden sm:flex items-center gap-1 px-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    disabled={loading}
                    className={`w-8 h-8 rounded-md text-xs font-semibold transition-all ${
                      page === pageNum
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={loading || page >= totalPages}
              className="px-4 py-2 rounded-lg bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all text-sm font-semibold shadow-sm"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
