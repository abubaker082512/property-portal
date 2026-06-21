import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, isDemoMode } from '../lib/supabase';
import type { Profile, UserRole } from '../types';
import { format, parseISO } from 'date-fns';
import { Users, X, UserPlus, ShieldAlert, Check, Trash2 } from 'lucide-react';

export const StaffManagement: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
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
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      fetchProfiles();
    }
  }, [user]);

  // Restrict view if not Admin or Super Admin
  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <div className="card flex flex-col align-center justify-between" style={{ padding: '3rem', textAlign: 'center' }}>
        <ShieldAlert size={48} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
        <h3>Access Denied</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0.5rem auto 0' }}>
          This administrative control center is restricted to Admin and Super Admin accounts only.
        </p>
      </div>
    );
  }

  const canManageUser = (targetProfile: Profile) => {
    // You cannot delete or edit yourself
    if (targetProfile.id === user.id) return false;
    
    // Super Admins can manage all other users
    if (user.role === 'super_admin') return true;
    
    // Admins can manage sales, support, owners, and customers
    if (user.role === 'admin') {
      return targetProfile.role !== 'admin' && targetProfile.role !== 'super_admin';
    }
    
    return false;
  };

  const handleRoleChange = async (profileId: string, newRole: UserRole) => {
    setUpdatingId(profileId);
    try {
      await api.updateProfileRole(profileId, newRole);
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole } : p));
    } catch (err: any) {
      alert(err.message || 'Failed to update user role.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (profileId: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete user "${name}"?`)) {
      setUpdatingId(profileId);
      try {
        await api.deleteProfile(profileId);
        setProfiles(prev => prev.filter(p => p.id !== profileId));
      } catch (err: any) {
        alert(err.message || 'Failed to delete user.');
      } finally {
        setUpdatingId(null);
      }
    }
  };

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
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>User Management Registry</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            System control center to manage all user profiles, change roles, or remove accounts.
          </p>
        </div>

        <button className="btn btn-primary" onClick={openModal}>
          <UserPlus size={18} /> Register New User
        </button>
      </div>

      {/* RLS/Demo mode warnings */}
      {!isDemoMode && (
        <div style={{ padding: '0.75rem 1rem', display: 'flex', gap: '8px', backgroundColor: 'var(--warning-light)', color: 'var(--warning)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <span>Note: User changes here modify database records instantly. New accounts registered will trigger Supabase profile creation. Secure logins must be processed via Supabase Auth invites.</span>
        </div>
      )}

      {/* Table grid card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Users className="animate-spin" style={{ color: 'var(--primary)', animation: 'spin 2s linear infinite', margin: '0 auto 1rem' }} size={32} />
            <span style={{ color: 'var(--text-secondary)' }}>Querying system registry...</span>
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
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => (
                  <tr key={p.id} style={{ opacity: updatingId === p.id ? 0.6 : 1 }}>
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
                            {p.role === 'super_admin' ? 'Super Administrator' : p.role === 'admin' ? 'Administrator' : p.role === 'owner' ? 'Owner Account' : 'Desk Agent'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {p.id}
                    </td>

                    <td>
                      {canManageUser(p) ? (
                        <select
                          className="form-control"
                          style={{ margin: 0, padding: '0.25rem 0.5rem', width: 'auto', fontSize: '0.8rem', height: 'auto' }}
                          value={p.role}
                          onChange={e => handleRoleChange(p.id, e.target.value as UserRole)}
                          disabled={updatingId === p.id}
                        >
                          {user.role === 'super_admin' && <option value="super_admin">super_admin</option>}
                          <option value="admin">admin</option>
                          <option value="sales">sales</option>
                          <option value="support">support</option>
                          <option value="owner">owner</option>
                          <option value="customer">customer</option>
                        </select>
                      ) : (
                        <span className={`badge ${
                          p.role === 'super_admin' || p.role === 'admin' ? 'badge-danger' : 
                          p.role === 'owner' ? 'badge-success' : 
                          p.role === 'sales' ? 'badge-info' : 'badge-warning'
                        }`}>
                          {p.role}
                        </span>
                      )}
                    </td>

                    <td style={{ color: 'var(--text-secondary)' }}>
                      {p.phone || <em style={{ color: 'var(--text-muted)' }}>None recorded</em>}
                    </td>

                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {format(parseISO(p.created_at), 'MMM d, yyyy')}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      {canManageUser(p) ? (
                        <button
                          onClick={() => handleDeleteUser(p.id, p.full_name)}
                          className="btn btn-secondary"
                          style={{ 
                            padding: '0.3rem', 
                            color: 'var(--danger)', 
                            borderColor: 'rgba(239, 68, 68, 0.2)',
                            background: 'transparent',
                            cursor: 'pointer'
                          }}
                          disabled={updatingId === p.id}
                          title="Delete User Account"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Locked</span>
                      )}
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
                <h3 style={{ fontSize: '1.2rem' }}>Register New User Profile</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Create internal system profile credentials.
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
                    {user.role === 'super_admin' && <option value="super_admin">Super Administrator</option>}
                    <option value="admin">Administrator</option>
                    <option value="sales">Sales Agent</option>
                    <option value="support">Customer Support</option>
                    <option value="owner">Property Owner</option>
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
