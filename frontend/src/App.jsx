import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import IngestPage from './pages/IngestPage';
import ProcessingRunsPage from './pages/ProcessingRunsPage';
import TigersPage from './pages/TigersPage';
import TigerDetailPage from './pages/TigerDetailPage';
import CamerasPage from './pages/CamerasPage';
import MapPage from './pages/MapPage';
import ReviewPage from './pages/ReviewPage';
import AlertsPage from './pages/AlertsPage';
import ModelsPage from './pages/ModelsPage';
<<<<<<< HEAD
=======
import MovementIntelligencePage from './pages/MovementIntelligencePage';
import ReportsPage from './pages/ReportsPage';
>>>>>>> origin/Trivedi-branch
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Application Routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="ingest" element={<IngestPage />} />
          <Route path="processing" element={<ProcessingRunsPage />} />
          <Route path="runs" element={<ProcessingRunsPage />} />
          <Route path="tigers" element={<TigersPage />} />
          <Route path="tigers/:id" element={<TigerDetailPage />} />
<<<<<<< HEAD
=======
          <Route path="movement" element={<MovementIntelligencePage />} />
>>>>>>> origin/Trivedi-branch
          <Route path="cameras" element={<CamerasPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="alerts" element={<AlertsPage />} />
<<<<<<< HEAD
=======
          <Route path="reports" element={<ReportsPage />} />
>>>>>>> origin/Trivedi-branch
          <Route path="models" element={<ModelsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
