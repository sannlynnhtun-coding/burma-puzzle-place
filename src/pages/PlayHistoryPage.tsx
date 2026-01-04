import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMMK } from '../lib/money';

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

const PAGE_SIZE = 10;

export default function PlayHistoryPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadHistory();
  }, [currentPage]);

  const loadHistory = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get total count
      const { count, error: countError } = await supabase
        .from('game_history')
        .select('*', { count: 'exact', head: true })
        .eq('player_id', user.id);

      if (countError) throw countError;
      setTotalCount(count || 0);

      // Get paginated data
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('game_history')
        .select('*, game_events(event_name)')
        .eq('player_id', user.id)
        .order('played_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading play history:', error);
    } finally {
      setLoading(false);
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
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#E56353] text-white flex items-center justify-center font-semibold text-xl">
              {profile?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
                <History size={28} />
                Play History
              </h2>
              <p className="text-sm text-gray-600 mt-1">{profile?.username}'s gaming journey</p>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-600 font-medium">Total Games</p>
              <p className="text-2xl font-bold text-blue-800">{totalCount}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-600 font-medium">Current Page</p>
              <p className="text-2xl font-bold text-green-800">{currentPage} / {totalPages || 1}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-purple-600 font-medium">Showing</p>
              <p className="text-2xl font-bold text-purple-800">{history.length}</p>
            </div>
          </div>

          {/* History List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E56353] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16">
              <History size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-semibold text-gray-600 mb-2">No play history yet</p>
              <p className="text-gray-500">Start playing games to build your history!</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-6 bg-[#E56353] hover:bg-[#D55445] text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                Browse Games
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3 sm:space-y-4">
                {history.map((record, index) => (
                  <div
                    key={record.id}
                    className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 sm:p-5 border-2 border-gray-200 hover:border-[#E56353] transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-[#E56353] text-white text-xs font-bold px-2 py-1 rounded">
                            #{(currentPage - 1) * PAGE_SIZE + index + 1}
                          </span>
                          <h3 className="font-bold text-gray-800 text-base sm:text-lg truncate">
                            {record.game_events?.event_name || 'Unknown Event'}
                          </h3>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Prize:</span>{' '}
                            <span className="font-semibold text-gray-800">{record.won_prize_name}</span>
                          </p>
                          {record.won_prize_value > 0 && (
                            <p className="text-base font-bold text-green-600">
                              {formatMMK(record.won_prize_value)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                        <p>{new Date(record.played_at).toLocaleDateString()}</p>
                        <p>{new Date(record.played_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1} to{' '}
                    {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} games
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <div className="flex gap-1">
                      {getPaginationRange().map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 rounded-lg font-medium transition ${
                            currentPage === page
                              ? 'bg-[#E56353] text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
  );
}

