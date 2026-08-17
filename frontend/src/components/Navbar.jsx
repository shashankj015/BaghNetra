import React from 'react';
import { useAuth } from '../context/AuthContext';
<<<<<<< HEAD
import { User, LogOut, Shield, Bell } from 'lucide-react';
=======
import { useTheme } from '../context/ThemeContext';
import { User, LogOut, Shield, Bell, Sun, Moon, Plus } from 'lucide-react';
>>>>>>> origin/Trivedi-branch
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
<<<<<<< HEAD

  return (
    <header style={{
      height: '60px',
      background: 'rgba(11, 16, 28, 0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 30
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: '500' }}>
          Monitoring Jurisdiction: <strong style={{ color: '#f3f4f6' }}>Pench National Park & Buffer</strong>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Officer Profile Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '0.35rem 0.75rem',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: '700',
            color: '#000000'
          }}>
            {user?.name ? user.name[0] : 'P'}
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#f3f4f6', lineHeight: 1.2 }}>
              {user?.name || 'Pench Officer'}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#10b981', textTransform: 'uppercase', fontWeight: '600' }}>
              {user?.badgeNumber || 'PTR-DFO'} • {user?.role || 'Biologist'}
=======
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6 sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          Monitoring Jurisdiction: <strong className="text-foreground font-semibold tracking-wide">Pench National Park & Buffer</strong>
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-card/60 border border-border text-foreground hover:border-primary/40 hover:text-primary hover:scale-105 transition-all duration-200 shadow-sm"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-accent" />
          ) : (
            <Moon className="w-4 h-4 text-primary" />
          )}
        </button>

        {/* Officer Profile Badge */}
        <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-card/60 border border-border shadow-sm">
          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary font-mono">
            {user?.name ? user.name[0] : 'P'}
          </div>
          <div>
            <div className="text-xs font-bold text-foreground leading-tight">
              {user?.name || 'Pench Field Officer'}
            </div>
            <div className="text-[10px] text-primary uppercase font-bold tracking-wider font-mono">
              {user?.badgeNumber || 'PTR-DFO-01'} • {user?.role || 'Biologist'}
>>>>>>> origin/Trivedi-branch
            </div>
          </div>
        </div>

        {/* Quick Ingest Button */}
<<<<<<< HEAD
        <Link to="/ingest" className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}>
          + New SD Ingestion
=======
        <Link 
          to="/cameras" 
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02]"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>New SD Ingestion</span>
>>>>>>> origin/Trivedi-branch
        </Link>
      </div>
    </header>
  );
}
<<<<<<< HEAD
=======


>>>>>>> origin/Trivedi-branch
