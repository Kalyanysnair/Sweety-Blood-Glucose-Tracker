// client/src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import ReadingModal from './components/ReadingModal';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ReadingsPage from './pages/ReadingsPage';
import DailyReportPage from './pages/DailyReportPage';
import MonthToDateReportPage from './pages/MonthToDateReportPage';
import MonthlyReportPage from './pages/MonthlyReportPage';

function AppLayout() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="app-layout">
      <Navbar onOpenAddModal={() => setIsModalOpen(true)} />
      <main className="main-content" key={refreshKey}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/readings" element={<ReadingsPage />} />
          <Route path="/reports/daily" element={<DailyReportPage />} />
          <Route path="/reports/month-to-date" element={<MonthToDateReportPage />} />
          <Route path="/reports/monthly" element={<MonthlyReportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <ReadingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        readingToEdit={null}
        onSaved={handleSaved}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={<AppLayout />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
