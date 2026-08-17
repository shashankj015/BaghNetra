import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function MainLayout() {
  return (
<<<<<<< HEAD
    <div style={{ display: 'flex', minHeight: '100vh', background: '#070a12' }}>
=======
    <div className="flex min-h-screen bg-background selection:bg-primary/30">
>>>>>>> origin/Trivedi-branch
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
<<<<<<< HEAD
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
=======
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Top Navbar */}
        <Navbar />

        {/* Ethical AI Banner */}
        <div className="bg-accent/10 text-accent text-[10px] font-bold text-center py-1 tracking-widest uppercase border-b border-accent/20 shadow-inner">
          DEMO DATA — NOT REAL PENCH TIGER RESERVE DATA • AUTOMATED FIELD CAMERA TRAP INTELLIGENCE SYSTEM
        </div>

        {/* Page Content Viewport */}
        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar relative z-10">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
>>>>>>> origin/Trivedi-branch
        </main>
      </div>
    </div>
  );
}
