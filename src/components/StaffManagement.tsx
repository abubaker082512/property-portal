import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, isDemoMode } from '../lib/supabase';
import type { Profile, UserRole } from '../types';
import { format, parseISO } from 'date-fns';
import { Users, X, UserPlus, ShieldAlert, Check } from 'lucide-react';

export const StaffManagement: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(''); // also acts as mock login username
  const [role, setRole] = useState<UserRole>('sales');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const data = await api.getProfiles();
      setProfiles(data);
    } catch (err) {
      console.error('Failed to load user profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchProfiles();
    }
  }, [user]);

  // Restrict view if not Admin
  if (user?.role !== 'admin') {
    return (
      <div className="card flex flex-col align-center justify-between" style={{ padding: '3rem', textAlign: 'center' }}>
        <ShieldAlert size={48} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
        <h3>Access Denied</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0.5rem auto 0' }}>
          This administrative control center is restricted to Admin accounts only. Booking staff and property owners do not have permissions to modify user registries.
        </p>
      </div>
    );
  }

  const openModal = () => {
    setFullName('');
    setEmail('');
    setRole('sales');
    setPhone('');
    setFormError('');
    setFormSuccess('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormError('');
    setFormSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!fullName.trim() || !email.trim()) {
      setFormError('Full Name and Email address are required.');
      return;
    }

    try {
      await api.createStaffAccount(fullName, email, role, phone);
      setFormSuccess(`Successfully registered ${fullName} as ${role}!`);
      
      // Clear inputs
      setFullName('');
      setEmail('');
      setPhone('');
      
      // Reload lists
      fetchProfiles();
      
      // Close after delay
      setTimeout(() => {
        closeModal();
      }, 1500);

    } catch (err: any) {
      setFormError(err.message || 'Failed to create staff account.');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade">
      {/* Header */}
      <div className="flex justify-between align-center">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Staff Registry Desk</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Admin portal to register support agents, sales desk staff, and property owners.
          </p>
        </div>

        <button className="btn btn-primary" onClick={openModal}>
          <UserPlus size={18} /> Add New Staff
        </button>
      </div>

      {/* RLS/Demo mode warnings */}
      {!isDemoMode && (
        <div style={{ padding: '0.75rem 1rem', display: 'flex', gap: '8px', backgroundColor: 'var(--warning-light)', color: 'var(--warning)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <span>Note: Manual staff registration is currently configured in production. Creating a user will trigger a profiles record. Secure authentication invites should be sent via Supabase dashboard.</span>
        </div>
      )}

      {/* Table grid card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Users className="animate-spin" style={{ color: 'var(--primary)', animation: 'spin 2s linear infinite', margin: '0 auto 1rem' }} size={32} />
            <span style={{ color: 'var(--text-secondary)' }}>Querying staff records...</span>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Profile Name</th>
                  <th>ID Code</th>
                  <th>Assigned Role</th>
                  <th>Phone Number</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex align-center gap-3">
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.85rem'
                        }}>
                          {p.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {p.role === 'owner' ? 'Owner Account' : p.role === 'admin' ? 'System Administrator' : 'Desk Agent'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {p.id}
                    </td>

                    <td>
                      <span className={`badge ${
                        p.role === 'admin' ? 'badge-danger' : 
                        p.role === 'owner' ? 'badge-success' : 
                        p.role === 'sales' ? 'badge-info' : 'badge-warning'
                      }`}>
                        {p.role}
                      </span>
                    </td>

                    <td style={{ color: 'var(--text-secondary)' }}>
                      {p.phone || <em style={{ color: 'var(--text-muted)' }}>None recorded</em>}
                    </td>

                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {format(parseISO(p.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Staff creation modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <div className="drawer-header" style={{ borderBottom: 'none', padding: 0, marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>Register New Portal User</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Set up internal credentials for booking, sales, or owners.
                </p>
              </div>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {formError && (
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 600 }}>
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--success-light)', color: 'var(--success)', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={16} />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  disabled={!!formSuccess}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input 
                  type="email" 
                  className="form-control"
                  placeholder="e.g. john.doe@mortal.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={!!formSuccess}
                  required
                />
              </div>

              <div className="grid grid-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Assigned Role</label>
                  <select 
                    className="form-control"
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    disabled={!!formSuccess}
                  >
                    <option value="sales">Sales Agent</option>
                    <option value="support">Customer Support</option>
                    <option value="owner">Property Owner</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="+1 555-9000"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    disabled={!!formSuccess}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={!!formSuccess}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!!formSuccess}>
                  Register User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
