import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Profile } from '../types';
import { api } from '../lib/supabase';
import { 
  LayoutDashboard, Calendar, Building, Users, 
  Receipt, LogOut, Sun, Moon, RefreshCw, ChevronDown
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
  const { user, logout, isDemo, switchDemoUser } = useAuth();
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

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

  // Load all profiles for demo switcher
  useEffect(() => {
    if (isDemo) {
      api.getProfiles().then(setAllProfiles).catch(console.error);
    }
  }, [isDemo, user]);

  if (!user) return null;

  // Define sidebar items based on roles
  const getMenuItems = () => {
    const items = [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin', 'sales', 'support', 'owner'] },
      { id: 'scheduler', label: 'Booking Scheduler', icon: <Calendar size={20} />, roles: ['admin', 'sales', 'support', 'owner'] },
      { id: 'bookings', label: 'Bookings List', icon: <Receipt size={20} />, roles: ['admin', 'sales', 'support', 'owner'] },
      { id: 'properties', label: 'Properties', icon: <Building size={20} />, roles: ['admin', 'sales', 'support', 'owner'] },
      { id: 'staff', label: 'Staff Management', icon: <Users size={20} />, roles: ['admin'] }
    ];
    return items.filter(item => item.roles.includes(user.role));
  };

  const handleRoleSwitch = (profileId: string) => {
    switchDemoUser(profileId);
    setShowRoleSwitcher(false);
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
                onClick={() => setActiveTab(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Demo Mode Badge / Switcher */}
        {isDemo && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', borderTop: '1px solid rgba(16, 185, 129, 0.2)', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="flex align-center justify-between" style={{ marginBottom: '0.5rem' }}>
              <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>Demo Active</span>
              <button 
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="flex align-center gap-1"
                style={{ background: 'transparent', border: 'none', color: 'hsl(150, 76%, 80%)', fontSize: '0.75rem', cursor: 'pointer', outline: 'none' }}
              >
                Switch Role <ChevronDown size={14} />
              </button>
            </div>
            {showRoleSwitcher && (
              <div className="flex flex-col gap-1" style={{ maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '0.35rem', borderRadius: '6px' }}>
                {allProfiles.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleRoleSwitch(p.id)}
                    style={{
                      background: p.id === user.id ? 'var(--primary)' : 'transparent',
                      border: 'none',
                      color: p.id === user.id ? 'white' : '#cbd5e1',
                      padding: '0.3rem 0.5rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{p.full_name}</span>
                    <span style={{ fontSize: '0.6rem', opacity: 0.7, textTransform: 'capitalize' }}>({p.role})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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
