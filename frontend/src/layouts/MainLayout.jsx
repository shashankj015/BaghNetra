import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function MainLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#070a12' }}>
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Ethical AI Banner - Requirement 29 */}
        <div className="demo-banner">
          DEMO DATA — NOT REAL PENCH TIGER RESERVE DATA • AUTOMATED FIELD CAMERA TRAP INTELLIGENCE SYSTEM
        </div>

        {/* Top Navbar */}
        <Navbar />

        {/* Page Content Viewport */}
        <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
