import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import InquiriesPage from './pages/InquiriesPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/inquiries" element={<InquiriesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/inquiries" replace />} />
    </Routes>
  );
}