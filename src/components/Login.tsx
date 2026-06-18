import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/supabase';
import type { Profile } from '../types';
import { Building, Shield, Key, RefreshCw } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, isDemo, switchDemoUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoProfiles, setDemoProfiles] = useState<Profile[]>([]);

  // Load demo profiles for easy entry
  useEffect(() => {
    if (isDemo) {
      api.getProfiles().then(setDemoProfiles).catch(console.error);
    }
  }, [isDemo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isDemo) {
        if (!email.trim()) {
          setError('Please select one of the quick demo users or type an email.');
          setLoading(false);
          return;
        }
        await login(email);
      } else {
        // Production email/password flow
        if (!email.trim() || !password.trim()) {
          setError('Email and password are required in production.');
          setLoading(false);
          return;
        }
        await login(email);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoQuickLogin = async (p: Profile) => {
    setError('');
    setLoading(true);
    try {
      await switchDemoUser(p.id);
    } catch (err: any) {
      setError(err.message || 'Failed to switch to demo role.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        background: 'radial-gradient(circle at 10% 20%, hsl(var(--primary-hue), 80%, 94%) 0%, hsl(var(--secondary-hue), 80%, 95%) 90%)',
        padding: '1.5rem',
        boxSizing: 'border-box'
      }}
    >
      <div 
        className="card glass animate-scale" 
        style={{ 
          maxWidth: '520px', 
          width: '100%', 
          padding: '2.5rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)'
        }}
      >
        {/* Logo and Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div 
            style={{
              width: '56px',
              height: '56px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              borderRadius: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)',
              marginBottom: '0.75rem'
            }}
          >
            <Building size={28} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Mortal Portal Login</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Synchronized Booking, Payouts, & Properties Desk
          </p>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger)',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Demo Quick login block */}
        {isDemo && demoProfiles.length > 0 && (
          <div style={{ marginBottom: '1.75rem' }}>
            <div className="flex align-center gap-1 mb-2" style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 700 }}>
              <Shield size={14} />
              <span>Demo Sandbox Quick Sign-In</span>
            </div>
            
            <div className="flex flex-col gap-2">
              {demoProfiles.slice(0, 5).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleDemoQuickLogin(p)}
                  className="btn btn-secondary flex align-center justify-between"
                  style={{
                    padding: '0.65rem 1rem',
                    textAlign: 'left',
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                    borderColor: 'var(--border)',
                    fontSize: '0.8rem',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div className="flex align-center gap-2">
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: p.role === 'admin' ? 'var(--danger-light)' : 'var(--primary-light)',
                      color: p.role === 'admin' ? 'var(--danger)' : 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.7rem'
                    }}>
                      {p.full_name.charAt(0)}
                    </div>
                    <strong>{p.full_name}</strong>
                  </div>
                  <span className={`badge ${
                    p.role === 'admin' ? 'badge-danger' : 
                    p.role === 'owner' ? 'badge-success' : 'badge-info'
                  }`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                    {p.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address / Staff Login</label>
            <input 
              type="text" 
              className="form-control"
              placeholder={isDemo ? "Type name or select quick login above..." : "john@mortal.com"}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          {!isDemo && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary w-full flex align-center gap-1"
            disabled={loading}
            style={{ marginTop: '0.5rem', padding: '0.75rem' }}
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={18} style={{ animation: 'spin 2s linear infinite' }} />
            ) : (
              <>
                <Key size={18} />
                <span>{isDemo ? 'Connect Sandbox' : 'Authenticate Login'}</span>
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {isDemo 
            ? 'Connected to local sandbox state storage. Changes will persist locally.'
            : 'Secure Supabase Connection. Row Level Security policies applied.'
          }
        </div>
      </div>
    </div>
  );
};
