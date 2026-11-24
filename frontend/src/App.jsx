import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import InquiriesPage from './pages/InquiriesPage';
import NewInquiryPage from './pages/NewInquiryPage';
import InquiryDetailPage from './pages/InquiryDetailPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/inquiries" element={<InquiriesPage />} />
          <Route path="/inquiries/new" element={<NewInquiryPage />} />
          <Route path="/inquiries/:id" element={<InquiryDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/inquiries" replace />} />
    </Routes>
  );
}