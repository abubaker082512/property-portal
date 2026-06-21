import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Calendar, Building, Users, 
  Receipt, LogOut, Sun, Moon, RefreshCw, Home
} from 'lucide-react';

interface PortalShellProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const PortalShell: React.FC<PortalShellProps> = ({ 
  activeTab, 
  setActiveTab, 
  children 
}) => {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Apply dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  if (!user) return null;

  // Define sidebar items based on roles
  const getMenuItems = () => {
    const items = [
      { id: 'browse', label: 'View Guest Site', icon: <Home size={20} />, roles: ['super_admin', 'admin', 'sales', 'support', 'owner'] },
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['super_admin', 'admin', 'sales', 'support', 'owner'] },
      { id: 'scheduler', label: 'Booking Scheduler', icon: <Calendar size={20} />, roles: ['super_admin', 'admin', 'sales', 'support', 'owner'] },
      { id: 'bookings', label: 'Bookings List', icon: <Receipt size={20} />, roles: ['super_admin', 'admin', 'sales', 'support', 'owner'] },
      { id: 'properties', label: 'Properties', icon: <Building size={20} />, roles: ['super_admin', 'admin', 'sales', 'support', 'owner'] },
      { id: 'staff', label: 'User Management', icon: <Users size={20} />, roles: ['super_admin', 'admin'] }
    ];
    return items.filter(item => item.roles.includes(user.role));
  };

  return (
    <div className="portal-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo-icon">
            <Building size={20} />
          </div>
          <div>
            <h2>Mortal Portal</h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '-3px' }}>
              Property Management
            </span>
          </div>
        </div>

        {/* Menu */}
        <ul className="sidebar-menu">
          {getMenuItems().map(item => (
            <li key={item.id}>
              <button 
                className={`sidebar-item-btn ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  if (item.id === 'browse') {
                    window.dispatchEvent(new CustomEvent('switch-to-guest'));
                  } else {
                    setActiveTab(item.id);
                  }
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* User Info & Logout */}
        <div className="sidebar-user">
          <div className="flex align-center gap-3" style={{ marginBottom: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: 'var(--primary)',
              fontSize: '1rem',
              border: '2px solid rgba(255,255,255,0.05)'
            }}>
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: '600', color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontSize: '0.85rem' }}>
                {user.full_name}
              </div>
              <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', textTransform: 'capitalize', marginTop: '0.15rem' }}>
                {user.role}
              </span>
            </div>
          </div>
          <button 
            className="btn btn-secondary w-full" 
            onClick={logout}
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)', 
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              padding: '0.5rem'
            }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="content-wrapper">
        <header className="header">
          <div className="flex align-center gap-3">
            <h1 className="header-title" style={{ margin: 0, fontSize: '1.25rem' }}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}
            </h1>
            <div className="flex align-center gap-1" style={{ color: 'var(--success)', fontSize: '0.75rem', fontWeight: 600 }}>
              <RefreshCw size={12} className="animate-spin" style={{ animation: 'spin 4s linear infinite' }} />
              <span>Realtime Connected</span>
            </div>
          </div>
          <div className="flex align-center gap-4">
            {/* Dark mode button */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="btn btn-secondary" 
              style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px' }}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </header>

        <main className="main-content">
          <div className="animate-fade">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
