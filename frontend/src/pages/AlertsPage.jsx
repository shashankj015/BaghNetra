import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  Filter, 
  Info, 
  MapPin, 
  Clock, 
  Search, 
  ShieldCheck, 
  RefreshCw, 
  Layers, 
  Home, 
  Calendar, 
  Crosshair, 
  CheckCircle2, 
  ArrowUpDown,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  UserCheck
} from 'lucide-react';
import api from '../services/api';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    totalAlerts: 0,
    activeAlerts: 0,
    reviewedAlerts: 0,
    resolvedAlerts: 0,
    critical: 0,
    warning: 0,
    info: 0,
    humanWildlifeConflictCount: 0,
    territoryOverlapCount: 0,
    noCameraDetectionCount: 0
  });

  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'REVIEWED' | 'RESOLVED'
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  // Fetch alerts & statistics from backend
  const fetchAlerts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let queryParams = [];
      if (statusFilter && statusFilter !== 'ALL') queryParams.push(`status=${statusFilter}`);
      if (severityFilter) queryParams.push(`severity=${severityFilter}`);
      if (typeFilter) queryParams.push(`type=${typeFilter}`);
      if (searchQuery) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
      if (sortBy) queryParams.push(`sortBy=${sortBy}`);

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const res = await api.get(`/alerts${queryString}`);

      if (res.data && Array.isArray(res.data.alerts)) {
        setAlerts(res.data.alerts);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.warn('Backend alerts fetch error, checking stats fallback:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter, typeFilter, sortBy]);

  // Handle Search Input with slight debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAlerts(true);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Trigger manual evaluation of alerts across telemetry
  const handleReevaluate = async () => {
    setEvaluating(true);
    try {
      await api.post('/alerts/evaluate');
      await fetchAlerts(false);
    } catch (err) {
      console.error('Error re-evaluating alerts:', err);
    } finally {
      setEvaluating(false);
    }
  };

  // Mark alert as REVIEWED
  const handleMarkReviewed = async (alertId) => {
    setActionLoading(prev => ({ ...prev, [alertId]: 'review' }));
    try {
      // Optimistic UI update
      setAlerts(prev => prev.map(a => 
        a.alertId === alertId 
          ? { 
              ...a, 
              status: 'REVIEWED', 
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Authorized Officer',
              acknowledged: true,
              acknowledgedBy: 'Authorized Officer'
            } 
          : a
      ));

      setStats(prev => ({
        ...prev,
        activeAlerts: Math.max(0, prev.activeAlerts - 1),
        reviewedAlerts: prev.reviewedAlerts + 1
      }));

      // Backend persistent API call
      await api.put(`/alerts/${alertId}/review`);
      // Refresh to ensure exact synchronization
      fetchAlerts(true);
    } catch (err) {
      console.error(`Error reviewing alert ${alertId}:`, err);
      fetchAlerts(true);
    } finally {
      setActionLoading(prev => ({ ...prev, [alertId]: null }));
    }
  };

  // Mark alert as RESOLVED
  const handleMarkResolved = async (alertId) => {
    setActionLoading(prev => ({ ...prev, [alertId]: 'resolve' }));
    try {
      const target = alerts.find(a => a.alertId === alertId);
      const wasActive = target?.status === 'ACTIVE';
      const wasReviewed = target?.status === 'REVIEWED';

      // Optimistic UI update
      setAlerts(prev => prev.map(a => 
        a.alertId === alertId 
          ? { 
              ...a, 
              status: 'RESOLVED', 
              resolvedAt: new Date().toISOString(),
              resolvedBy: 'Authorized Officer',
              acknowledged: true
            } 
          : a
      ));

      setStats(prev => ({
        ...prev,
        activeAlerts: wasActive ? Math.max(0, prev.activeAlerts - 1) : prev.activeAlerts,
        reviewedAlerts: wasReviewed ? Math.max(0, prev.reviewedAlerts - 1) : prev.reviewedAlerts,
        resolvedAlerts: prev.resolvedAlerts + 1
      }));

      // Backend persistent API call
      await api.put(`/alerts/${alertId}/resolve`);
      // Refresh to ensure exact synchronization
      fetchAlerts(true);
    } catch (err) {
      console.error(`Error resolving alert ${alertId}:`, err);
      fetchAlerts(true);
    } finally {
      setActionLoading(prev => ({ ...prev, [alertId]: null }));
    }
  };

  const toggleEvidence = (alertId) => {
    setExpandedEvidence(prev => ({ ...prev, [alertId]: !prev[alertId] }));
  };

  return (
    <div className="flex flex-col gap-6 pb-12 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive shadow-lg shadow-destructive/5">
              <ShieldAlert className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-heading font-black text-foreground tracking-tight uppercase flex items-center gap-3">
                Wildlife Kinetic Alerts & Action Desk
              </h1>
              <p className="text-muted-foreground text-xs lg:text-sm mt-1 font-mono">
                Pench Tiger Reserve telemetry triage for Village Proximity (≤2km), Territory Overlaps, and Telemetry Silence (≥45 days).
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: Manual Re-evaluate */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReevaluate}
            disabled={evaluating}
            className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Re-run spatial calculations against latest tiger movement telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
            <span>{evaluating ? 'Evaluating Telemetry...' : 'Sync & Re-evaluate'}</span>
          </button>
        </div>
      </div>

      {/* KPI Dashboard Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        
        {/* 1. Total Alerts */}
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`glass-panel p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all hover:border-primary/40 ${
            statusFilter === 'ALL' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground">Total</span>
            <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-xl font-heading font-black text-foreground mt-2">{stats.totalAlerts}</div>
          <span className="text-[9px] text-muted-foreground font-mono">All Records</span>
        </div>

        {/* 2. Active Pending */}
        <div 
          onClick={() => setStatusFilter('ACTIVE')}
          className={`glass-panel p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all hover:border-amber-500/50 ${
            statusFilter === 'ACTIVE' ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500' : 'border-border'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono font-bold text-amber-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span> Active
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-heading font-black text-amber-500 mt-2">{stats.activeAlerts}</div>
          <span className="text-[9px] text-amber-400/80 font-mono">Requires Action</span>
        </div>

        {/* 3. Under Review */}
        <div 
          onClick={() => setStatusFilter('REVIEWED')}
          className={`glass-panel p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all hover:border-blue-500/50 ${
            statusFilter === 'REVIEWED' ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500' : 'border-border'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono font-bold text-blue-400">Reviewed</span>
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-heading font-black text-blue-400 mt-2">{stats.reviewedAlerts}</div>
          <span className="text-[9px] text-blue-300/80 font-mono">Officer Inspected</span>
        </div>

        {/* 4. Resolved */}
        <div 
          onClick={() => setStatusFilter('RESOLVED')}
          className={`glass-panel p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all hover:border-emerald-500/50 ${
            statusFilter === 'RESOLVED' ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500' : 'border-border'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono font-bold text-emerald-400">Resolved</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-heading font-black text-emerald-400 mt-2">{stats.resolvedAlerts}</div>
          <span className="text-[9px] text-emerald-400/80 font-mono">Mitigated / Closed</span>
        </div>

        {/* 5. Critical Priority */}
        <div 
          onClick={() => setSeverityFilter('CRITICAL')}
          className={`glass-panel p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all hover:border-destructive/50 ${
            severityFilter === 'CRITICAL' ? 'border-destructive bg-destructive/10 ring-1 ring-destructive' : 'border-border'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono font-bold text-destructive">Critical</span>
            <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
          </div>
          <div className="text-xl font-heading font-black text-destructive mt-2">{stats.critical}</div>
          <span className="text-[9px] text-destructive/80 font-mono">Urgent Triage</span>
        </div>

        {/* 6. Human-Wildlife Conflict Risk (<= 2km) */}
        <div 
          onClick={() => setTypeFilter('VILLAGE_ADJACENT_RISK')}
          className={`glass-panel p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all hover:border-rose-500/50 ${
            typeFilter === 'VILLAGE_ADJACENT_RISK' ? 'border-rose-500 bg-rose-500/10 ring-1 ring-rose-500' : 'border-border'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono font-bold text-rose-400">Village ≤2km</span>
            <Home className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-heading font-black text-rose-400 mt-2">{stats.humanWildlifeConflictCount}</div>
          <span className="text-[9px] text-rose-300/80 font-mono">Conflict Risk</span>
        </div>

        {/* 7. Territory Overlap */}
        <div 
          onClick={() => setTypeFilter('TERRITORY_OVERLAP')}
          className={`glass-panel p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all hover:border-purple-500/50 ${
            typeFilter === 'TERRITORY_OVERLAP' ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500' : 'border-border'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono font-bold text-purple-400">Overlap</span>
            <Layers className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-heading font-black text-purple-400 mt-2">{stats.territoryOverlapCount}</div>
          <span className="text-[9px] text-purple-300/80 font-mono">Home Range MCP</span>
        </div>

        {/* 8. No Detection (>= 45 Days) */}
        <div 
          onClick={() => setTypeFilter('PROLONGED_ABSENCE')}
          className={`glass-panel p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all hover:border-amber-400/50 ${
            typeFilter === 'PROLONGED_ABSENCE' ? 'border-amber-400 bg-amber-400/10 ring-1 ring-amber-400' : 'border-border'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono font-bold text-amber-300">Absent ≥45d</span>
            <Clock className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <div className="text-xl font-heading font-black text-amber-300 mt-2">{stats.noCameraDetectionCount}</div>
          <span className="text-[9px] text-amber-300/80 font-mono">Telemetry Silence</span>
        </div>

      </div>

      {/* Filter Toolbar & Status Tabs */}
      <div className="flex flex-col gap-4 bg-muted/40 p-4 rounded-2xl border border-border">
        
        {/* Top row: Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-background/80 border border-border rounded-xl">
            {[
              { key: 'ALL', label: 'All Alerts', count: stats.totalAlerts },
              { key: 'ACTIVE', label: 'Active Pending', count: stats.activeAlerts, dot: true },
              { key: 'REVIEWED', label: 'Reviewed', count: stats.reviewedAlerts },
              { key: 'RESOLVED', label: 'Resolved History', count: stats.resolvedAlerts }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                  statusFilter === tab.key 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {tab.dot && (
                  <span className={`w-2 h-2 rounded-full ${stats.activeAlerts > 0 ? 'bg-rose-400 animate-ping' : 'bg-muted-foreground'}`}></span>
                )}
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.key ? 'bg-black/20 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted-foreground">Showing:</span>
            <span className="text-xs font-mono font-bold text-primary">{alerts.length} alerts</span>
          </div>
        </div>

        {/* Bottom row: Search & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Target ID, Village, Node..."
              className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Alert Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
          >
            <option value="">All Alert Types</option>
            <option value="VILLAGE_ADJACENT_RISK">🔴 Human-Wildlife Conflict (≤2km)</option>
            <option value="TERRITORY_OVERLAP">🟣 Tiger Territory Overlap</option>
            <option value="PROLONGED_ABSENCE">🟡 No Camera Detection (≥45 Days)</option>
            <option value="RANGE_CENTROID_SHIFT">🔵 Range Centroid Shift</option>
            <option value="BUFFER_ENCROACHMENT">🟠 Buffer Dispersal</option>
            <option value="FIRST_STATION_CAPTURE">🟢 New Station Observation</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
          >
            <option value="">All Severity Levels</option>
            <option value="CRITICAL">CRITICAL (High Threat)</option>
            <option value="WARNING">WARNING (Monitoring Required)</option>
            <option value="INFO">INFO (Telemetry Notice)</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
          >
            <option value="NEWEST">Sort: Newest First</option>
            <option value="SEVERITY">Sort: Highest Threat First</option>
            <option value="TIGER_ID">Sort: Target Tiger ID</option>
            <option value="DATE_ASC">Sort: Oldest First</option>
          </select>
        </div>

      </div>

      {/* Alert Feed Section */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="glass-panel p-16 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-mono text-muted-foreground">Scanning spatial intelligence telemetry...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="glass-panel p-12 text-center flex flex-col items-center gap-4 border border-emerald-500/20 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center cinematic-glow">
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-heading font-black text-foreground uppercase tracking-widest">Sector Secure</h3>
            <p className="text-muted-foreground text-sm font-mono max-w-md">
              No matching alerts found for current filter settings ({statusFilter} / {typeFilter || 'ALL TYPES'}). All monitoring nodes stable.
            </p>
            {(statusFilter !== 'ALL' || severityFilter || typeFilter || searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  setSeverityFilter('');
                  setTypeFilter('');
                  setSearchQuery('');
                }}
                className="text-xs font-mono text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          alerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isWarning = alert.severity === 'WARNING';
            const isConflictRisk = alert.type === 'VILLAGE_ADJACENT_RISK';
            const isOverlap = alert.type === 'TERRITORY_OVERLAP';
            const isAbsent = alert.type === 'PROLONGED_ABSENCE';

            const status = alert.status || (alert.acknowledged ? 'REVIEWED' : 'ACTIVE');
            const isActive = status === 'ACTIVE';
            const isReviewed = status === 'REVIEWED';
            const isResolved = status === 'RESOLVED';

            const isActionLoading = !!actionLoading[alert.alertId];

            return (
              <div
                key={alert.alertId}
                className={`glass-panel p-6 rounded-2xl border-l-4 relative overflow-hidden transition-all shadow-lg ${
                  isResolved 
                    ? 'border-l-emerald-500 bg-emerald-500/5 opacity-80 hover:opacity-100' :
                  isReviewed
                    ? 'border-l-blue-500 bg-blue-500/5' :
                  isCritical 
                    ? 'border-l-destructive bg-destructive/5' :
                  isWarning 
                    ? 'border-l-amber-500 bg-amber-500/5' :
                    'border-l-primary bg-primary/5'
                }`}
              >
                
                {/* Background Subtle Grid Texture */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJub25lIi8+CjxwYXRoIGQ9Ik0wIDBMMCA0IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMSkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-20 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col lg:flex-row gap-6 justify-between items-start">
                  
                  {/* Left Main Content Column */}
                  <div className="flex-1 w-full">
                    
                    {/* Status & Badge Row */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      
                      {/* Lifecycle Status Badge */}
                      {isActive && (
                        <span className="text-[10px] font-bold font-mono tracking-widest px-2.5 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/30 flex items-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> ACTIVE (PENDING ACTION)
                        </span>
                      )}

                      {isReviewed && (
                        <span className="text-[10px] font-bold font-mono tracking-widest px-2.5 py-0.5 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/30 flex items-center gap-1.5">
                          <UserCheck className="w-3 h-3 text-blue-400" /> REVIEWED {alert.reviewedBy ? `BY ${alert.reviewedBy}` : ''}
                        </span>
                      )}

                      {isResolved && (
                        <span className="text-[10px] font-bold font-mono tracking-widest px-2.5 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1.5">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" /> RESOLVED & CLOSED
                        </span>
                      )}

                      {/* Threat Severity Badge */}
                      <span className={`text-[10px] font-bold font-mono tracking-widest px-2 py-0.5 rounded border uppercase ${
                        isCritical ? 'bg-destructive/15 text-destructive border-destructive/40' : 
                        isWarning ? 'bg-amber-500/15 text-amber-400 border-amber-500/40' : 
                        'bg-primary/10 text-primary border-primary/30'
                      }`}>
                        {alert.severity}
                      </span>

                      {/* Alert Category Label */}
                      <span className={`text-[10px] font-bold font-mono tracking-widest px-2.5 py-0.5 rounded border flex items-center gap-1 ${
                        isConflictRisk ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                        isOverlap ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                        isAbsent ? 'bg-amber-400/10 text-amber-300 border-amber-400/30' :
                        'bg-muted/40 text-foreground border-border'
                      }`}>
                        {isConflictRisk && <Home className="w-3 h-3 text-rose-400" />}
                        {isOverlap && <Layers className="w-3 h-3 text-purple-400" />}
                        {isAbsent && <Clock className="w-3 h-3 text-amber-300" />}
                        {alert.categoryLabel || alert.type?.replace(/_/g, ' ')}
                      </span>

                      {/* Tiger ID Badge */}
                      {alert.tigerId && (
                        <span className="text-[10px] font-bold font-mono tracking-widest px-2 py-0.5 rounded border border-border bg-muted/40 text-foreground">
                          TARGET: {alert.tigerId}
                        </span>
                      )}

                      {/* Unique Alert ID */}
                      <span className="text-[9px] font-mono text-muted-foreground ml-auto">
                        ID: {alert.alertId}
                      </span>
                    </div>

                    {/* Alert Title */}
                    <h3 className={`text-lg lg:text-xl font-heading font-black tracking-tight mb-2 ${
                      isResolved ? 'text-foreground/90 line-through decoration-emerald-500/50' :
                      isCritical ? 'text-destructive' : 
                      isWarning ? 'text-amber-400' : 
                      'text-primary'
                    }`}>
                      {alert.title}
                    </h3>

                    {/* Operational Description */}
                    <p className="text-xs lg:text-sm text-foreground/80 leading-relaxed font-mono mb-4 border-b border-border/60 pb-3">
                      {alert.description}
                    </p>

                    {/* Rich Spatial Indicators */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
                      
                      {/* Condition 1: Distance to Village */}
                      {alert.distanceKm != null && (
                        <div className="flex items-center gap-1.5 text-rose-400">
                          <Home className="w-3.5 h-3.5 shrink-0" />
                          <span>DIST: <strong>{alert.distanceKm} km</strong></span>
                        </div>
                      )}

                      {/* Condition 2: Overlap Area */}
                      {alert.overlapAreaKm2 != null && (
                        <div className="flex items-center gap-1.5 text-purple-400">
                          <Layers className="w-3.5 h-3.5 shrink-0" />
                          <span>OVERLAP: <strong>{alert.overlapAreaKm2} km²</strong></span>
                        </div>
                      )}

                      {/* Condition 3: Days Absent */}
                      {alert.daysAbsent != null && (
                        <div className="flex items-center gap-1.5 text-amber-300">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>ABSENT: <strong>{alert.daysAbsent} Days</strong></span>
                        </div>
                      )}

                      {/* Station / Node */}
                      <div className="flex items-center gap-1.5 text-foreground/80">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
                        <span className="truncate">NODE: <strong>{alert.stationId || alert.locationName || 'SECTOR'}</strong></span>
                      </div>

                      {/* Coordinates */}
                      {alert.latitude != null && alert.longitude != null && (
                        <div className="flex items-center gap-1.5 text-foreground/80">
                          <Crosshair className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                          <span>GPS: <strong>{alert.latitude.toFixed(4)}°, {alert.longitude.toFixed(4)}°</strong></span>
                        </div>
                      )}

                      {/* Detection Time */}
                      <div className="flex items-center gap-1.5 text-foreground/80">
                        <Calendar className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                        <span>TIME: <strong>{new Date(alert.detectionTime || alert.timestamp).toLocaleDateString()}</strong></span>
                      </div>

                    </div>

                    {/* Toggle Evidence Breakdown */}
                    {(alert.newEvidence || alert.previousEvidence) && (
                      <div className="mt-3">
                        <button
                          onClick={() => toggleEvidence(alert.alertId)}
                          className="text-[10px] font-mono text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                        >
                          {expandedEvidence[alert.alertId] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          <span>{expandedEvidence[alert.alertId] ? 'Hide Spatial Telemetry Context' : 'Inspect Spatial Telemetry Context'}</span>
                        </button>

                        {expandedEvidence[alert.alertId] && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/40 animate-in fade-in duration-150">
                            {alert.previousEvidence && (
                              <div className="bg-background/80 border border-border p-2.5 rounded-lg text-[10px] font-mono">
                                <span className="text-[9px] uppercase font-bold text-blue-400 block mb-1">Baseline History</span>
                                <pre className="text-blue-300/90 whitespace-pre-wrap overflow-x-auto">
                                  {JSON.stringify(alert.previousEvidence, null, 2)}
                                </pre>
                              </div>
                            )}

                            {alert.newEvidence && (
                              <div className="bg-background/80 border border-border p-2.5 rounded-lg text-[10px] font-mono">
                                <span className="text-[9px] uppercase font-bold text-rose-400 block mb-1">Active Deviation Evidence</span>
                                <pre className="text-rose-300/90 whitespace-pre-wrap overflow-x-auto">
                                  {JSON.stringify(alert.newEvidence, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Right Action Buttons Column */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-end gap-2 w-full lg:w-48 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/40">
                    
                    {/* Action 1: Mark as Reviewed */}
                    <button
                      onClick={() => handleMarkReviewed(alert.alertId)}
                      disabled={isActionLoading || isReviewed || isResolved}
                      className={`w-full lg:w-auto px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm ${
                        isReviewed
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 cursor-default'
                          : isResolved
                          ? 'bg-muted/20 text-muted-foreground border border-border/30 opacity-50 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 shadow-blue-500/20 active:scale-95'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{isReviewed ? 'Reviewed' : 'Mark as Reviewed'}</span>
                    </button>

                    {/* Action 2: Resolved */}
                    <button
                      onClick={() => handleMarkResolved(alert.alertId)}
                      disabled={isActionLoading || isResolved}
                      className={`w-full lg:w-auto px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm ${
                        isResolved
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 shadow-emerald-500/20 active:scale-95'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isResolved ? 'Resolved' : 'Resolved'}</span>
                    </button>

                    {/* Timestamps audit info */}
                    {isReviewed && alert.reviewedAt && (
                      <span className="text-[9px] font-mono text-blue-300/80 text-right">
                        Rev: {new Date(alert.reviewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}

                    {isResolved && alert.resolvedAt && (
                      <span className="text-[9px] font-mono text-emerald-300/80 text-right">
                        Res: {new Date(alert.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}

                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
