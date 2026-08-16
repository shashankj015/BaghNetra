import React, { useState, useEffect } from 'react';
import { CheckSquare, UserCheck, PlusCircle, XCircle, ChevronLeft, ChevronRight, Sparkles, MapPin, Clock, Camera } from 'lucide-react';
import api from '../services/api';

export default function ReviewPage() {
  const [pendingImages, setPendingImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tigers, setTigers] = useState([]);
  const [selectedTigerId, setSelectedTigerId] = useState('');
  const [newTigerName, setNewTigerName] = useState('');
  const [newTigerSex, setNewTigerSex] = useState('UNKNOWN');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    fetchReviewData();
  }, []);

  const fetchReviewData = async () => {
    setLoading(true);
    try {
      const [revRes, tigerRes] = await Promise.all([
        api.get('/reviews/pending?limit=100'),
        api.get('/tigers')
      ]);
      setPendingImages(revRes.data.pendingImages || []);
      setTigers(tigerRes.data.tigers || []);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Error fetching review images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    const current = pendingImages[currentIndex];
    if (!current) return;

    try {
      const payload = {
        imageId: current._id,
        action,
        assignedTigerId: action === 'ASSIGN_TIGER' ? selectedTigerId : undefined,
        newTigerDetails: action === 'CREATE_NEW' ? {
          name: newTigerName || `New Pench Individual`,
          sex: newTigerSex
        } : undefined,
        notes: notes || `Reviewed by Field Biologist`
      };

      await api.post('/reviews/submit', payload);
      setActionSuccess(`Successfully processed action: ${action}`);

      // Remove current image from queue
      const remaining = pendingImages.filter((_, idx) => idx !== currentIndex);
      setPendingImages(remaining);
      if (currentIndex >= remaining.length && remaining.length > 0) {
        setCurrentIndex(remaining.length - 1);
      }
      setNotes('');
      setSelectedTigerId('');
      setNewTigerName('');

      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      alert(`Error submitting review: ${err.response?.data?.error || err.message}`);
    }
  };

  const current = pendingImages[currentIndex];

  if (loading) {
    return <div style={{ color: '#9ca3af', textAlign: 'center', padding: '3rem' }}>Loading Human Review Station...</div>;
  }

  if (!current) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
        <CheckSquare size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ color: '#f3f4f6', margin: '0 0 0.5rem' }}>Review Queue Clear!</h2>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
          All ambiguous stripe matches and unknown candidate captures have been cataloged.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#f3f4f6', margin: 0 }}>
            Human Stripe Verification & Re-ID Station
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Auditable human-in-the-loop review station for ambiguous stripe patterns and unknown tiger discovery.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
            Item <strong>{currentIndex + 1}</strong> of <strong>{pendingImages.length}</strong>
          </span>
          <button
            className="btn-secondary"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(currentIndex - 1)}
            style={{ padding: '0.4rem 0.6rem' }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="btn-secondary"
            disabled={currentIndex === pendingImages.length - 1}
            onClick={() => setCurrentIndex(currentIndex + 1)}
            style={{ padding: '0.4rem 0.6rem' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', borderRadius: '8px', fontSize: '0.85rem' }}>
          ✓ {actionSuccess}
        </div>
      )}

      {/* Main Review Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
        {/* Left: Image & Flank Crop Display */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', background: '#000000', minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={`http://localhost:5000/${current.originalPath || current.filePath}`}
              alt="Camera Trap Frame"
              style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain' }}
              onError={(e) => {
                // Fallback demo render
                e.target.src = 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=800&auto=format&fit=crop&q=80';
              }}
            />
            {/* Model Watermark */}
            <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.7)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', color: '#ffffff' }}>
              Model: {current.modelVersion || 'YOLOv8 + ResNet50'}
            </div>
          </div>

          {/* Frame Telemetry Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
            <div>
              <span style={{ color: '#9ca3af' }}>Camera Station:</span><br />
              <strong style={{ color: '#f3f4f6' }}>{current.cameraStation}</strong>
            </div>
            <div>
              <span style={{ color: '#9ca3af' }}>Capture Time:</span><br />
              <strong style={{ color: '#f3f4f6' }}>{new Date(current.timestamp).toLocaleString()}</strong>
            </div>
            <div>
              <span style={{ color: '#9ca3af' }}>GPS Coordinates:</span><br />
              <strong style={{ color: '#f3f4f6' }}>{current.latitude?.toFixed(4)}, {current.longitude?.toFixed(4)}</strong>
            </div>
          </div>
        </div>

        {/* Right: AI Match Candidates & Decision Controls */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#f3f4f6', margin: 0 }}>AI Candidate Matches</h3>
              <span className="badge badge-buffer">
                Confidence: {Math.round((current.identificationConfidence || 0) * 100)}%
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
              Top visual stripe matches against Pench reference catalog.
            </p>
          </div>

          {/* Candidate Match List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {(!current.candidates || current.candidates.length === 0) ? (
              <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.8rem', color: '#9ca3af' }}>
                No close reference match found. Recommended action: <strong>Enroll New Individual</strong>.
              </div>
            ) : (
              current.candidates.slice(0, 3).map((cand, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <strong style={{ color: '#f3f4f6' }}>{cand.name || cand.tigerId} ({cand.tigerId})</strong>
                    <span style={{ color: cand.similarity > 0.75 ? '#10b981' : '#f59e0b', fontWeight: '700' }}>
                      {Math.round(cand.similarity * 100)}% Match
                    </span>
                  </div>
                  {/* Similarity Progress Bar */}
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.round(cand.similarity * 100)}%`,
                      height: '100%',
                      background: cand.similarity > 0.75 ? '#10b981' : '#f59e0b'
                    }} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Review Decision Form */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Biologist Action Decision:
            </h4>

            {/* Quick Confirm */}
            {current.candidates && current.candidates.length > 0 && (
              <button
                onClick={() => handleAction('CONFIRM')}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <CheckSquare size={16} /> Confirm Best Match: {current.candidates[0].tigerId}
              </button>
            )}

            {/* Manual Reassign Selector */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={selectedTigerId}
                onChange={(e) => setSelectedTigerId(e.target.value)}
                style={{
                  flex: 1,
                  background: '#111827',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.8rem'
                }}
              >
                <option value="">-- Assign to Existing Tiger --</option>
                {tigers.map(t => (
                  <option key={t.tigerId} value={t.tigerId}>
                    {t.tigerId} — {t.name} ({t.sex})
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleAction('ASSIGN_TIGER')}
                className="btn-secondary"
                disabled={!selectedTigerId}
                style={{ fontSize: '0.8rem' }}
              >
                Assign
              </button>
            </div>

            {/* Create New Tiger (BT-XXX) */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600' }}>Enroll as New Tiger (BT-XXX):</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Tiger Name (e.g. Raiyyakassa Sub-adult)"
                  value={newTigerName}
                  onChange={(e) => setNewTigerName(e.target.value)}
                  style={{ flex: 2, background: '#111827', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.6rem', borderRadius: '6px', color: '#ffffff', fontSize: '0.75rem' }}
                />
                <select
                  value={newTigerSex}
                  onChange={(e) => setNewTigerSex(e.target.value)}
                  style={{ flex: 1, background: '#111827', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem', borderRadius: '6px', color: '#ffffff', fontSize: '0.75rem' }}
                >
                  <option value="UNKNOWN">Unknown</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <button
                onClick={() => handleAction('CREATE_NEW')}
                className="btn-secondary"
                style={{ justifyContent: 'center', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }}
              >
                <PlusCircle size={14} /> Create & Catalog New Tiger
              </button>
            </div>

            {/* Reject False Trigger */}
            <button
              onClick={() => handleAction('REJECT')}
              className="btn-danger"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem' }}
            >
              <XCircle size={16} /> Reject False Detection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
