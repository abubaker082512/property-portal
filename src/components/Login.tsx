import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/supabase';
import type { Profile } from '../types';
import { Building, Shield, Key, RefreshCw, Eye, EyeOff, UserPlus, LogIn, Home } from 'lucide-react';

type AuthMode = 'login' | 'register';

export const Login: React.FC = () => {
  const { login, register, isDemo, switchDemoUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'register') {
        // Validate
        if (!fullName.trim()) { setError('Full name is required.'); setLoading(false); return; }
        if (!email.trim())    { setError('Email address is required.'); setLoading(false); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return; }
        await register(fullName.trim(), email.trim(), password, phone.trim() || undefined);
        setSuccess('Account created! You are now signed in.');
      } else {
        // LOGIN
        if (!email.trim()) { setError('Email or name is required.'); setLoading(false); return; }
        if (!isDemo && !password.trim()) { setError('Password is required.'); setLoading(false); return; }
        await login(email, password);
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

  const roleColors: Record<string, { bg: string; color: string }> = {
    admin: { bg: 'var(--danger-light)', color: 'var(--danger)' },
    sales: { bg: 'var(--primary-light)', color: 'var(--primary)' },
    support: { bg: 'var(--secondary-light)', color: 'var(--secondary)' },
    owner: { bg: 'var(--success-light)', color: 'var(--success)' },
    customer: { bg: 'var(--warning-light)', color: 'var(--warning)' },
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: 'var(--bg-app)',
        background: 'radial-gradient(ellipse at 15% 30%, hsl(243, 75%, 96%) 0%, hsl(172, 80%, 96%) 60%, hsl(220, 25%, 97%) 100%)',
        padding: '1.5rem',
        boxSizing: 'border-box',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '520px' }}>
        
        {/* Card */}
        <div
          className="card glass animate-scale"
          style={{
            padding: '2.5rem',
            boxShadow: '0 24px 48px rgba(0,0,0,0.07)',
            border: '1px solid var(--glass-border)'
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div
              style={{
                width: '60px', height: '60px',
                background: 'linear-gradient(135deg, var(--primary) 0%, hsl(172, 80%, 40%) 100%)',
                color: 'white', borderRadius: '18px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)',
                marginBottom: '1rem'
              }}
            >
              <Building size={28} />
            </div>
            <h2 style={{ fontSize: '1.55rem', fontWeight: 800 }}>Mortal Portal</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {mode === 'register' ? 'Create your account to get started' : 'Staff & Owner Login'}
            </p>
          </div>

          {/* Mode Toggle Tabs */}
          <div style={{ display: 'flex', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', padding: '4px', marginBottom: '1.5rem', gap: '4px' }}>
            {[
              { id: 'login' as AuthMode, label: 'Sign In', icon: <LogIn size={14} /> },
              { id: 'register' as AuthMode, label: 'Register', icon: <UserPlus size={14} /> }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setMode(tab.id); setError(''); setSuccess(''); }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '0.6rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '0.82rem', fontWeight: 700,
                  background: mode === tab.id ? 'var(--bg-card)' : 'transparent',
                  color: mode === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: mode === tab.id ? 'var(--shadow-sm)' : 'none',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠</span> {error}
            </div>
          )}
          {success && (
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--success-light)', color: 'var(--success)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✓</span> {success}
            </div>
          )}

          {/* Demo Quick Logins */}
          {isDemo && mode === 'login' && demoProfiles.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.625rem' }}>
                <Shield size={13} style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)' }}>Demo Quick Sign-In</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {demoProfiles.slice(0, 6).map(p => {
                  const colors = roleColors[p.role] || { bg: 'var(--bg-app)', color: 'var(--text-secondary)' };
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleDemoQuickLogin(p)}
                      style={{
                        padding: '0.55rem 0.75rem',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        background: 'var(--bg-card)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all var(--transition-fast)'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: colors.bg, color: colors.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.7rem', flexShrink: 0 }}>
                        {p.full_name.charAt(0)}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.full_name.split(' ')[0]}</div>
                        <div style={{ fontSize: '0.65rem', color: colors.color, fontWeight: 600, textTransform: 'capitalize' }}>{p.role}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {mode === 'register' && (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-control" placeholder="Ahmed Khan" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Phone Number</label>
                  <input type="tel" className="form-control" placeholder="+92 300 1234567" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{isDemo && mode === 'login' ? 'Email / Name Search' : 'Email Address *'}</label>
              <input
                type={isDemo && mode === 'login' ? 'text' : 'email'}
                className="form-control"
                placeholder={isDemo && mode === 'login' ? 'Type name or use quick login above...' : 'you@example.com'}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required={!(isDemo && mode === 'login')}
                autoComplete="email"
              />
            </div>

            {(!isDemo || mode === 'register') && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder={mode === 'register' ? 'Minimum 6 characters' : '••••••••'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ paddingRight: '2.5rem' }}
                    required
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Confirm Password *</label>
                <input type={showPassword ? 'text' : 'password'} className="form-control" placeholder="Re-enter password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ padding: '0.8rem', fontSize: '0.92rem', marginTop: '0.25rem' }}
            >
              {loading ? (
                <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : mode === 'login' ? (
                <><Key size={16} /> {isDemo ? 'Connect to Sandbox' : 'Sign In'}</>
              ) : (
                <><UserPlus size={16} /> Create Account</>
              )}
            </button>
          </form>

          {/* Footer notice */}
          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {isDemo
              ? '🧪 Running in Demo Mode — data is stored locally in your browser.'
              : '🔒 Secured by Supabase Auth. Row-Level Security enforced on all data.'}
          </div>
        </div>

        {/* Guest Browse Link */}
        <div style={{ textAlign: 'center' }}>
          <a href="#" onClick={e => { e.preventDefault(); window.dispatchEvent(new CustomEvent('switch-to-guest')); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
            <Home size={14} /> Browse properties as guest →
          </a>
        </div>
      </div>
    </div>
  );
};
