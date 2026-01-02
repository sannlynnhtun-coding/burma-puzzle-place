import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, GameEvent } from '../lib/supabase';
import { Plus, Play, LogOut, Trophy, LayoutGrid } from 'lucide-react';
import Leaderboard from './Leaderboard';

type DashboardProps = {
  onCreateEvent: () => void;
  onPlayGame: (event: GameEvent) => void;
};

export default function Dashboard({ onCreateEvent, onPlayGame }: DashboardProps) {
  const { profile, signOut } = useAuth();
  const [activePage, setActivePage] = useState<'games' | 'leaderboard'>('games');
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [playedPlayerCounts, setPlayedPlayerCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadEvents();
  }, []);

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
              Global Leaderboard
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">Hello, {profile?.username}!</span>
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
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
              <div className="text-center text-gray-600 py-8">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="text-center text-gray-600 py-8">
                No events available yet. Create the first one!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all transform hover:-translate-y-1"
                  >
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{event.event_name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {event.description || 'No description provided'}
                    </p>
                    <div className="text-sm text-gray-500 mb-4">
                      Created: {new Date(event.created_at).toLocaleDateString()}
                      <div>
                        Plays:{' '}
                        <span className="font-semibold text-gray-700">
                          {playedPlayerCounts[event.id] ?? 0}
                        </span>{' '}
                        times
                      </div>
                    </div>
                    <button
                      onClick={() => onPlayGame(event)}
                      className="w-full flex items-center justify-center gap-2 bg-[#E56353] hover:bg-[#D55445] text-white font-semibold py-3 px-6 rounded-lg transition"
                    >
                      <Play size={20} />
                      Play Game
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
