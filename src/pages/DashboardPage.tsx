import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, GameEvent } from '../lib/supabase';
import { Plus, Play, LogOut, Trophy, LayoutGrid, Menu, X, History, Flame, Sparkles, User } from 'lucide-react';
import Leaderboard from '../components/Leaderboard';
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

type EventWithCreator = GameEvent & {
  profiles?: {
    username: string;
  };
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuth();
  const [activePage, setActivePage] = useState<'games' | 'leaderboard'>('games');
  const [events, setEvents] = useState<EventWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [playedPlayerCounts, setPlayedPlayerCounts] = useState<Record<string, number>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userHistory, setUserHistory] = useState<GameHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const loadPlayedPlayerCounts = async (eventIds: string[]) => {
    if (eventIds.length === 0) {
      setPlayedPlayerCounts({});
      return;
    }

    try {
      const { data, error } = await supabase
        .from('game_history')
        .select('event_id')
        .in('event_id', eventIds);

      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const id of eventIds) counts[id] = 0;
      for (const row of data ?? []) {
        const eventId = row.event_id as string | undefined;
        if (!eventId) continue;
        counts[eventId] = (counts[eventId] ?? 0) + 1;
      }
      setPlayedPlayerCounts(counts);
    } catch (error) {
      console.error('Error loading played player counts:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('game_events')
        .select('*, profiles!game_events_creator_id_fkey(username)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const loadedEvents = data || [];
      setEvents(loadedEvents);
      await loadPlayedPlayerCounts(loadedEvents.map((e) => e.id));
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserHistory = async () => {
    if (!user || historyLoading) return;
    
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('game_history')
        .select('*, game_events(event_name)')
        .eq('player_id', user.id)
        .order('played_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setUserHistory(data || []);
    } catch (error) {
      console.error('Error loading user history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
    if (!showProfileMenu && userHistory.length === 0) {
      loadUserHistory();
    }
  };

  const getInitials = (username?: string) => {
    if (!username) return 'U';
    return username.charAt(0).toUpperCase();
  };

  // Calculate popular games threshold (top 30% or games with above-average plays)
  const popularThreshold = useMemo(() => {
    const playCounts = Object.values(playedPlayerCounts);
    if (playCounts.length === 0) return 0;
    
    const totalPlays = playCounts.reduce((sum, count) => sum + count, 0);
    const avgPlays = totalPlays / playCounts.length;
    
    // A game is popular if it has more plays than average AND at least 5 plays
    return Math.max(avgPlays, 5);
  }, [playedPlayerCounts]);

  const isPopular = (eventId: string) => {
    const playCount = playedPlayerCounts[eventId] ?? 0;
    return playCount >= popularThreshold;
  };

  const isNew = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    return created >= oneMonthAgo;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF1EF] to-[#F7D6D2]">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo and Title */}
            <div className="flex items-center gap-2 sm:gap-3">
              <img src="/logo.png" alt="Puzzle Place" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Puzzle Place</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActivePage('games')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition border ${
                  activePage === 'games'
                    ? 'bg-[#E56353] text-white border-[#E56353]'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <LayoutGrid size={18} />
                <span className="hidden xl:inline">Available Games</span>
                <span className="xl:hidden">Games</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePage('leaderboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition border ${
                  activePage === 'leaderboard'
                    ? 'bg-[#E56353] text-white border-[#E56353]'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Trophy size={18} />
                <span className="hidden xl:inline">Leaderboard</span>
                <span className="xl:hidden">Leaders</span>
              </button>
            </div>

            {/* User Profile Avatar - Desktop */}
            <div className="hidden sm:block relative" ref={profileMenuRef}>
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-2 hover:bg-gray-100 rounded-full p-1 transition"
                title="Profile"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E56353] text-white flex items-center justify-center font-semibold text-base sm:text-lg hover:bg-[#D55445] transition">
                  {getInitials(profile?.username)}
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                  {/* User Info Header */}
                  <div className="bg-gradient-to-r from-[#E56353] to-[#D55445] p-4 text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white text-[#E56353] flex items-center justify-center font-bold text-xl">
                        {getInitials(profile?.username)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-lg truncate">{profile?.username}</p>
                        <p className="text-sm text-white/90 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {/* Logout Button */}
                    <div className="p-4 border-b border-gray-200">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          signOut();
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition"
                      >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                      </button>
                    </div>

                    {/* Profile History Section */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <History size={18} className="text-gray-600" />
                        <h3 className="font-semibold text-gray-800">Play History</h3>
                      </div>
                      
                      {historyLoading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E56353] mx-auto"></div>
                        </div>
                      ) : userHistory.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No games played yet</p>
                      ) : (
                        <div className="space-y-2">
                          {userHistory.map((record) => (
                            <div
                              key={record.id}
                              className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 transition"
                            >
                              <p className="font-medium text-sm text-gray-800 truncate">
                                {record.game_events?.event_name || 'Unknown Event'}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                Prize: <span className="font-semibold">{record.won_prize_name}</span>
                              </p>
                              {record.won_prize_value > 0 && (
                                <p className="text-xs text-green-600 font-semibold">
                                  {formatMMK(record.won_prize_value)}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(record.played_at).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {userHistory.length > 0 && (
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            navigate('/play-history');
                          }}
                          className="w-full mt-3 text-center text-sm text-[#E56353] hover:text-[#D55445] font-semibold transition"
                        >
                          View All History →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu and Profile */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="relative sm:hidden">
                <button
                  onClick={handleProfileClick}
                  className="flex items-center gap-2 hover:bg-gray-100 rounded-full p-1 transition"
                  title="Profile"
                >
                  <div className="w-9 h-9 rounded-full bg-[#E56353] text-white flex items-center justify-center font-semibold text-base hover:bg-[#D55445] transition">
                    {getInitials(profile?.username)}
                  </div>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                    {/* User Info Header */}
                    <div className="bg-gradient-to-r from-[#E56353] to-[#D55445] p-4 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white text-[#E56353] flex items-center justify-center font-bold text-xl">
                          {getInitials(profile?.username)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-lg truncate">{profile?.username}</p>
                          <p className="text-sm text-white/90 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {/* Logout Button */}
                      <div className="p-4 border-b border-gray-200">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            signOut();
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition"
                        >
                          <LogOut size={18} />
                          <span>Sign Out</span>
                        </button>
                      </div>

                      {/* Profile History Section */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <History size={18} className="text-gray-600" />
                          <h3 className="font-semibold text-gray-800">Play History</h3>
                        </div>
                        
                        {historyLoading ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E56353] mx-auto"></div>
                          </div>
                        ) : userHistory.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No games played yet</p>
                        ) : (
                          <div className="space-y-2">
                            {userHistory.map((record) => (
                              <div
                                key={record.id}
                                className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 transition"
                              >
                                <p className="font-medium text-sm text-gray-800 truncate">
                                  {record.game_events?.event_name || 'Unknown Event'}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  Prize: <span className="font-semibold">{record.won_prize_name}</span>
                                </p>
                                {record.won_prize_value > 0 && (
                                  <p className="text-xs text-green-600 font-semibold">
                                    {formatMMK(record.won_prize_value)}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(record.played_at).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {userHistory.length > 0 && (
                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              navigate('/play-history');
                            }}
                            className="w-full mt-3 text-center text-sm text-[#E56353] hover:text-[#D55445] font-semibold transition"
                          >
                            View All History →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white py-4 px-4">
            <div className="flex flex-col gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setActivePage('games');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                  activePage === 'games' ? 'bg-[#E56353] text-white' : 'bg-gray-50 text-gray-700'
                }`}
              >
                <LayoutGrid size={18} />
                Available Games
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePage('leaderboard');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                  activePage === 'leaderboard' ? 'bg-[#E56353] text-white' : 'bg-gray-50 text-gray-700'
                }`}
              >
                <Trophy size={18} />
                Leaderboard
              </button>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#E56353] text-white flex items-center justify-center font-semibold text-lg">
                  {getInitials(profile?.username)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{profile?.username}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition text-sm"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activePage === 'leaderboard' ? (
          <Leaderboard />
        ) : (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Available Games</h2>
              <button
                onClick={() => navigate('/create-event')}
                className="flex items-center justify-center gap-2 bg-[#E56353] hover:bg-[#D55445] text-white font-semibold py-3 px-4 sm:px-6 rounded-lg transition shadow-md hover:shadow-lg"
              >
                <Plus size={20} />
                <span>Create Event</span>
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse bg-gray-100 rounded-xl p-4 sm:p-6 space-y-4">
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                    <div className="h-12 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center text-gray-600 py-12 sm:py-16">
                <div className="bg-gray-50 rounded-xl p-8 max-w-md mx-auto">
                  <LayoutGrid size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">No events available yet</p>
                  <p className="text-sm text-gray-500">Create the first one to get started!</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {events.map((event) => {
                  const eventIsPopular = isPopular(event.id);
                  const eventIsNew = isNew(event.created_at);
                  
                  return (
                    <div
                      key={event.id}
                      className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 relative overflow-hidden"
                    >
                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {eventIsPopular && (
                          <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                            <Flame size={14} />
                            <span>Popular</span>
                          </div>
                        )}
                        {eventIsNew && (
                          <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                            <Sparkles size={14} />
                            <span>New</span>
                          </div>
                        )}
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 line-clamp-1">
                        {event.event_name}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                        {event.description || 'No description provided'}
                      </p>
                      <div className="text-xs sm:text-sm text-gray-500 mb-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span>Created:</span>
                          <span className="font-medium text-gray-700">
                            {new Date(event.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Plays:</span>
                          <span className="font-semibold text-[#E56353]">
                            {playedPlayerCounts[event.id] ?? 0} times
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <User size={14} />
                            Creator:
                          </span>
                          {event.creator_id ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/user/${event.creator_id}`);
                              }}
                              className="font-medium text-[#E56353] hover:text-[#D55445] hover:underline truncate ml-2 transition"
                              title={`View ${event.profiles?.username || 'creator'}'s profile`}
                            >
                              {event.profiles?.username || 'Unknown'}
                            </button>
                          ) : (
                            <span className="font-medium text-gray-700 truncate ml-2">
                              Unknown
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/play/${event.id}`)}
                        className="w-full flex items-center justify-center gap-2 bg-[#E56353] hover:bg-[#D55445] text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition shadow-md hover:shadow-lg"
                      >
                        <Play size={18} />
                        <span>Play Game</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

