import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Camera,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import api from '../services/api';
import LeafletTigerMap from '../components/LeafletTigerMap';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalImages: 0,
    blankCount: 0,
    tigerDetections: 0,
    knownTigers: 0,
    unknownCandidates: 0,
    reviewPending: 0,
    activeAlerts: 0,
    cameraStations: 0,
    spaceSavedMB: 0,
    personHoursSaved: 0
  });
  const [analytics, setAnalytics] = useState({
    breakdown: { blanks: 0, tigers: 0, otherAnimals: 0, humans: 0 },
    dailyActivity: { labels: [], rawVolume: [], retainedVolume: [] }
  });
  const [tigers, setTigers] = useState([]);
  const [stations, setStations] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [tigerRes, camRes, imgRes, alertRes, qRes, analyticsRes] = await Promise.all([
          api.get('/tigers'),
          api.get('/cameras'),
          api.get('/images?limit=100'),
          api.get('/alerts?limit=5'),
          api.get('/images/quarantine'),
          api.get('/images/analytics')
        ]);

        const allImgs = imgRes.data.images || [];
        const blanks = allImgs.filter(i => i.blank).length;
        const tigersFound = allImgs.filter(i => i.tigerDetected).length;
        const pending = allImgs.filter(i => i.reviewStatus === 'PENDING').length;
        const unknowns = allImgs.filter(i => i.reviewStatus === 'PENDING' && !i.tigerId).length;

        setStats({
          totalImages: analyticsRes.data.totalImages ?? imgRes.data.total ?? 0,
          blankCount: analyticsRes.data.breakdown?.blanks ?? blanks,
          tigerDetections: analyticsRes.data.breakdown?.tigers ?? tigersFound,
          knownTigers: tigerRes.data.count || 0,
          unknownCandidates: unknowns,
          reviewPending: pending,
          activeAlerts: alertRes.data.count || 0,
          cameraStations: camRes.data.count || 0,
          spaceSavedMB: qRes.data.stats?.spaceSavedMB || 0,
          personHoursSaved: qRes.data.stats?.personHoursSaved || 0
        });

        if (analyticsRes.data) {
          setAnalytics(analyticsRes.data);
        }

        setTigers(tigerRes.data.tigers || []);
        setStations(camRes.data.stations || []);
        setRecentAlerts(alertRes.data.alerts || []);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalBreakdown = (analytics.breakdown.blanks + analytics.breakdown.tigers + analytics.breakdown.otherAnimals + analytics.breakdown.humans);

  const triageChartData = {
    labels: ['Blank False Triggers', 'Tiger Detections', 'Other Wildlife', 'Human Patrol'],
    datasets: [{
      data: [
        analytics.breakdown.blanks,
        analytics.breakdown.tigers,
        analytics.breakdown.otherAnimals,
        analytics.breakdown.humans
      ],
      backgroundColor: ['#6b7280', '#f59e0b', '#10b981', '#3b82f6'],
      borderColor: '#0b101c',
      borderWidth: 2
    }]
  };

  const volumeChartData = {
    labels: analytics.dailyActivity.labels.length > 0 ? analytics.dailyActivity.labels : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    datasets: [
      {
        label: 'Raw Images Ingested',
        data: analytics.dailyActivity.rawVolume.length > 0 ? analytics.dailyActivity.rawVolume : [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3
      },
      {
        label: 'Useful Wildlife Frames Retained',
        data: analytics.dailyActivity.retainedVolume.length > 0 ? analytics.dailyActivity.retainedVolume : [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.3
      }
    ]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Welcome Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#f3f4f6', margin: 0 }}>
            Camera Trap Triage & Tiger Intelligence Dashboard
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Automated blank removal, stripe pattern identification & movement deviation alerts for Pench Tiger Reserve.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/ingest" className="btn-primary">
            <Layers size={16} /> Ingest Field SD Card
          </Link>
          <Link to="/review" className="btn-secondary">
            <CheckCircle2 size={16} /> Human Review ({stats.reviewPending})
          </Link>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: '0.8rem' }}>
            <span>Total Ingested Images</span>
            <Layers size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f3f4f6', marginTop: '0.5rem' }}>
            {stats.totalImages}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <TrendingUp size={14} /> 100% automated local triage
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: '0.8rem' }}>
            <span>Blanks Quarantined</span>
            <HardDrive size={18} color="#9ca3af" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#9ca3af', marginTop: '0.5rem' }}>
            {stats.blankCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
            ~{stats.spaceSavedMB} MB saved • ~{stats.personHoursSaved}h labor saved
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: '0.8rem' }}>
            <span>Tiger Detections</span>
            <Sparkles size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f59e0b', marginTop: '0.5rem' }}>
            {stats.tigerDetections}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '0.25rem' }}>
            Across {stats.knownTigers} catalogued individuals
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: '0.8rem' }}>
            <span>Review Pending</span>
            <CheckCircle2 size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f59e0b', marginTop: '0.5rem' }}>
            {stats.reviewPending}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
            Ambiguous stripe matches & new candidates
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: '0.8rem' }}>
            <span>Active Deviation Alerts</span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ef4444', marginTop: '0.5rem' }}>
            {stats.activeAlerts}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>
            Territorial shifts & buffer incursions
          </div>
        </div>
      </div>

      {/* Map + Charts Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Interactive GIS Map */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#f3f4f6', margin: 0 }}>Pench Tiger Reserve Live GIS Occupancy</h3>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
                Home ranges (MCP polygons), centroids, and active camera network across Core & Buffer.
              </p>
            </div>
            <Link to="/map" style={{ color: '#10b981', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Full GIS View <ArrowRight size={14} />
            </Link>
          </div>
          <LeafletTigerMap stations={stations} tigers={tigers} height="360px" />
        </div>

        {/* Breakdown Donut Chart */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#f3f4f6', margin: 0 }}>Camera Trap Triage Breakdown</h3>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '1rem' }}>
            Proportion of false-trigger blanks vs verified wildlife.
          </p>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {totalBreakdown > 0 ? (
              <Doughnut data={triageChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af', boxWidth: 12 } } } }} />
            ) : (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                <p style={{ fontSize: '0.85rem', margin: 0 }}>No camera trap image triage data yet.</p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>Ingest an SD card to generate automated triage proportions.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Volume Chart & Recent Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#f3f4f6', margin: 0 }}>Weekly Ingestion & Retention Volume</h3>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '1rem' }}>
            Demonstrates 70%+ volume reduction from safe blank image filtering.
          </p>
          <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {analytics.dailyActivity.rawVolume.some(v => v > 0) ? (
              <Line data={volumeChartData} options={{ maintainAspectRatio: false, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } } }, plugins: { legend: { labels: { color: '#9ca3af' } } } }} />
            ) : (
              <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                <p style={{ fontSize: '0.85rem', margin: 0 }}>No weekly ingestion volume recorded.</p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>Camera trap runs ingested within the past 7 days will appear here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Alerts Feed */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#f3f4f6', margin: 0 }}>Recent Movement Alerts</h3>
            <Link to="/alerts" style={{ color: '#10b981', fontSize: '0.8rem', textDecoration: 'none' }}>
              View All
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {recentAlerts.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>
                No active movement deviation alerts. All resident individuals within normal parameters.
              </p>
            ) : (
              recentAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.alertId}
                  style={{
                    padding: '0.75rem',
                    background: alert.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    borderLeft: `3px solid ${alert.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'}`,
                    borderRadius: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#f3f4f6' }}>{alert.title}</strong>
                    <span style={{ fontSize: '0.7rem', color: alert.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b', fontWeight: '700' }}>
                      {alert.severity}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#d1d5db', margin: '0.25rem 0' }}>
                    {alert.description}
                  </p>
                  <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>
                    {new Date(alert.timestamp).toLocaleString()} • Confidence: {Math.round(alert.confidence * 100)}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
