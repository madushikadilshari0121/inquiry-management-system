import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/inquiries" className="brand">Inquiry Desk</Link>
        <div className="topbar-right">
          <span className="muted">
            {user.name} · {user.role}
          </span>
          <button className="btn btn-secondary" onClick={logout}>Sign out</button>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}