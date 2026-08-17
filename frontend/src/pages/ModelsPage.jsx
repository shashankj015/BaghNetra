import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, AlertCircle, BarChart3, Activity, ShieldCheck } from 'lucide-react';
import api from '../services/api';

export default function ModelsPage() {
  const [modelData, setModelData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModelStatus();
  }, []);

  const fetchModelStatus = async () => {
    setLoading(true);
    try {
      const [statusRes, healthRes] = await Promise.all([
        api.get('/models/status'),
        api.get('/models/health')
      ]);
      setModelData(statusRes.data);
      setHealthData(healthRes.data);
    } catch (err) {
      console.error('Error fetching model telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  const models = modelData?.models || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', color: '#f3f4f6', margin: 0 }}>
          Local AI Models & Benchmark Metrics Dashboard
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Transparent validation metrics computed on held-out camera trap test partitions. 100% offline CPU execution.
        </p>
      </div>

      {/* System Engine Health Card */}
      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cpu size={22} color="#10b981" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: '#f3f4f6', margin: 0 }}>
              Python FastAPI AI Microservice Engine
            </h3>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.2rem' }}>
              Execution Device: <strong style={{ color: '#10b981' }}>{modelData?.device?.toUpperCase() || 'CPU (Field Laptop Optimized)'}</strong> • Status: Healthy
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <span className="badge badge-core">
            ● Offline Local Mode
          </span>
          <span className="badge badge-buffer">
            PyTorch + YOLOv8 + Metric CNN
          </span>
        </div>
      </div>

      {/* Models Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {models.map((model, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', color: '#f3f4f6', margin: 0 }}>
                    {model.name}
                  </h3>
                  <span className="badge badge-tiger">{model.version}</span>
                  <span className="badge badge-core">{model.status}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                  Architecture: <strong style={{ color: '#d1d5db' }}>{model.architecture}</strong> • Task: {model.task}
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              {model.metrics?.accuracy !== undefined && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Accuracy</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#10b981', marginTop: '0.25rem' }}>
                    {(model.metrics.accuracy * 100).toFixed(1)}%
                  </div>
                </div>
              )}

              {model.metrics?.precision !== undefined && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Precision</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#3b82f6', marginTop: '0.25rem' }}>
                    {(model.metrics.precision * 100).toFixed(1)}%
                  </div>
                </div>
              )}

              {model.metrics?.recall !== undefined && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Recall (Wildlife Protection)</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#10b981', marginTop: '0.25rem' }}>
                    {(model.metrics.recall * 100).toFixed(1)}%
                  </div>
                </div>
              )}

              {model.metrics?.f1_score !== undefined && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>F1-Score</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#f59e0b', marginTop: '0.25rem' }}>
                    {(model.metrics.f1_score * 100).toFixed(1)}%
                  </div>
                </div>
              )}

              {model.metrics?.mAP50 !== undefined && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>mAP @ 0.50</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#10b981', marginTop: '0.25rem' }}>
                    {(model.metrics.mAP50 * 100).toFixed(1)}%
                  </div>
                </div>
              )}

              {model.metrics?.top1_accuracy !== undefined && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Top-1 Stripe Re-ID</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#10b981', marginTop: '0.25rem' }}>
                    {(model.metrics.top1_accuracy * 100).toFixed(1)}%
                  </div>
                </div>
              )}

              {model.metrics?.top3_accuracy !== undefined && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Top-3 Match Rank</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#3b82f6', marginTop: '0.25rem' }}>
                    {(model.metrics.top3_accuracy * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>

            {/* Confusion Matrix / Sub-Details */}
            {model.metrics?.confusion_matrix && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '0.75rem' }}>
                <strong style={{ color: '#9ca3af' }}>Confusion Matrix (BLANK vs NON_BLANK):</strong>
                <div style={{ marginTop: '0.35rem', color: '#f3f4f6', fontFamily: 'monospace' }}>
                  True Blank: {model.metrics.confusion_matrix.matrix[0][0]} | False Non-Blank: {model.metrics.confusion_matrix.matrix[0][1]}<br />
                  False Blank (FN): {model.metrics.confusion_matrix.matrix[1][0]} | True Non-Blank: {model.metrics.confusion_matrix.matrix[1][1]}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
