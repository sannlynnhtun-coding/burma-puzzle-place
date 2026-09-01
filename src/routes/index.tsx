import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useGuestSession } from '../contexts/GuestSessionContext';
import GamePlayPage from '../pages/GamePlayPage';
import StartPage from '../pages/StartPage';

function StartedRoute({ children }: { children: React.ReactNode }) {
  const { eventId } = useParams<{ eventId: string }>();
  const { started, selectedEventId } = useGuestSession();
  return started && eventId === selectedEventId ? children : <Navigate to="/" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<StartPage />} />
      <Route path="/play/:eventId" element={<StartedRoute><GamePlayPage /></StartedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
