import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// UX only: real security is enforced by the backend on every request
export default function ProtectedRoute() {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) return <p className="center muted">Loading…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}