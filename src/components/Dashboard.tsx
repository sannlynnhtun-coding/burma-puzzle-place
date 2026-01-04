import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, GameEvent } from '../lib/supabase';
import { Plus, Play, LogOut, Trophy, LayoutGrid, History, Flame, Sparkles } from 'lucide-react';
import Leaderboard from './Leaderboard';
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

type DashboardProps = {
  onCreateEvent: () => void;
  onPlayGame: (event: GameEvent) => void;
};

export default function Dashboard({ onCreateEvent, onPlayGame }: DashboardProps) {
  const { profile, signOut, user } = useAuth();
  const [activePage, setActivePage] = useState<'games' | 'leaderboard'>('games');
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [playedPlayerCounts, setPlayedPlayerCounts] = useState<Record<string, number>>({});
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userHistory, setUserHistory] = useState<GameHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    const confirmed = window.confirm('Are you sure you want to sign out?');
    if (confirmed) {
      await signOut();
    }
  };

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
        .select('*')
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
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Puzzle Place" className="w-10 h-10 object-contain" />
            <h1 className="text-2xl font-bold text-gray-800">Puzzle Place</h1>
          </div>

          <div className="hidden sm:flex items-center gap-2">
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
              Available Games
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
              Latest Played Users
            </button>
          </div>

          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={handleProfileClick}
              className="flex items-center gap-2 hover:bg-gray-100 rounded-full p-1 transition"
              title="Profile"
            >
              <div className="w-10 h-10 rounded-full bg-[#E56353] text-white flex items-center justify-center font-semibold text-lg hover:bg-[#D55445] transition">
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
                    <div>
                      <p className="font-semibold text-lg">{profile?.username}</p>
                      <p className="text-sm text-white/90">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {/* Logout Button */}
                  <div className="p-4 border-b border-gray-200">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleSignOut();
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
                            className="bg-gray-50 rounded-lg p-3 border border-gray-200"
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
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Mobile menu */}
        <div className="sm:hidden bg-white rounded-xl shadow-lg p-2 flex gap-2">
          <button
            type="button"
            onClick={() => setActivePage('games')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition ${
              activePage === 'games' ? 'bg-[#E56353] text-white' : 'bg-gray-50 text-gray-700'
            }`}
          >
            <LayoutGrid size={18} />
            Games
          </button>
          <button
            type="button"
            onClick={() => setActivePage('leaderboard')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition ${
              activePage === 'leaderboard'
                ? 'bg-[#E56353] text-white'
                : 'bg-gray-50 text-gray-700'
            }`}
          >
            <Trophy size={18} />
            Leaderboard
          </button>
        </div>

        {activePage === 'leaderboard' ? (
          <Leaderboard />
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-800">Available Games</h2>
              <button
                onClick={onCreateEvent}
                className="flex items-center gap-2 bg-[#E56353] hover:bg-[#D55445] text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                <Plus size={20} />
                Create Event
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse bg-gray-100 rounded-xl p-6 space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                    <div className="h-12 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center text-gray-600 py-12">
                <div className="bg-gray-50 rounded-xl p-8 max-w-md mx-auto">
                  <LayoutGrid size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-semibold mb-2">No events available yet</p>
                  <p className="text-sm text-gray-500">Create the first event to get started!</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => {
                  const eventIsPopular = isPopular(event.id);
                  const eventIsNew = isNew(event.created_at);
                  
                  return (
                    <div
                      key={event.id}
                      className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 relative overflow-hidden"
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

                      <h3 className="text-xl font-bold text-gray-800 mb-2">{event.event_name}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {event.description || 'No description provided'}
                      </p>
                      <div className="text-sm text-gray-500 mb-4 space-y-1">
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
                      </div>
                      <button
                        onClick={() => onPlayGame(event)}
                        className="w-full flex items-center justify-center gap-2 bg-[#E56353] hover:bg-[#D55445] text-white font-semibold py-3 px-6 rounded-lg transition shadow-md hover:shadow-lg"
                      >
                        <Play size={20} />
                        Play Game
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
