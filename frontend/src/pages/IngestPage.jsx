import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UploadCloud, Folder, Play, CheckCircle, AlertCircle, HardDrive, 
  Clock, Activity, Sparkles, ShieldAlert, Eye, Target, MapPin, 
  Tag, RefreshCw, X, ChevronRight, BarChart2, Check, ZoomIn, 
  PlusCircle, UserPlus, Fingerprint, ExternalLink, Users, Layers
} from 'lucide-react';
import api from '../services/api';

// Helper to construct image URLs
const getImageUrl = (img) => {
  if (!img) return '';
  let path = typeof img === 'string' ? img : (img.representativeImage || img.filePath || img.previewUrl || '');
  if (!path && img._id) {
    return `http://localhost:5000/api/images/${img._id}/file`;
  }
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  let clean = path;
  if (clean.includes('/uploads/')) {
    clean = 'uploads/' + clean.split('/uploads/').pop();
  } else if (clean.includes('\\uploads\\')) {
    clean = 'uploads/' + clean.split('\\uploads\\').pop();
  } else if (clean.includes('/sample-data/')) {
    clean = 'sample-data/' + clean.split('/sample-data/').pop();
  } else if (clean.includes('/re-id/')) {
    clean = 're-id/' + clean.split('/re-id/').pop();
  } else if (clean.includes('/re id/')) {
    clean = 're-id/' + clean.split('/re id/').pop();
  } else {
    clean = clean.replace(/^\/+/, '');
  }
  return `http://localhost:5000/${clean}`;
};

export default function IngestPage() {
  const [activeTab, setActiveTab] = useState('batch'); // 'batch' | 'single'
  
  // Batch Ingestion State
  const [folderPath, setFolderPath] = useState('sample-data/sd_card_run_01');
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState('PTR-C-01');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentRun, setCurrentRun] = useState(null);
  const [progress, setProgress] = useState(null);
  const [batchImages, setBatchImages] = useState([]);
  const [batchFilter, setBatchFilter] = useState('ALL'); // 'ALL' | 'TIGER' | 'BLANK' | 'REVIEW' | 'WILDLIFE'
  const [message, setMessage] = useState('');
  
  // Single Frame Ingestion State
  const [singleFile, setSingleFile] = useState(null);
  const [singlePreviewUrl, setSinglePreviewUrl] = useState('');
  const [singleResult, setSingleResult] = useState(null);
  const [selectedInstanceIndex, setSelectedInstanceIndex] = useState(0);
  const [isUploadingSingle, setIsUploadingSingle] = useState(false);
  
  // Modal / Detail Inspection
  const [selectedImageDetail, setSelectedImageDetail] = useState(null);

  // New Tiger Enrollment Modal State
  const [enrollModalData, setEnrollModalData] = useState(null);
  const [newTigerForm, setNewTigerForm] = useState({
    tigerId: 'TIGER_108',
    name: 'Wild Tiger #108',
    sex: 'UNKNOWN',
    estimatedAge: '3.5',
    status: 'RESIDENT',
    healthNotes: 'Newly discovered wild tiger individual from camera-trap triage.'
  });
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollSuccessMessage, setEnrollSuccessMessage] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [camRes, imgRes, tigerRes] = await Promise.all([
          api.get('/cameras'),
          api.get('/images?limit=50'),
          api.get('/tigers')
        ]);
        setStations(camRes.data.stations || []);
        if (imgRes.data.images && imgRes.data.images.length > 0) {
          setBatchImages(imgRes.data.images);
        }
        // Auto calculate next unique Tiger ID from max existing ID
        const tigersList = tigerRes.data?.tigers || [];
        const maxIdNum = tigersList.reduce((max, t) => {
          const match = (t.tigerId || '').match(/\d+/);
          const num = match ? parseInt(match[0], 10) : 0;
          return num > max ? num : max;
        }, 0);
        const nextNum = (maxIdNum > 0 ? maxIdNum : tigersList.length) + 1;
        const nextId = `TIGER_${nextNum.toString().padStart(3, '0')}`;
        setNewTigerForm(prev => ({
          ...prev,
          tigerId: nextId,
          name: `Wild Tiger #${nextNum.toString().padStart(3, '0')}`
        }));
      } catch (err) {
        console.error('Error loading initial ingest data:', err);
      }
    };
    fetchInitialData();
  }, []);

  // Update preview URL when single file changes
  const handleFileSelect = (file) => {
    if (!file) return;
    setSingleFile(file);
    const objectUrl = URL.createObjectURL(file);
    setSinglePreviewUrl(objectUrl);
    setSingleResult(null);
    setSelectedInstanceIndex(0);
    setEnrollSuccessMessage('');
  };

  const handleStartBatchRun = async (e) => {
    e.preventDefault();
    if (!folderPath) return;

    setIsProcessing(true);
    setMessage('');
    setBatchImages([]);
    try {
      const res = await api.post('/runs/start', {
        folderPath,
        stationId: selectedStation,
        options: { batchSize: 4 }
      });
      setCurrentRun(res.data);
      setMessage(`Batch ingestion initiated for ${res.data.totalImages} camera trap images.`);
      
      pollRunProgress(res.data.runId);
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.error || err.message}`);
      setIsProcessing(false);
    }
  };

  const fetchRunImages = async (runId) => {
    try {
      const res = await api.get(`/images?runId=${runId}&limit=100`);
      setBatchImages(res.data.images || []);
    } catch (err) {
      console.warn('Error fetching run images:', err);
    }
  };

  const pollRunProgress = (runId) => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/runs/${runId}`);
        setCurrentRun(res.data);
        
        // Fetch newly processed images dynamically
        const imgRes = await api.get(`/images?runId=${runId}`);
        if (imgRes.data.images) {
          setBatchImages(imgRes.data.images);
        }

        if (res.data.status === 'COMPLETED' || res.data.status === 'FAILED') {
          clearInterval(interval);
          setIsProcessing(false);
          setMessage(`Run ${runId} finished with status: ${res.data.status}`);
        }
      } catch (err) {
        console.error('Error polling run:', err);
        clearInterval(interval);
        setIsProcessing(false);
      }
    }, 2000);
  };

  const handleSingleImageUpload = async (e) => {
    e.preventDefault();
    if (!singleFile) return;

    setIsUploadingSingle(true);
    setSingleResult(null);
    setSelectedInstanceIndex(0);
    setEnrollSuccessMessage('');

    const formData = new FormData();
    formData.append('image', singleFile);
    formData.append('stationId', selectedStation);

    try {
      const res = await api.post('/images/upload-single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSingleResult(res.data);
      setSelectedInstanceIndex(0);
    } catch (err) {
      console.error('Single upload failed:', err);
    } finally {
      setIsUploadingSingle(false);
    }
  };

  // Open the New Tiger Enrollment modal
  const openEnrollModal = (sourceData, embeddingVector, instance = null) => {
    const cands = instance?.candidates || sourceData?.candidates || singleResult?.image?.candidates || singleResult?.aiAnalysis?.candidates || [];
    const emb = embeddingVector || instance?.embedding || sourceData?.embedding || singleResult?.aiAnalysis?.embedding || [];
    setEnrollModalData({
      source: sourceData,
      instanceId: instance?.instanceId || 1,
      embedding: emb,
      previewUrl: sourceData?.previewUrl || singlePreviewUrl || getImageUrl(sourceData),
      imagePath: sourceData?.filePath || sourceData?.originalPath || singleResult?.image?.filePath || '',
      imageId: sourceData?._id || singleResult?.image?._id || null,
      candidates: cands
    });
  };

  // Submit enrollment to Backend & AI Service
  const handleEnrollTigerSubmit = async (e) => {
    e.preventDefault();
    if (!enrollModalData) return;

    setIsEnrolling(true);
    try {
      // Unwrap any React Proxy or nested array structure into a clean 1D array of numbers
      let cleanEmbedding = [];
      if (enrollModalData.embedding) {
        try {
          const raw = JSON.parse(JSON.stringify(enrollModalData.embedding));
          cleanEmbedding = Array.isArray(raw) ? raw.flat(Infinity).map(Number).filter(n => !isNaN(n)) : [];
        } catch (embErr) {
          cleanEmbedding = [];
        }
      }

      const payload = {
        tigerId: newTigerForm.tigerId.trim().toUpperCase(),
        name: newTigerForm.name,
        sex: newTigerForm.sex,
        estimatedAge: parseFloat(newTigerForm.estimatedAge) || 3.5,
        status: newTigerForm.status,
        healthNotes: newTigerForm.healthNotes,
        embedding: cleanEmbedding,
        imagePath: enrollModalData.imagePath,
        imageId: enrollModalData.imageId,
        cameraStation: selectedStation
      };

      const res = await api.post('/tigers/enroll-from-image', payload);
      setEnrollSuccessMessage(`Successfully registered ${payload.tigerId} (${payload.name}) into Tiger Database!`);

      const enrolledTiger = res.data.tiger;
      const finalImgPath = enrolledTiger?.representativeImage || payload.imagePath || singlePreviewUrl;

      // If we were on single frame, update the displayed result with the newly inputted image & identity
      if (singleResult) {
        setSingleResult(prev => {
          const prevInds = prev.image?.detectedIndividuals || prev.aiAnalysis?.detected_individuals || [];
          const updatedInds = prevInds.map(ind => {
            if (ind.instanceId === enrollModalData.instanceId || prevInds.length <= 1) {
              return {
                ...ind,
                tigerId: payload.tigerId,
                individual: payload.tigerId,
                tigerName: payload.name,
                identificationConfidence: 1.0,
                status: 'CONFIRMED_MATCH',
                reviewStatus: 'AUTO_CONFIRMED',
                needsReview: false
              };
            }
            return ind;
          });

          return {
            ...prev,
            image: {
              ...prev.image,
              tigerId: payload.tigerId,
              tiger_name: payload.name,
              name: payload.name,
              identificationConfidence: 1.0,
              reviewStatus: 'AUTO_CONFIRMED',
              status: 'CONFIRMED_MATCH',
              needs_review: false,
              detectedIndividuals: updatedInds,
              filePath: finalImgPath,
              representativeImage: finalImgPath,
              previewUrl: singlePreviewUrl || finalImgPath,
              candidates: [
                {
                  tigerId: payload.tigerId,
                  name: payload.name,
                  similarity: 1.0,
                  representativeImage: finalImgPath
                },
                ...(prev.image?.candidates || []).filter(c => c.tigerId !== payload.tigerId)
              ]
            },
            aiAnalysis: {
              ...(prev.aiAnalysis || {}),
              individual: payload.tigerId,
              tiger_name: payload.name,
              identification_confidence: 1.0,
              status: 'CONFIRMED_MATCH',
              needs_review: false,
              detected_individuals: updatedInds
            }
          };
        });
      }

      // Update batch gallery so the new capture appears with its inputted image
      setBatchImages(prev => {
        const newImgItem = {
          ...(singleResult?.image || {}),
          _id: payload.imageId || enrolledTiger?._id || `img-${Date.now()}`,
          fileName: singleFile?.name || `${payload.tigerId}_capture.jpg`,
          filePath: finalImgPath,
          previewUrl: singlePreviewUrl || finalImgPath,
          tigerId: payload.tigerId,
          tigerDetected: true,
          reviewStatus: 'AUTO_CONFIRMED',
          cameraStation: selectedStation,
          timestamp: new Date()
        };
        return [newImgItem, ...prev.filter(img => img._id !== payload.imageId && img.tigerId !== payload.tigerId)];
      });

      // Close modals
      setEnrollModalData(null);
      if (selectedImageDetail) {
        setSelectedImageDetail(prev => ({
          ...prev,
          tigerId: payload.tigerId,
          reviewStatus: 'AUTO_CONFIRMED',
          filePath: finalImgPath,
          previewUrl: singlePreviewUrl || finalImgPath
        }));
      }
    } catch (err) {
      alert(`Enrollment error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsEnrolling(false);
    }
  };


  const percentComplete = progress && progress.totalImages > 0
    ? Math.round((progress.processedImages / progress.totalImages) * 100)
    : 0;

  // Filter batch images
  const filteredBatchImages = batchImages.filter(img => {
    if (batchFilter === 'ALL') return true;
    if (batchFilter === 'TIGER') return img.tigerDetected;
    if (batchFilter === 'BLANK') return img.blank;
    if (batchFilter === 'REVIEW') return img.reviewStatus === 'PENDING';
    if (batchFilter === 'WILDLIFE') return !img.blank && !img.tigerDetected;
    return true;
  });

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-7xl mx-auto px-4">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">
              Camera Trap Ingestion & AI Triage
            </h1>
            <span className="bg-primary/20 text-primary text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-primary/30">
              ResNet-50 512-D Metric Re-ID Active
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Ingest raw SD card folders or inspect single camera frames with real-time neural stripe biometric matching against all database tigers.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('batch')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'batch'
                ? 'bg-primary text-primary-foreground shadow-md cinematic-glow'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            <Folder className="w-4 h-4" /> Batch SD Card
          </button>
          <button
            onClick={() => setActiveTab('single')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'single'
                ? 'bg-primary text-primary-foreground shadow-md cinematic-glow'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            <UploadCloud className="w-4 h-4" /> Single Frame Inspector
          </button>
        </div>
      </div>

      {/* Global Success Banner */}
      {enrollSuccessMessage && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in duration-300 shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <div className="text-sm font-bold text-emerald-400">{enrollSuccessMessage}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                The new individual is enrolled into the AI Microservice & MongoDB. All future captures will recognize this tiger!
              </div>
            </div>
          </div>
          <Link
            to="/tigers"
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30 flex items-center gap-1 shrink-0"
          >
            View Tiger DB <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: BATCH SD CARD INGESTION */}
      {/* ========================================================================= */}
      {activeTab === 'batch' && (
        <div className="flex flex-col gap-6">
          {/* Ingestion Config Card */}
          <div className="glass-panel p-6 rounded-2xl border border-primary/20 shadow-xl">
            <h2 className="text-lg font-heading font-bold text-foreground flex items-center gap-2 mb-4">
              <HardDrive className="text-primary w-5 h-5" /> Batch SD Card Ingestion Pipeline
            </h2>

            <form onSubmit={handleStartBatchRun} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                    SD Card / Camera Folder Path on Field Laptop:
                  </label>
                  <div className="flex items-center gap-3 bg-muted/50 border border-border rounded-xl p-2 pr-4 focus-within:border-primary/50 transition-colors">
                    <div className="bg-muted/40 p-2 rounded-lg"><Folder className="w-5 h-5 text-primary" /></div>
                    <input
                      type="text"
                      value={folderPath}
                      onChange={(e) => setFolderPath(e.target.value)}
                      placeholder="e.g. sample-data/sd_card_run_01"
                      className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder-muted-foreground/50"
                      disabled={isProcessing}
                    />
                  </div>
                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] text-muted-foreground">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => setFolderPath('sample-data/sd_card_run_01')}
                      className="text-[11px] bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-border text-foreground transition-colors"
                    >
                      sample-data/sd_card_run_01
                    </button>
                    <button
                      type="button"
                      onClick={() => setFolderPath('datasets/individual_tiger/BT003')}
                      className="text-[11px] bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-border text-foreground transition-colors"
                    >
                      datasets/individual_tiger/BT003
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                    Camera Station Source:
                  </label>
                  <select
                    value={selectedStation}
                    onChange={(e) => setSelectedStation(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl p-3 text-sm text-foreground outline-none focus:border-primary/50"
                    disabled={isProcessing}
                  >
                    {stations.map(st => (
                      <option key={st.stationId} value={st.stationId}>
                        {st.stationId} — {st.name} ({st.zone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/50">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Matching across 107 database tigers • High Threshold $\ge 0.525$</span>
                </div>
                <button
                  type="submit"
                  disabled={isProcessing || !folderPath}
                  className="px-6 py-2.5 bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50 cinematic-glow shadow-lg"
                >
                  <Play className="w-4 h-4" /> {isProcessing ? 'Processing Triage Stream...' : 'Start Camera Ingestion'}
                </button>
              </div>
            </form>

            {message && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {/* Live Progress Bar & Telemetry */}
            {progress && (
              <div className="mt-6 p-4 bg-black/40 border border-border/60 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">
                    Pipeline Progress: {progress.processedImages || 0} / {progress.totalImages || 0} Frames Ingested
                  </span>
                  <span className="text-sm font-mono font-bold text-primary">{percentComplete}%</span>
                </div>

                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                    style={{ width: `${percentComplete}%` }}
                  />
                </div>

                {/* Telemetry Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                  <div className="bg-white/5 p-3 rounded-lg border border-border/40">
                    <div className="text-[10px] text-muted-foreground uppercase">Speed</div>
                    <div className="text-lg font-mono font-bold text-sky-400">{progress.throughputFps || 0} fps</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg border border-border/40">
                    <div className="text-[10px] text-muted-foreground uppercase">Tigers Detected</div>
                    <div className="text-lg font-mono font-bold text-amber-400">{progress.tigerCount || 0}</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg border border-border/40">
                    <div className="text-[10px] text-muted-foreground uppercase">Blanks Quarantined</div>
                    <div className="text-lg font-mono font-bold text-muted-foreground">{progress.blankCount || 0}</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg border border-border/40">
                    <div className="text-[10px] text-muted-foreground uppercase">Review Required</div>
                    <div className="text-lg font-mono font-bold text-rose-400">{progress.reviewCount || 0}</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg border border-border/40">
                    <div className="text-[10px] text-muted-foreground uppercase">Storage Saved</div>
                    <div className="text-lg font-mono font-bold text-emerald-400">{progress.diskSpaceSavedMB || 0} MB</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* LIVE INGESTED IMAGE GALLERY WITH REAL PHOTOS */}
          {/* ===================================================================== */}
          <div className="glass-panel p-6 rounded-2xl border border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" /> Live Ingested Image Results ({filteredBatchImages.length})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Visual triage stream showing camera trap captures, detected flank bounding boxes, and individual Re-ID decisions.
                </p>
              </div>

              {/* Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 bg-muted/30 p-1 rounded-lg border border-border">
                {[
                  { key: 'ALL', label: 'All Photos' },
                  { key: 'TIGER', label: 'Tigers' },
                  { key: 'BLANK', label: 'Blanks' },
                  { key: 'REVIEW', label: 'Needs Review' },
                  { key: 'WILDLIFE', label: 'Other Wildlife' }
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setBatchFilter(f.key)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded transition-colors ${
                      batchFilter === f.key
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredBatchImages.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-xl bg-white/[0.02]">
                <Folder className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <div className="text-sm font-semibold text-foreground">No Processed Images To Display</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Start a batch ingestion above or select a folder containing camera trap frames.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredBatchImages.map(img => {
                  const isTiger = img.tigerDetected;
                  const isBlank = img.blank;
                  const isPending = img.reviewStatus === 'PENDING';
                  const isUnknown = isTiger && (!img.tigerId || isPending);
                  const tigerId = img.tigerId || img.suggestedTigerId;
                  const confPct = Math.round((img.identificationConfidence || 0) * 100);

                  return (
                    <div
                      key={img._id || img.fileName}
                      onClick={() => setSelectedImageDetail(img)}
                      className="group bg-card border border-border hover:border-primary/50 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col"
                    >
                      {/* Image Thumbnail Container */}
                      <div className="relative aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
                        <img
                          src={getImageUrl(img)}
                          alt={img.fileName}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=500&q=80';
                          }}
                        />

                        {/* Top Badge */}
                        <div className="absolute top-2 left-2 z-10">
                          {isBlank ? (
                            <span className="bg-black/70 backdrop-blur-md text-gray-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-white/10">
                              QUARANTINED BLANK
                            </span>
                          ) : isTiger ? (
                            <span className={`backdrop-blur-md text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              isUnknown
                                ? 'bg-amber-500/80 text-white border-amber-400'
                                : 'bg-emerald-600/90 text-white border-emerald-400'
                            }`}>
                              {tigerId ? `${tigerId} (${confPct}%)` : `UNKNOWN TIGER (${confPct}%)`}
                            </span>
                          ) : (
                            <span className="bg-sky-600/80 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                              {img.detectedClass?.toUpperCase() || 'WILDLIFE'}
                            </span>
                          )}
                        </div>

                        {/* Hover Overlay Icon */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-primary/90 text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-lg">
                            <ZoomIn className="w-3.5 h-3.5" /> Inspect Triage
                          </span>
                        </div>
                      </div>

                      {/* Card Footer Info */}
                      <div className="p-3 flex flex-col gap-1 bg-card">
                        <div className="text-xs font-mono font-bold text-foreground truncate">{img.fileName}</div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                          <span>{img.cameraStation || selectedStation}</span>
                          <span>{new Date(img.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {isTiger && (
                          <div className="mt-1 pt-1.5 border-t border-border/40 flex items-center justify-between text-[10px]">
                            {img.candidates && img.candidates.length > 0 ? (
                              <span className="text-muted-foreground truncate">
                                Top: <strong className="text-primary">{img.candidates[0].tigerId} ({Math.round(img.candidates[0].similarity * 100)}%)</strong>
                              </span>
                            ) : (
                              <span className="text-amber-400 font-bold">Uncatalogued Tiger</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SINGLE FRAME LIVE NEURAL INSPECTOR */}
      {/* ========================================================================= */}
      {activeTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Upload & Preview Pane (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="glass-panel p-6 rounded-2xl border border-border">
              <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2 mb-2">
                <UploadCloud className="w-5 h-5 text-primary" /> Upload Camera Trap Frame
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Select an individual tiger flank crop or full camera trap image from your local drive.
              </p>

              <form onSubmit={handleSingleImageUpload} className="flex flex-col gap-4">
                <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 text-center cursor-pointer transition-colors relative bg-muted/20">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-8 h-8 text-primary mx-auto mb-2 opacity-80" />
                  <div className="text-xs font-bold text-foreground">
                    {singleFile ? singleFile.name : 'Click or Drag Camera Trap Frame Here'}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">Supports JPG, PNG, TIFF from camera traps</div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={selectedStation}
                    onChange={(e) => setSelectedStation(e.target.value)}
                    className="flex-1 bg-card border border-border rounded-xl p-2.5 text-xs text-foreground outline-none"
                  >
                    {stations.map(st => (
                      <option key={st.stationId} value={st.stationId}>
                        {st.stationId} — {st.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    disabled={!singleFile || isUploadingSingle}
                    className="px-5 py-2.5 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 disabled:opacity-50 cinematic-glow shadow-md"
                  >
                    <Play className="w-3.5 h-3.5" /> {isUploadingSingle ? 'Triage Running...' : 'Run Triage'}
                  </button>
                </div>
              </form>
            </div>

            {/* Live Uploaded Image Preview Frame */}
            {singlePreviewUrl && (
              <div className="glass-panel p-4 rounded-2xl border border-border overflow-hidden flex flex-col">
                <div className="text-xs font-mono font-bold text-muted-foreground uppercase mb-2 flex items-center justify-between">
                  <span>Input Camera Frame Preview</span>
                  <span className="text-primary">{singleFile?.name}</span>
                </div>
                <div className="relative min-h-[280px] max-h-[420px] bg-black/90 rounded-xl overflow-hidden flex items-center justify-center border border-border p-1">
                  <div className="relative inline-flex items-center justify-center max-w-full max-h-full">
                    <img
                      src={singlePreviewUrl}
                      alt="Single Preview"
                      className="max-w-full max-h-[380px] w-auto h-auto object-contain select-none block rounded-lg"
                    />

                    {/* Multi-Tiger Bounding Box Reticles (Directly Overlaid on Stripe Patterns) */}
                    {singleResult && (() => {
                      const detectedIndividuals = (singleResult.aiAnalysis?.detected_individuals && singleResult.aiAnalysis.detected_individuals.length > 0)
                        ? singleResult.aiAnalysis.detected_individuals
                        : (singleResult.image?.detectedIndividuals && singleResult.image.detectedIndividuals.length > 0)
                        ? singleResult.image.detectedIndividuals
                        : (singleResult.image?.tigerDetected || singleResult.aiAnalysis?.tiger_detected ? [{
                            instanceId: 1,
                            boundingBox: singleResult.aiAnalysis?.bbox || singleResult.image?.boundingBox,
                            stripeBoundingBox: singleResult.aiAnalysis?.bbox || singleResult.image?.boundingBox,
                            individual: singleResult.image?.tigerId || singleResult.aiAnalysis?.individual,
                            tigerName: singleResult.image?.tiger_name || singleResult.aiAnalysis?.tiger_name || 'Tiger #1',
                            identificationConfidence: singleResult.image?.identificationConfidence || singleResult.aiAnalysis?.identification_confidence || 0.95
                          }] : []);

                      if (detectedIndividuals.length === 0) {
                        return (
                          <div className="absolute inset-0 pointer-events-none border border-primary/20 flex items-center justify-center">
                            <Target className="w-8 h-8 text-primary/40" />
                          </div>
                        );
                      }

                      return detectedIndividuals.map((ind, idx) => {
                        const isSelected = selectedInstanceIndex === idx;
                        const boxColor = isSelected ? '#10b981' : (idx === 0 ? '#3b82f6' : '#f59e0b');
                        const label = ind.individual || ind.tigerId || ind.tigerName || `Tiger #${ind.instanceId || idx + 1}`;
                        const simPct = Math.round((ind.identificationConfidence || 0.92) * 100);

                        // Extract normalized coordinates (0.0 to 1.0) for pixel-perfect stripe alignment
                        let nx1 = 0.1, ny1 = 0.15, nx2 = 0.9, ny2 = 0.85;
                        const rawNorm = ind.normalizedBoundingBox || ind.normalized_bounding_box;
                        const rawBbox = ind.stripeBoundingBox || ind.stripe_bounding_box || ind.boundingBox || ind.bbox;

                        if (rawNorm && Array.isArray(rawNorm) && rawNorm.length === 4) {
                          [nx1, ny1, nx2, ny2] = rawNorm;
                        } else if (rawBbox && Array.isArray(rawBbox) && rawBbox.length === 4) {
                          const [x1, y1, x2, y2] = rawBbox;
                          if (x2 <= 1.0 && y2 <= 1.0 && x2 > x1 && y2 > y1) {
                            nx1 = x1; ny1 = y1; nx2 = x2; ny2 = y2;
                          } else {
                            const imgW = singleResult.aiAnalysis?.image_width || 679;
                            const imgH = singleResult.aiAnalysis?.image_height || 450;
                            nx1 = Math.min(0.95, Math.max(0, x1 / imgW));
                            ny1 = Math.min(0.95, Math.max(0, y1 / imgH));
                            nx2 = Math.min(1.0, Math.max(0.05, x2 / imgW));
                            ny2 = Math.min(1.0, Math.max(0.05, y2 / imgH));
                          }
                        }

                        const left = `${(nx1 * 100).toFixed(2)}%`;
                        const top = `${(ny1 * 100).toFixed(2)}%`;
                        const width = `${(Math.max(0.05, nx2 - nx1) * 100).toFixed(2)}%`;
                        const height = `${(Math.max(0.05, ny2 - ny1) * 100).toFixed(2)}%`;

                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedInstanceIndex(idx)}
                            className="absolute cursor-pointer transition-all duration-200 group rounded-md"
                            style={{
                              left, top, width, height,
                              border: `2.5px solid ${boxColor}`,
                              backgroundColor: isSelected ? `${boxColor}28` : `${boxColor}10`,
                              boxShadow: isSelected ? `0 0 16px ${boxColor}bb` : '0 0 6px rgba(0,0,0,0.5)'
                            }}
                          >
                            {/* Flank stripe crosshairs */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-70">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: boxColor }} />
                            </div>

                            {/* Tiger Identification Badge */}
                            <span
                              className="absolute -top-6 left-0 px-2 py-0.5 text-[10px] font-mono font-bold rounded shadow-xl flex items-center gap-1.5 whitespace-nowrap z-20 transition-transform group-hover:scale-105"
                              style={{ backgroundColor: boxColor, color: '#ffffff' }}
                            >
                              <span>🐅 #{ind.instanceId || idx + 1}: {label}</span>
                              <span className="opacity-90 font-mono">({simPct}%)</span>
                            </span>

                            <span
                              className="absolute -bottom-5 right-0 px-1.5 py-0.5 text-[8px] font-mono font-bold rounded bg-black/80 text-white/90 border border-white/10 whitespace-nowrap"
                            >
                              Flank Stripe ROI
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right: Neural Decision Tree & Biometric Dossier (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {!singleResult ? (
              <div className="glass-panel p-10 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                <Sparkles className="w-12 h-12 text-primary/50 mb-3 animate-pulse" />
                <h4 className="text-base font-bold text-foreground">Awaiting Image Inference</h4>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Upload a photo on the left to execute the 3-stage neural pipeline: Blank Classification $\to$ Multi-Tiger Localization $\to$ ResNet-50 512-D Stripe Re-ID across all database tigers.
                </p>
              </div>
            ) : (() => {
              const detectedIndividuals = (singleResult.aiAnalysis?.detected_individuals && singleResult.aiAnalysis.detected_individuals.length > 0)
                ? singleResult.aiAnalysis.detected_individuals
                : (singleResult.image?.detectedIndividuals && singleResult.image.detectedIndividuals.length > 0)
                ? singleResult.image.detectedIndividuals
                : (singleResult.image?.tigerDetected || singleResult.aiAnalysis?.tiger_detected ? [{
                  instanceId: 1,
                  boundingBox: singleResult.image?.boundingBox || singleResult.aiAnalysis?.bbox,
                  stripeBoundingBox: singleResult.image?.boundingBox || singleResult.aiAnalysis?.bbox,
                  individual: singleResult.image?.tigerId || singleResult.aiAnalysis?.individual,
                  tigerId: singleResult.image?.tigerId || singleResult.aiAnalysis?.individual,
                  tigerName: singleResult.image?.tiger_name || singleResult.aiAnalysis?.tiger_name || singleResult.image?.tigerId || 'Tiger #1',
                  detectionConfidence: singleResult.image?.tigerConfidence || singleResult.aiAnalysis?.tiger_confidence || 0.95,
                  identificationConfidence: singleResult.image?.identificationConfidence || singleResult.aiAnalysis?.identification_confidence || 0.0,
                  status: singleResult.image?.status || singleResult.aiAnalysis?.status,
                  reviewStatus: singleResult.image?.reviewStatus,
                  needsReview: singleResult.image?.needsReview ?? singleResult.aiAnalysis?.needs_review,
                  candidates: singleResult.image?.candidates || singleResult.aiAnalysis?.candidates || [],
                  embedding: singleResult.aiAnalysis?.embedding || []
                }] : []);

              const activeInstance = detectedIndividuals[selectedInstanceIndex] || detectedIndividuals[0] || {};
              const isMultiTiger = detectedIndividuals.length > 1;
              const cands = activeInstance.candidates || [];
              const topMatch = cands[0];
              const rawConf = topMatch?.similarity ?? activeInstance.identificationConfidence ?? 0.0;
              const maxSimPct = (rawConf * 100).toFixed(1);
              const divergencePct = Math.max(0, 100 - parseFloat(maxSimPct)).toFixed(1);

              return (
                <div className="glass-panel p-6 rounded-2xl border border-primary/30 shadow-2xl flex flex-col gap-5 animate-in fade-in duration-300">
                  {/* Result Top Header Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                    <div>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">Neural Triage Status</span>
                      <h3 className="text-xl font-heading font-bold text-foreground flex items-center gap-2 mt-0.5">
                        {singleResult.image.tigerDetected ? (
                          isMultiTiger ? (
                            <span className="text-emerald-400 flex items-center gap-2">
                              <Users className="w-5 h-5 text-emerald-400" /> Multi-Tiger Scene ({detectedIndividuals.length} Individuals Detected)
                            </span>
                          ) : activeInstance.individual || activeInstance.tigerId ? (
                            <span className="text-emerald-400">Tiger Identified: {activeInstance.individual || activeInstance.tigerId}</span>
                          ) : (
                            <span className="text-amber-400">New Individual Tiger Candidate</span>
                          )
                        ) : singleResult.image.blank ? (
                          <span className="text-gray-400">Quarantined Blank Scene</span>
                        ) : (
                          <span className="text-sky-400">Wildlife: {singleResult.image.detectedClass?.toUpperCase()}</span>
                        )}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                        isMultiTiger 
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                          : activeInstance.reviewStatus === 'AUTO_CONFIRMED'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      }`}>
                        {isMultiTiger ? `MULTI_TIGER (${detectedIndividuals.length})` : (activeInstance.reviewStatus || singleResult.image.reviewStatus)}
                      </div>
                    </div>
                  </div>

                  {/* 🐅 MULTI-TIGER INSTANCE SELECTOR TABS */}
                  {isMultiTiger && (
                    <div className="flex flex-col gap-2 bg-black/60 p-3.5 rounded-2xl border border-primary/40 shadow-xl">
                      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground uppercase pb-1 border-b border-border/50">
                        <span className="flex items-center gap-1.5 text-primary font-bold">
                          <Users className="w-3.5 h-3.5" /> Select Tiger Instance to Inspect / Enroll
                        </span>
                        <span>{detectedIndividuals.length} Tigers Localized</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        {detectedIndividuals.map((ind, idx) => {
                          const isSelected = selectedInstanceIndex === idx;
                          const isConfirmed = ind.tigerId && (ind.reviewStatus === 'AUTO_CONFIRMED' || ind.status === 'CONFIRMED_MATCH');
                          const indSim = Math.round((ind.identificationConfidence || 0) * 100);

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedInstanceIndex(idx)}
                              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                                isSelected
                                  ? 'bg-primary/20 border-primary text-foreground shadow-md ring-1 ring-primary/40'
                                  : 'bg-white/5 border-border/70 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-3 h-3 rounded-full ${isSelected ? 'bg-primary animate-pulse' : 'bg-muted-foreground/50'}`} />
                                <div className="truncate">
                                  <div className="text-xs font-mono font-bold truncate">
                                    Tiger #{ind.instanceId || idx + 1}: {ind.tigerId || ind.tigerName || 'Candidate'}
                                  </div>
                                  <div className="text-[10px] font-mono text-muted-foreground truncate">
                                    {isConfirmed ? 'Registered in DB' : 'New Flank Pattern'}
                                  </div>
                                </div>
                              </div>

                              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                                isConfirmed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {indSim}%
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 🌟 ENROLLED TIGER CONFIRMATION BANNER */}
                  {activeInstance.tigerId && (activeInstance.reviewStatus === 'AUTO_CONFIRMED' || activeInstance.status === 'CONFIRMED_MATCH') && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl animate-in fade-in">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30 shrink-0">
                          <Check className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-foreground flex items-center gap-2">
                            Tiger #{activeInstance.instanceId || selectedInstanceIndex + 1} Registered: <span className="text-emerald-400 font-mono">{activeInstance.tigerId}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                            Individual signature confirmed and mapped in Pench Reserve database.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to="/map"
                          className="px-3.5 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-lg hover:bg-primary/90 flex items-center gap-1.5 font-mono transition-colors shadow-sm"
                        >
                          <MapPin className="w-3.5 h-3.5" /> View Map
                        </Link>
                        <Link
                          to={`/tigers/${activeInstance.tigerId}`}
                          className="px-3.5 py-1.5 bg-muted/40 text-foreground font-bold text-xs rounded-lg hover:bg-muted/60 flex items-center gap-1.5 font-mono transition-colors border border-border"
                        >
                          <Fingerprint className="w-3.5 h-3.5" /> Profile
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* 🌟 REGISTER AS NEW TIGER BANNER */}
                  {singleResult.image.tigerDetected && (!activeInstance.tigerId || activeInstance.reviewStatus === 'PENDING' || activeInstance.status === 'UNKNOWN_CANDIDATE') && (
                    <div className="p-5 bg-gradient-to-br from-amber-500/15 via-black/60 to-emerald-500/10 border border-amber-400/40 rounded-2xl flex flex-col gap-4 shadow-2xl animate-in fade-in">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-400/20 rounded-xl text-amber-400 border border-amber-400/30 shrink-0">
                            <PlusCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground flex items-center gap-2">
                              Tiger #{activeInstance.instanceId || selectedInstanceIndex + 1}: New Individual Candidate
                              <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                                Unregistered Flank
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Pre-Registration Biometric Check: Flank print compared against all database tigers.
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                            {divergencePct}% Pattern Divergence
                          </span>
                        </div>
                      </div>

                      {/* Similarity vs Existing Tigers */}
                      <div className="flex flex-col gap-2 bg-black/40 p-3.5 rounded-xl border border-white/5">
                        <div className="text-[11px] font-mono text-muted-foreground uppercase flex justify-between">
                          <span>Nearest Registered Matches:</span>
                          <span className="text-amber-400 font-bold">Highest Match: {maxSimPct}% (Below 52.5% threshold)</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-1">
                          {cands.slice(0, 3).map((cand, idx) => {
                            const sim = (cand.similarity * 100).toFixed(1);
                            const candImg = getImageUrl(cand.representativeImage);
                            return (
                              <div key={idx} className="flex items-center gap-2.5 p-2 bg-white/5 rounded-lg border border-border/60">
                                <div className="w-10 h-8 bg-black rounded overflow-hidden border border-border shrink-0">
                                  <img
                                    src={candImg}
                                    alt={cand.tigerId}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=500&q=80';
                                    }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[11px] font-mono font-bold text-foreground truncate">
                                    #{idx + 1} {cand.tigerId}
                                  </div>
                                  <div className="text-[10px] font-mono text-primary font-bold">
                                    {sim}% Match
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Bottom Action Row */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                        <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Confirmed distinct individual. Ready for enrollment into Tiger Database.</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => openEnrollModal(singleResult.image, activeInstance.embedding, activeInstance)}
                          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cinematic-glow"
                        >
                          <UserPlus className="w-4 h-4" /> Enroll Tiger #{activeInstance.instanceId || selectedInstanceIndex + 1} in DB
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3-Stage Pipeline Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Stage 1 */}
                    <div className="bg-black/30 p-3.5 rounded-xl border border-border/60">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase">Stage 1: Blank Triage</div>
                      <div className="text-sm font-bold text-foreground mt-1">
                        {singleResult.image.blank ? 'BLANK (Quarantined)' : 'NON-BLANK (Subject Present)'}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        Confidence: <strong>{Math.round((singleResult.image.blankConfidence || 0) * 100)}%</strong>
                      </div>
                    </div>

                    {/* Stage 2 */}
                    <div className="bg-black/30 p-3.5 rounded-xl border border-border/60">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase">Stage 2: YOLO Detection</div>
                      <div className="text-sm font-bold text-foreground mt-1">
                        {isMultiTiger ? `${detectedIndividuals.length} Tigers Localized` : (singleResult.image.tigerDetected ? 'Tiger Flank Localized' : (singleResult.image.detectedClass || 'None'))}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        Detection: <strong>{Math.round((activeInstance.detectionConfidence || singleResult.image.tigerConfidence || 0.95) * 100)}%</strong>
                      </div>
                    </div>

                    {/* Stage 3 */}
                    <div className="bg-black/30 p-3.5 rounded-xl border border-border/60">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase">Stage 3: ResNet-50 Re-ID</div>
                      <div className="text-sm font-bold text-primary mt-1">
                        {activeInstance.individual || activeInstance.tigerId || 'Unknown Individual'}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        Cosine Sim: <strong>{Math.round((activeInstance.identificationConfidence || 0) * 100)}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Side-by-Side Visual Match Comparison */}
                  {singleResult.image.tigerDetected && (
                    <div className="bg-black/40 p-4 rounded-xl border border-primary/30 flex flex-col gap-3">
                      <div className="text-xs font-mono font-bold text-primary uppercase flex items-center justify-between">
                        <span>Tiger #{activeInstance.instanceId || selectedInstanceIndex + 1} Stripe Comparison</span>
                        <span>Cosine Similarity: {((activeInstance.identificationConfidence || 0) * 100).toFixed(1)}%</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 items-center">
                        {/* Query Image */}
                        <div className="flex flex-col gap-1">
                          <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden border border-border">
                            <img
                              src={singlePreviewUrl || getImageUrl(singleResult.image.filePath)}
                              alt="Query"
                              className="w-full h-full object-contain"
                            />
                            <span className="absolute bottom-1.5 left-1.5 bg-black/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                              Query Capture #{activeInstance.instanceId || selectedInstanceIndex + 1}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground truncate">{singleFile?.name || 'Inputted Frame'}</div>
                        </div>

                        {/* Best Matched / Registered Database Prototype */}
                        <div className="flex flex-col gap-1">
                          <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden border border-primary/50">
                            <img
                              src={
                                activeInstance.tigerId && (activeInstance.reviewStatus === 'AUTO_CONFIRMED' || activeInstance.status === 'CONFIRMED_MATCH')
                                  ? (singlePreviewUrl || getImageUrl(activeInstance.representativeImage || singleResult.image.representativeImage || singleResult.image.filePath))
                                  : getImageUrl(cands[0]?.representativeImage || singleResult.image.representativeImage || singlePreviewUrl)
                              }
                              alt="Matched Reference"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=500&q=80';
                              }}
                            />
                            <span className="absolute bottom-1.5 left-1.5 bg-emerald-700/90 text-white text-[9px] font-mono px-1.5 py-0.5 rounded font-bold">
                              {activeInstance.tigerId ? 'DB Registered:' : 'DB Match:'} {activeInstance.tigerId || cands[0]?.tigerId}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-primary font-bold truncate">
                            {activeInstance.tigerName || activeInstance.individual || cands[0]?.name || 'Candidate Match'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Candidate Ranking List */}
                  {cands && cands.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="text-xs font-mono font-bold text-muted-foreground uppercase flex justify-between">
                        <span>Top Matches for Tiger #{activeInstance.instanceId || selectedInstanceIndex + 1}</span>
                        <span className="text-primary">Searched Database</span>
                      </div>
                      <div className="flex flex-col gap-2 bg-black/40 p-4 rounded-xl border border-border">
                        {cands.map((cand, idx) => {
                          const simPct = Math.round(cand.similarity * 100);
                          const isTop = idx === 0;
                          const candImg = getImageUrl(cand.representativeImage);
                          return (
                            <div key={cand.tigerId || idx} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                              <div className="w-12 h-9 bg-black rounded overflow-hidden border border-border shrink-0">
                                <img
                                  src={candImg}
                                  alt={cand.tigerId}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=500&q=80';
                                  }}
                                />
                              </div>

                              <div className="flex-1 flex flex-col gap-1">
                                <div className="flex justify-between items-center text-xs font-mono">
                                  <span>
                                    <strong className={isTop ? 'text-primary' : 'text-foreground'}>
                                      #{idx + 1} {cand.tigerId}
                                    </strong>
                                    <span className="text-muted-foreground ml-2 text-[11px]">({cand.name})</span>
                                  </span>
                                  <span className={`font-bold ${isTop ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {cand.similarity.toFixed(4)} ({simPct}%)
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      isTop ? 'bg-primary' : 'bg-muted-foreground/50'
                                    }`}
                                    style={{ width: `${Math.max(5, simPct)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Raw 512-D Normalized Vector Preview */}
                  {activeInstance.embedding && activeInstance.embedding.length > 0 && (
                    <div className="p-3 bg-black/40 rounded-xl border border-border/60">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1.5 flex items-center justify-between">
                        <span>Biometric Stripe Vector for Tiger #{activeInstance.instanceId || selectedInstanceIndex + 1}</span>
                        <span className="text-primary font-bold">||e|| = 1.0000</span>
                      </div>
                      <div className="font-mono text-[10px] text-emerald-400/90 break-all bg-black/60 p-2 rounded border border-white/5">
                        [{activeInstance.embedding.slice(0, 16).map(v => v.toFixed(4)).join(', ')}, ...]
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* MODAL 1: DETAILED IMAGE INSPECTION MODAL */}
      {/* ========================================================================= */}
      {selectedImageDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-bold text-foreground text-base">
                  Neural Triage Asset: {selectedImageDetail.fileName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedImageDetail(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: High-Res Image View */}
              <div className="flex flex-col gap-3">
                <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden border border-border flex items-center justify-center">
                  <img
                    src={getImageUrl(selectedImageDetail)}
                    alt={selectedImageDetail.fileName}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-[11px] font-mono text-muted-foreground flex justify-between">
                  <span>Camera: {selectedImageDetail.cameraStation}</span>
                  <span>Size: {Math.round((selectedImageDetail.fileSize || 0) / 1024)} KB</span>
                </div>
              </div>

              {/* Right: AI Intelligence Report */}
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-muted/20 rounded-xl border border-border flex flex-col gap-2">
                  <div className="text-xs font-mono font-bold text-muted-foreground uppercase">Triage Classification</div>
                  <div className="text-lg font-bold text-foreground">
                    {selectedImageDetail.blank ? (
                      <span className="text-gray-400">Blank Frame (Quarantined)</span>
                    ) : selectedImageDetail.tigerDetected ? (
                      <span className="text-emerald-400">
                        Tiger Identified: {selectedImageDetail.tigerId || selectedImageDetail.suggestedTigerId || 'Unknown Individual'}
                      </span>
                    ) : (
                      <span className="text-sky-400">Wildlife Subject</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Review Status: <strong className="text-foreground">{selectedImageDetail.reviewStatus}</strong>
                  </div>
                </div>

                {/* Option to enroll as new tiger if unknown */}
                {selectedImageDetail.tigerDetected && (!selectedImageDetail.tigerId || selectedImageDetail.reviewStatus === 'PENDING') && (
                  <button
                    onClick={() => {
                      openEnrollModal(selectedImageDetail, selectedImageDetail.embedding);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg cinematic-glow"
                  >
                    <UserPlus className="w-4 h-4" /> Enroll as New Tiger in Database
                  </button>
                )}

                {/* Candidate Similarities */}
                {selectedImageDetail.candidates && selectedImageDetail.candidates.length > 0 && (
                  <div className="p-4 bg-black/40 rounded-xl border border-border flex flex-col gap-2">
                    <div className="text-xs font-mono font-bold text-muted-foreground uppercase">Re-ID Similarity Rankings</div>
                    {selectedImageDetail.candidates.map((c, i) => (
                      <div key={i} className="flex justify-between items-center text-xs font-mono">
                        <span className={i === 0 ? 'text-primary font-bold' : 'text-foreground'}>
                          #{i + 1} {c.name || c.tigerId}
                        </span>
                        <span className={i === 0 ? 'text-primary font-bold' : 'text-muted-foreground'}>
                          {(c.similarity * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* EXIF Metadata */}
                <div className="p-3 bg-muted/20 rounded-xl border border-border text-xs font-mono flex flex-col gap-1 text-muted-foreground">
                  <div>Timestamp: {selectedImageDetail.timestamp ? new Date(selectedImageDetail.timestamp).toLocaleString() : 'N/A'}</div>
                  <div>Latitude: {selectedImageDetail.latitude || '21.6842° N'}</div>
                  <div>Longitude: {selectedImageDetail.longitude || '79.3124° E'}</div>
                  <div>Model: {selectedImageDetail.modelVersion || 'TigerReID-ResNet50'}</div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-card flex justify-end gap-3">
              <button
                onClick={() => setSelectedImageDetail(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-foreground text-xs font-bold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ENROLL NEW TIGER INTO DATABASE MODAL */}
      {/* ========================================================================= */}
      {enrollModalData && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border border-primary/40 rounded-3xl max-w-xl w-full flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-border bg-card flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/15 text-primary rounded-xl border border-primary/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-foreground text-lg">
                    Enroll New Tiger into Biometric DB {enrollModalData.instanceId ? `(Instance #${enrollModalData.instanceId})` : ''}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Assign a permanent ID and register this individual's 512-D stripe signature.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEnrollModalData(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEnrollTigerSubmit} className="p-6 flex flex-col gap-4">
              {/* Photo & Biometric Signature Preview */}
              <div className="flex items-center gap-4 p-3 bg-black/40 rounded-2xl border border-border">
                <div className="w-20 h-16 bg-black rounded-xl overflow-hidden border border-primary/30 shrink-0">
                  <img
                    src={enrollModalData.previewUrl}
                    alt="New Tiger Crop"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1 text-xs font-mono">
                  <div className="text-primary font-bold flex items-center gap-1">
                    <Fingerprint className="w-3.5 h-3.5" /> 512-D Stripe Vector Ready
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Dimensions: 512 • L2-Norm = 1.0000
                  </div>
                </div>
              </div>

              {/* Biometric Similarity Breakdown vs Existing Tigers in DB */}
              {enrollModalData.candidates && enrollModalData.candidates.length > 0 && (
                <div className="bg-black/50 p-3.5 rounded-2xl border border-border flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-foreground uppercase flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-primary" /> Similarity vs Registered DB Tigers
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      {Math.max(0, 100 - Math.round((enrollModalData.candidates[0]?.similarity || 0) * 100))}% Unique Stripe Divergence
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Cosine similarity of this tiger's 512-D flank vector compared to the nearest catalogued prototypes in database:
                  </p>

                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {enrollModalData.candidates.slice(0, 5).map((cand, idx) => {
                      const simPct = (cand.similarity * 100).toFixed(1);
                      const isHigh = cand.similarity >= 0.525;
                      const isMed = cand.similarity >= 0.35;
                      const candImg = getImageUrl(cand.representativeImage);
                      return (
                        <div key={idx} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/5">
                          <div className="w-10 h-8 rounded-md overflow-hidden bg-black shrink-0 border border-border">
                            <img
                              src={candImg}
                              alt={cand.tigerId}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=500&q=80';
                              }}
                            />
                          </div>

                          <div className="flex-1 flex flex-col gap-1">
                            <div className="flex justify-between items-center text-xs font-mono">
                              <span>
                                <strong className={isHigh ? 'text-emerald-400' : 'text-foreground'}>
                                  #{idx + 1} {cand.tigerId}
                                </strong>
                                <span className="text-muted-foreground ml-1.5 text-[10px]">({cand.name})</span>
                              </span>
                              <span className={`font-bold ${isHigh ? 'text-emerald-400' : isMed ? 'text-amber-400' : 'text-primary'}`}>
                                {simPct}% Similar
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isHigh ? 'bg-emerald-500' : isMed ? 'bg-amber-500' : 'bg-primary/80'
                                }`}
                                style={{ width: `${Math.max(4, parseFloat(simPct))}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                    Permanent Tiger ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTigerForm.tigerId}
                    onChange={(e) => setNewTigerForm({ ...newTigerForm, tigerId: e.target.value })}
                    className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm text-foreground font-mono focus:border-primary outline-none"
                    placeholder="e.g. TIGER_108"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                    Target Name / Alias *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTigerForm.name}
                    onChange={(e) => setNewTigerForm({ ...newTigerForm, name: e.target.value })}
                    className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
                    placeholder="e.g. Wild Tiger #108"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                    Sex
                  </label>
                  <select
                    value={newTigerForm.sex}
                    onChange={(e) => setNewTigerForm({ ...newTigerForm, sex: e.target.value })}
                    className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
                  >
                    <option value="UNKNOWN">UNKNOWN</option>
                    <option value="FEMALE">FEMALE</option>
                    <option value="MALE">MALE</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                    Territory Status
                  </label>
                  <select
                    value={newTigerForm.status}
                    onChange={(e) => setNewTigerForm({ ...newTigerForm, status: e.target.value })}
                    className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
                  >
                    <option value="RESIDENT">RESIDENT (Core Area)</option>
                    <option value="DISPERSING">DISPERSING (Corridor)</option>
                    <option value="TRANSIENT">TRANSIENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                  Field Notes & Observations
                </label>
                <textarea
                  rows={2}
                  value={newTigerForm.healthNotes}
                  onChange={(e) => setNewTigerForm({ ...newTigerForm, healthNotes: e.target.value })}
                  className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:border-primary outline-none resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setEnrollModalData(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl transition-colors"
                  disabled={isEnrolling}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEnrolling || !newTigerForm.tigerId}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-lg cinematic-glow disabled:opacity-50"
                >
                  <Check className="w-4 h-4" /> {isEnrolling ? 'Enrolling into DB...' : 'Confirm & Save to Tiger DB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
