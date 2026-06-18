import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PortalShell } from './components/PortalShell';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { BookingScheduler } from './components/BookingScheduler';
import { BookingsList } from './components/BookingsList';
import { Properties } from './components/Properties';
import { StaffManagement } from './components/StaffManagement';
import { GuestPortal } from './components/GuestPortal';
import { Home, Briefcase, LogOut } from 'lucide-react';

// Top-level mode switcher for guest vs portal
const AppModeToggle: React.FC<{ mode: 'guest' | 'portal'; onSwitch: (m: 'guest' | 'portal') => void }> = ({ mode, onSwitch }) => (
  <div style={{
    position: 'fixed',
    top: '1rem',
    right: '1rem',
    zIndex: 1000,
    display: 'flex',
    gap: '0.5rem',
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(10px)',
    borderRadius: 'var(--radius-full)',
    padding: '0.25rem',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-md)'
  }}>
    <button
      onClick={() => onSwitch('guest')}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '0.4rem 0.875rem', borderRadius: 'var(--radius-full)', border: 'none',
        fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
        background: mode === 'guest' ? 'var(--primary)' : 'transparent',
        color: mode === 'guest' ? 'white' : 'var(--text-secondary)',
        transition: 'all var(--transition-fast)'
      }}
    >
      <Home size={13} /> Browse
    </button>
    <button
      onClick={() => onSwitch('portal')}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '0.4rem 0.875rem', borderRadius: 'var(--radius-full)', border: 'none',
        fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
        background: mode === 'portal' ? 'var(--primary)' : 'transparent',
        color: mode === 'portal' ? 'white' : 'var(--text-secondary)',
        transition: 'all var(--transition-fast)'
      }}
    >
      <Briefcase size={13} /> Staff Portal
    </button>
  </div>
);

const GuestPortalWrapper: React.FC<{ onSwitchToPortal: () => void }> = ({ onSwitchToPortal }) => {
  const { user, logout } = useAuth();
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {/* Guest Header */}
      <header style={{
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Home size={16} style={{ color: 'white' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>Mortal Portal</span>
          <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--success-light)', color: 'var(--success)', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>Guest</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.4rem 0.875rem' }} onClick={onSwitchToPortal}>
            <Briefcase size={13} /> Staff Login
          </button>
          {user && (
            <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.4rem 0.875rem', color: 'var(--danger)' }} onClick={logout}>
              <LogOut size={13} /> Logout
            </button>
          )}
        </div>
      </header>
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
        <GuestPortal />
      </div>
    </div>
  );
};

const PortalContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [appMode, setAppMode] = useState<'guest' | 'portal'>('guest');

  // Allow Login page to switch back to guest mode
  useEffect(() => {
    const handler = () => setAppMode('guest');
    window.addEventListener('switch-to-guest', handler);
    return () => window.removeEventListener('switch-to-guest', handler);
  }, []);

  if (loading) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          height: '100vh', 
          width: '100vw', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'var(--bg-app)',
          color: 'var(--text-secondary)'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{
            border: '4px solid var(--border)',
            borderTop: '4px solid var(--primary)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <strong>Loading Mortal workspace...</strong>
        </div>
      </div>
    );
  }

  // Always allow guest browsing regardless of auth
  if (appMode === 'guest') {
    return (
      <>
        <AppModeToggle mode="guest" onSwitch={setAppMode} />
        <GuestPortalWrapper onSwitchToPortal={() => setAppMode('portal')} />
      </>
    );
  }

  // Staff/Admin Portal requires login
  if (!user) {
    return (
      <>
        <AppModeToggle mode="portal" onSwitch={setAppMode} />
        <Login />
      </>
    );
  }

  // Render proper subpage depending on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'scheduler':
        return <BookingScheduler />;
      case 'bookings':
        return <BookingsList />;
      case 'properties':
        return <Properties />;
      case 'staff':
        return <StaffManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <AppModeToggle mode="portal" onSwitch={setAppMode} />
      <PortalShell activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderTabContent()}
      </PortalShell>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <PortalContent />
    </AuthProvider>
  );
}

export default App;
