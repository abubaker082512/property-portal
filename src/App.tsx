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

const GuestPortalWrapper: React.FC<{ onSwitchToPortal: () => void }> = ({ onSwitchToPortal }) => {
  const { user, logout } = useAuth();
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--bg-app)', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      flex: '1 0 auto'
    }}>
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
          {!user ? (
            <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.4rem 0.875rem' }} onClick={onSwitchToPortal}>
              <Briefcase size={13} /> Staff Login / Sign In
            </button>
          ) : (
            <>
              {user.role !== 'customer' && (
                <button className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '0.4rem 0.875rem' }} onClick={onSwitchToPortal}>
                  <Briefcase size={13} /> Go to Portal
                </button>
              )}
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Welcome, <strong>{user.full_name}</strong></span>
                <span className="badge badge-info" style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}>{user.role}</span>
              </div>
              <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.4rem 0.875rem', color: 'var(--danger)' }} onClick={logout}>
                <LogOut size={13} /> Logout
              </button>
            </>
          )}
        </div>
      </header>
      <div style={{ maxWidth: '1300px', width: '100%', margin: '0 auto', padding: '1.5rem 1rem 4rem', flex: 1 }}>
        <GuestPortal />
      </div>
    </div>
  );
};

const PortalContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [appMode, setAppMode] = useState<'guest' | 'portal'>('guest');

  // Handle mode switches via custom events
  useEffect(() => {
    const toGuest = () => setAppMode('guest');
    const toPortal = () => setAppMode('portal');
    window.addEventListener('switch-to-guest', toGuest);
    window.addEventListener('switch-to-portal', toPortal);
    return () => {
      window.removeEventListener('switch-to-guest', toGuest);
      window.removeEventListener('switch-to-portal', toPortal);
    };
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

  // Guest view mode
  if (appMode === 'guest') {
    return <GuestPortalWrapper onSwitchToPortal={() => setAppMode('portal')} />;
  }

  // Staff/Admin Portal requires login
  if (!user) {
    return <Login />;
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
    <PortalShell activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderTabContent()}
    </PortalShell>
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
