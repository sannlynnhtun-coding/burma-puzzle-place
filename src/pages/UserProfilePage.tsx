import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, User, Trophy, Calendar, ChevronLeft, ChevronRight, Play, Gamepad2 } from 'lucide-react';
import { formatMMK, formatMMKCompact } from '../lib/money';

type UserProfile = {
  id: string;
  username: string;
  created_at: string;
};

type GameHistory = {
  id: string;
  event_id: string;
  won_prize_name: string;
  won_prize_value: number;
  played_at: string;
  game_events: {
    event_name: string;
  };
};

type CreatedGame = {
  id: string;
  event_name: string;
  description: string;
  created_at: string;
  play_count?: number;
};

const PAGE_SIZE = 5;

export default function UserProfilePage() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [createdGames, setCreatedGames] = useState<CreatedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalWinnings, setTotalWinnings] = useState(0);
  const [totalGamesCreated, setTotalGamesCreated] = useState(0);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
      loadUserHistory();
      loadCreatedGames();
    }
  }, [userId, currentPage]);

  const loadUserProfile = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);

      // Calculate total winnings
      const { data: historyData, error: historyError } = await supabase
        .from('game_history')
        .select('won_prize_value')
        .eq('player_id', userId);

      if (!historyError && historyData) {
        const total = historyData.reduce((sum, record) => sum + (record.won_prize_value || 0), 0);
        setTotalWinnings(total);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserHistory = async () => {
    if (!userId) return;

    setHistoryLoading(true);
    try {
      // Get total count
      const { count, error: countError } = await supabase
        .from('game_history')
        .select('*', { count: 'exact', head: true })
        .eq('player_id', userId);

      if (countError) throw countError;
      setTotalCount(count || 0);

      // Get paginated data
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('game_history')
        .select('*, game_events(event_name)')
        .eq('player_id', userId)
        .order('played_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading user history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadCreatedGames = async () => {
    if (!userId) return;

    setGamesLoading(true);
    try {
      // Get games created by this user
      const { data: gamesData, error: gamesError } = await supabase
        .from('game_events')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });

      if (gamesError) throw gamesError;

      setTotalGamesCreated(gamesData?.length || 0);

      // Get play counts for each game
      if (gamesData && gamesData.length > 0) {
        const gameIds = gamesData.map(g => g.id);
        const { data: historyData, error: historyError } = await supabase
          .from('game_history')
          .select('event_id')
          .in('event_id', gameIds);

        if (historyError) throw historyError;

        // Count plays per game
        const playCounts: Record<string, number> = {};
        historyData?.forEach(record => {
          playCounts[record.event_id] = (playCounts[record.event_id] || 0) + 1;
        });

        // Combine games with play counts
        const gamesWithCounts = gamesData.map(game => ({
          ...game,
          play_count: playCounts[game.id] || 0,
        }));

        setCreatedGames(gamesWithCounts);
      } else {
        setCreatedGames([]);
      }
    } catch (error) {
      console.error('Error loading created games:', error);
    } finally {
      setGamesLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPaginationRange = () => {
    const range = [];
    const showPages = 5;
    let start = Math.max(1, currentPage - Math.floor(showPages / 2));
    let end = Math.min(totalPages, start + showPages - 1);

    if (end - start < showPages - 1) {
      start = Math.max(1, end - showPages + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    return range;
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDF1EF] to-[#F7D6D2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#E56353] mx-auto mb-4"></div>
          <div className="text-2xl font-semibold text-gray-700">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDF1EF] to-[#F7D6D2]">
        <nav className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center gap-2 sm:gap-3">
                <img src="/logo.png" alt="Puzzle Place" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Puzzle Place</h1>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
              >
                <ArrowLeft size={20} />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </button>
            </div>
          </div>
        </nav>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-8 text-center">
            <User size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">User Not Found</h2>
            <p className="text-gray-600 mb-6">The user you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-[#E56353] hover:bg-[#D55445] text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF1EF] to-[#F7D6D2]">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-2 sm:gap-3">
              <img src="/logo.png" alt="Puzzle Place" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Puzzle Place</h1>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-6 border-b border-gray-200">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#E56353] to-[#D55445] text-white flex items-center justify-center font-bold text-4xl shadow-lg">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
                {profile.username}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Calendar size={16} />
                  <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User size={16} />
                  <span>ID: {profile.id.slice(0, 8)}...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <Trophy size={24} className="text-blue-600" />
                <p className="text-sm text-blue-600 font-semibold">Games Played</p>
              </div>
              <p className="text-4xl font-bold text-blue-800">{totalCount}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <Trophy size={24} className="text-green-600" />
                <p className="text-sm text-green-600 font-semibold">Total Winnings</p>
              </div>
              <p className="text-4xl font-bold text-green-800" title={formatMMK(totalWinnings)}>
                {formatMMKCompact(totalWinnings)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <Gamepad2 size={24} className="text-purple-600" />
                <p className="text-sm text-purple-600 font-semibold">Games Created</p>
              </div>
              <p className="text-4xl font-bold text-purple-800">{totalGamesCreated}</p>
            </div>
          </div>

          {/* Created Games */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Gamepad2 size={24} className="text-purple-600" />
              Games Created by {profile.username}
            </h3>

            {gamesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E56353] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading created games...</p>
              </div>
            ) : createdGames.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Gamepad2 size={64} className="mx-auto mb-4 text-gray-300" />
                <p className="text-xl font-semibold text-gray-600 mb-2">No games created yet</p>
                <p className="text-gray-500">This user hasn't created any games yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {createdGames.map((game) => (
                  <div
                    key={game.id}
                    className="bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200 rounded-xl p-5 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h4 className="text-lg font-bold text-gray-800 flex-1 line-clamp-2">
                        {game.event_name}
                      </h4>
                      <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                        {game.play_count || 0} plays
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                      {game.description || 'No description provided'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Created {new Date(game.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => navigate(`/play/${game.id}`)}
                        className="flex items-center gap-2 bg-[#E56353] hover:bg-[#D55445] text-white font-semibold py-2 px-4 rounded-lg transition shadow-md hover:shadow-lg"
                      >
                        <Play size={16} />
                        Play
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Game History */}
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Trophy size={24} className="text-[#E56353]" />
              Game History
            </h3>

            {historyLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E56353] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl">
                <Trophy size={64} className="mx-auto mb-4 text-gray-300" />
                <p className="text-xl font-semibold text-gray-600 mb-2">No games played yet</p>
                <p className="text-gray-500">This user hasn't played any games yet.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {history.map((record, index) => (
                    <div
                      key={record.id}
                      className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 sm:p-5 border-2 border-gray-200 hover:border-[#E56353] transition-all hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-[#E56353] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                              #{(currentPage - 1) * PAGE_SIZE + index + 1}
                            </span>
                            <h4 className="font-bold text-gray-800 text-base sm:text-lg truncate">
                              {record.game_events?.event_name || 'Unknown Event'}
                            </h4>
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Prize Won:</span>{' '}
                              <span className="font-semibold text-gray-800">{record.won_prize_name}</span>
                            </p>
                            {record.won_prize_value > 0 && (
                              <div className="flex items-center gap-1.5">
                                <Trophy size={16} className="text-green-600" />
                                <p className="text-base font-bold text-green-600">
                                  {formatMMK(record.won_prize_value)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                          <p className="font-medium">{formatPlayedAt(record.played_at)}</p>
                          <p className="text-xs text-gray-400">{new Date(record.played_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600 font-medium">
                      Showing {(currentPage - 1) * PAGE_SIZE + 1} to{' '}
                      {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} games
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border-2 border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        title="Previous page"
                      >
                        <ChevronLeft size={20} />
                      </button>

                      <div className="flex gap-1">
                        {getPaginationRange().map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 rounded-lg font-semibold transition ${
                              currentPage === page
                                ? 'bg-[#E56353] text-white shadow-md'
                                : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border-2 border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        title="Next page"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

