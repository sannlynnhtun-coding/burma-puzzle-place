import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, GameEvent } from '../lib/supabase';
import { Plus, Play, LogOut, Sparkles } from 'lucide-react';
import Leaderboard from './Leaderboard';

type DashboardProps = {
  onCreateEvent: () => void;
  onPlayGame: (event: GameEvent) => void;
};

export default function Dashboard({ onCreateEvent, onPlayGame }: DashboardProps) {
  const { profile, signOut } = useAuth();
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('game_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="text-blue-600" size={32} />
            <h1 className="text-2xl font-bold text-gray-800">Puzzle Place</h1>
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
        <Leaderboard />

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Available Games</h2>
            <button
              onClick={onCreateEvent}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
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
                  </div>
                  <button
                    onClick={() => onPlayGame(event)}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                  >
                    <Play size={20} />
                    Play Game
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
