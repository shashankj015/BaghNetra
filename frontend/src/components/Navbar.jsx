import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, LogOut, Shield, Bell, Sun, Moon, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
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
            </div>
          </div>
        </div>

        {/* Quick Ingest Button */}
        <Link 
          to="/cameras" 
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02]"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>New SD Ingestion</span>
        </Link>
      </div>
    </header>
  );
}


