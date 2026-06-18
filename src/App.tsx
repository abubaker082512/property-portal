import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PortalShell } from './components/PortalShell';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { BookingScheduler } from './components/BookingScheduler';
import { BookingsList } from './components/BookingsList';
import { Properties } from './components/Properties';
import { StaffManagement } from './components/StaffManagement';

const PortalContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

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

  // Route to Login if user is not authenticated
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
