import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import CreateEvent from './components/CreateEvent';
import GamePlay from './components/GamePlay';
import { GameEvent } from './lib/supabase';

type View = 'dashboard' | 'create-event' | 'play-game';

function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedEvent, setSelectedEvent] = useState<GameEvent | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDF1EF] to-[#F7D6D2] flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const handleCreateEvent = () => {
    setCurrentView('create-event');
  };

  const handlePlayGame = (event: GameEvent) => {
    setSelectedEvent(event);
    setCurrentView('play-game');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedEvent(null);
  };

  return (
    <>
      {currentView === 'dashboard' && (
        <Dashboard onCreateEvent={handleCreateEvent} onPlayGame={handlePlayGame} />
      )}
      {currentView === 'create-event' && (
        <CreateEvent onBack={handleBackToDashboard} onSuccess={handleBackToDashboard} />
      )}
      {currentView === 'play-game' && selectedEvent && (
        <GamePlay event={selectedEvent} onBack={handleBackToDashboard} />
      )}
    </>
  );
}

export default App;
