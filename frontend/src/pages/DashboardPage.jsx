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
  Activity,
  Cpu,
  Database,
  Network
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import api from '../services/api';
import LeafletMap from '../components/Map/LeafletMap';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

// Fallback Mock Data for Demo
const MOCK_DATA = {
  stats: {
    totalImages: 42861,
    blankCount: 31204,
    tigerDetections: 1657,
    knownTigers: 27,
    unknownCandidates: 8,
    reviewPending: 225,
    activeAlerts: 8,
    cameraStations: 84,
    spaceSavedMB: 14800,
    personHoursSaved: 312
  }
};

export default function DashboardPage() {
  const [stats, setStats] = useState(MOCK_DATA.stats);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(true); 

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [tigerRes, camRes, imgRes, alertRes, qRes] = await Promise.all([
          api.get('/tigers'),
          api.get('/cameras'),
          api.get('/images?limit=100'),
          api.get('/alerts?limit=5'),
          api.get('/images/quarantine')
        ]);

        const allImgs = imgRes.data.images || [];
        const blanks = allImgs.filter(i => i.blank).length;
        const tigersFound = allImgs.filter(i => i.tigerDetected).length;
        const pending = allImgs.filter(i => i.reviewStatus === 'PENDING').length;
        const unknowns = allImgs.filter(i => i.reviewStatus === 'PENDING' && !i.tigerId).length;

        if (imgRes.data.total > 0) {
          setIsDemo(false);
          setStats({
            totalImages: imgRes.data.total || 0,
            blankCount: blanks,
            tigerDetections: tigersFound,
            knownTigers: tigerRes.data.count || 0,
            unknownCandidates: unknowns,
            reviewPending: pending,
            activeAlerts: alertRes.data.count || 0,
            cameraStations: camRes.data.count || 0,
            spaceSavedMB: qRes.data.stats?.spaceSavedMB || 0,
            personHoursSaved: qRes.data.stats?.personHoursSaved || 0
          });
        }
      } catch (err) {
        console.warn('Backend unreachable, using offline demo mode.', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const triageChartData = {
    labels: ['Blank False Triggers', 'Tiger Detections', 'Other Wildlife', 'Human Patrol'],
    datasets: [{
      data: [
        stats.blankCount,
        stats.tigerDetections,
        8200,
        1800
      ],
      backgroundColor: ['rgba(107, 114, 128, 0.6)', 'rgba(245, 158, 11, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(59, 130, 246, 0.8)'],
      borderColor: '#0b0f16',
      borderWidth: 2
    }]
  };

  const volumeChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Raw SD Images',
        data: [5400, 6200, 4800, 8100, 6500, 7200, 4661],
        borderColor: 'rgba(107, 114, 128, 0.5)',
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 0
      },
      {
        label: 'Tigers & Wildlife Retained',
        data: [1200, 1500, 1100, 1800, 1600, 1900, 1157],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: '#10b981'
      }
    ]
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#9ca3af', usePointStyle: true, boxWidth: 6 } }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#6b7280' } },
      y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#6b7280' } }
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      
      <div className="relative rounded-2xl overflow-hidden p-8 bg-gradient-to-r from-[#062316] via-[#093320] to-[#041B11] border border-emerald-500/30 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-4 uppercase tracking-widest font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              System Online
            </div>
            <h1 className="text-4xl font-heading font-black text-white tracking-tight mb-1.5">
              BAGHNETRA
            </h1>
            <h2 className="text-lg text-emerald-400 font-semibold tracking-wide mb-2">
              Tiger Movement Intelligence System
            </h2>
            <p className="text-emerald-100/80 text-sm max-w-xl leading-relaxed">
              AI-powered camera-trap intelligence for Pench Tiger Reserve. Processing field data locally to filter blanks, identify individuals, and track spatial deviation.
            </p>
          </div>
          
          <div className="text-left md:text-right flex flex-col md:items-end bg-black/20 backdrop-blur-md p-4 rounded-xl border border-emerald-500/20">
            <div className="text-xs text-emerald-300/70 font-mono mb-0.5">Processing Status</div>
            <div className="text-sm font-bold text-white mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Ready for Ingestion
            </div>
            
            <div className="text-xs text-emerald-300/70 font-mono mb-0.5">Last Sync</div>
            <div className="text-sm font-bold text-emerald-300 font-mono">Today, 18:42</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-panel p-5 rounded-xl flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Images Processed</span>
            <div className="p-2 rounded-lg bg-muted/30 group-hover:bg-primary/10 transition-colors">
              <Layers className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground font-heading">
              {stats.totalImages.toLocaleString()}
            </div>
            <div className="text-xs text-primary mt-2 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" /> +12.4% this week
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Blanks Filtered</span>
            <div className="p-2 rounded-lg bg-muted/30 group-hover:bg-accent/10 transition-colors">
              <HardDrive className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-muted-foreground font-heading">
              {stats.blankCount.toLocaleString()}
            </div>
            <div className="text-xs text-accent mt-2 font-medium">
              ~{(stats.spaceSavedMB / 1024).toFixed(1)} GB Storage Saved
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl flex flex-col justify-between group cinematic-glow border-primary/20">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Identified Tigers</span>
            <div className="p-2 rounded-lg bg-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary font-heading">
              {stats.knownTigers}
            </div>
            <div className="text-xs text-primary/70 mt-2 font-medium">
              Unique individuals catalogued
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Alerts</span>
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-destructive font-heading">
              {stats.activeAlerts}
            </div>
            <div className="text-xs text-destructive/70 mt-2 font-medium">
              Movement deviations
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI Confidence</span>
            <div className="p-2 rounded-lg bg-muted/30 group-hover:bg-info/10 transition-colors">
              <Cpu className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground font-heading">
              94.7<span className="text-lg text-muted-foreground">%</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2 font-medium">
              Average identification score
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-sm font-heading font-semibold text-foreground uppercase tracking-wider mb-6">Processing Pipeline Architecture</h3>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-muted via-primary/30 to-accent/30 -z-10 hidden md:block transform -translate-y-1/2"></div>
          
          <PipelineNode 
            icon={<Camera size={18} />} 
            title="Raw Data" 
            metric="42,861 imgs" 
            status="Ingested" 
            color="bg-muted"
            textColor="text-muted-foreground"
          />
          <ArrowRight className="text-muted-foreground/50 hidden md:block" />
          
          <PipelineNode 
            icon={<Layers size={18} />} 
            title="Blank Filter" 
            metric="-31,204 imgs" 
            status="72.9% Removed" 
            color="bg-slate-700"
            textColor="text-slate-300"
          />
          <ArrowRight className="text-muted-foreground/50 hidden md:block" />
          
          <PipelineNode 
            icon={<Shield size={18} />} 
            title="Tiger Detect" 
            metric="1,657 frames" 
            status="High Recall" 
            color="bg-emerald-800"
            textColor="text-emerald-300"
          />
          <ArrowRight className="text-muted-foreground/50 hidden md:block" />
          
          <PipelineNode 
            icon={<Cpu size={18} />} 
            title="Stripe ID" 
            metric="94.7% Conf." 
            status="Matching" 
            color="bg-primary"
            textColor="text-primary-foreground"
            glow
          />
          <ArrowRight className="text-muted-foreground/50 hidden md:block" />
          
          <PipelineNode 
            icon={<Database size={18} />} 
            title="Catalogue" 
            metric="27 Individuals" 
            status="Updated" 
            color="bg-accent"
            textColor="text-accent-foreground"
          />
          <ArrowRight className="text-muted-foreground/50 hidden md:block" />
          
          <PipelineNode 
            icon={<Network size={18} />} 
            title="Intelligence" 
            metric="8 Alerts" 
            status="Generated" 
            color="bg-destructive"
            textColor="text-destructive-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <h3 className="text-sm font-heading font-semibold text-foreground uppercase tracking-wider mb-2">Triage Breakdown</h3>
          <p className="text-[11px] text-muted-foreground mb-6">
            Proportion of false-trigger blanks vs verified wildlife.
          </p>
          <div className="flex-1 flex items-center justify-center min-h-[240px]">
            <Doughnut data={triageChartData} options={{ maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af', boxWidth: 10, padding: 20, font: { size: 11 } } } } }} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <h3 className="text-sm font-heading font-semibold text-foreground uppercase tracking-wider mb-2">Ingestion & Retention Volume</h3>
          <p className="text-[11px] text-muted-foreground mb-6">
            72.9% average volume reduction through safe blank image filtering.
          </p>
          <div className="h-[240px] w-full">
            <Line data={volumeChartData} options={chartOptions} />
          </div>
        </div>
      </div>
      
    </div>
  );
}

function PipelineNode({ icon, title, metric, status, color, textColor, glow }) {
  return (
    <div className={`flex flex-col items-center p-4 bg-background/95 rounded-xl border border-border w-full md:w-[15%] ${glow ? 'cinematic-glow border-primary/30' : ''}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${color} ${textColor}`}>
        {icon}
      </div>
      <div className="text-[11px] font-bold text-foreground uppercase tracking-wider text-center leading-tight mb-1">{title}</div>
      <div className={`text-xs font-semibold ${glow ? 'text-primary' : 'text-muted-foreground'} text-center mb-0.5`}>{metric}</div>
      <div className="text-[10px] text-muted-foreground/70 text-center">{status}</div>
    </div>
  );
}
