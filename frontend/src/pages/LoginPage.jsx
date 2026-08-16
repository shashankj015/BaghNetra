import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(username, password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error || 'Invalid credentials');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 50%, #0d1527 0%, #070a12 100%)',
      padding: '1.5rem'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)'
          }}>
            <ShieldCheck size={32} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#f3f4f6', margin: 0 }}>
            Bagh<span style={{ color: '#10b981' }}>Netra</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>
            Pench Tiger Reserve Camera Trap Intelligence
          </p>
        </div>

        {error && (
          <div style={{ padding: '0.65rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '0.35rem' }}>
              Username / Officer Badge:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 0.85rem', borderRadius: '8px' }}>
              <User size={16} color="#9ca3af" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', flex: 1, outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '0.35rem' }}>
              Password:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 0.85rem', borderRadius: '8px' }}>
              <Lock size={16} color="#9ca3af" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', flex: 1, outline: 'none' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.75rem' }}
          >
            {loading ? 'Authenticating...' : 'Access Intelligence System'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#6b7280' }}>
          Authorized Forest Staff Only • 100% Local Offline System
        </div>
      </div>
    </div>
  );
}
