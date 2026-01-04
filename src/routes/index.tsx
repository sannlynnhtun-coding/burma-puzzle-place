import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthPage from '../pages/AuthPage';
import DashboardPage from '../pages/DashboardPage';
import CreateEventPage from '../pages/CreateEventPage';
import GamePlayPage from '../pages/GamePlayPage';
import PlayHistoryPage from '../pages/PlayHistoryPage';
import UserProfilePage from '../pages/UserProfilePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDF1EF] to-[#F7D6D2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#E56353] mx-auto mb-4"></div>
          <div className="text-2xl font-semibold text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDF1EF] to-[#F7D6D2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#E56353] mx-auto mb-4"></div>
          <div className="text-2xl font-semibold text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-event"
        element={
          <ProtectedRoute>
            <CreateEventPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/play/:eventId"
        element={
          <ProtectedRoute>
            <GamePlayPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/play-history"
        element={
          <ProtectedRoute>
            <PlayHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/:userId"
        element={
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

