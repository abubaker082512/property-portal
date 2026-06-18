import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/supabase';
import type { Property, Booking, PaymentTransaction } from '../types';
import { format, parseISO } from 'date-fns';
import { 
  TrendingUp, Calendar, Building, DollarSign, 
  Clock, ShieldCheck
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allProps, allBookings, allTxs] = await Promise.all([
        api.getProperties(),
        api.getBookings(),
        api.getTransactions()
      ]);

      if (user?.role === 'owner') {
        // Filter properties belonging to owner
        const ownerProps = allProps.filter(p => p.owner?.profile_id === user.id);
        const ownerPropIds = ownerProps.map(p => p.id);
        setProperties(ownerProps);
        
        // Filter bookings for these properties
        const ownerBookings = allBookings.filter(b => ownerPropIds.includes(b.property_id));
        const ownerBookingIds = ownerBookings.map(b => b.id);
        setBookings(ownerBookings);
        
        // Filter transactions
        setTransactions(allTxs.filter(t => ownerBookingIds.includes(t.booking_id)));
      } else {
        setProperties(allProps);
        setBookings(allBookings);
        setTransactions(allTxs);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <TrendingUp className="animate-spin" style={{ color: 'var(--primary)', animation: 'spin 2s linear infinite' }} size={32} />
      </div>
    );
  }

  // --- STATS CALCULATIONS ---
  // A. Currencies summary: group revenue, payouts, and commission by currency
  const currencyStats: Record<string, { totalVolume: number; commission: number; payouts: number }> = {};
  
  bookings.forEach(b => {
    if (b.status === 'cancelled') return;
    const cur = b.currency || 'USD';
    if (!currencyStats[cur]) {
      currencyStats[cur] = { totalVolume: 0, commission: 0, payouts: 0 };
    }
    currencyStats[cur].totalVolume += b.total_price;
    currencyStats[cur].commission += b.platform_commission;
    currencyStats[cur].payouts += b.owner_payout;
  });

  // B. Occupancy check: how many properties are occupied today?
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const occupiedPropIds = new Set<string>();
  
  bookings.forEach(b => {
    if (b.status !== 'cancelled') {
      if (todayStr >= b.check_in_date && todayStr < b.check_out_date) {
        occupiedPropIds.add(b.property_id);
      }
    }
  });

  const activePropertiesCount = properties.filter(p => p.status === 'listed').length;
  const occupancyRate = activePropertiesCount > 0 
    ? Math.round((occupiedPropIds.size / activePropertiesCount) * 100) 
    : 0;

  // C. Active/Upcoming bookings count
  const activeBookingsCount = bookings.filter(b => b.status === 'confirmed').length;

  return (
    <div className="flex flex-col gap-6 animate-fade">
      {/* Welcome Banner */}
      <div className="card glass flex justify-between align-center" style={{ padding: '1.25rem 2rem', background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-light))', border: '1px solid var(--primary)' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 800 }}>
            Hello, {user?.full_name}!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
            {user?.role === 'admin' 
              ? 'Administrator Hub. Here is the financial overview across all property listings and staff desks.' 
              : user?.role === 'owner' 
              ? 'Owner Management Hub. Track occupancy and net revenue payouts for your property portfolio.'
              : 'Booking Agent Workspace. Syncing walk-ins, phone-bookings, and schedule availability.'
            }
          </p>
        </div>
        <div className="flex align-center gap-2">
          <span className="badge badge-info" style={{ textTransform: 'capitalize', fontSize: '0.75rem', padding: '0.3rem 0.8rem' }}>
            {user?.role} view
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-4 gap-4">
        {/* Card 1: Occupancy Rate */}
        <div className="card flex align-center gap-4">
          <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Occupancy Today</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '2px' }}>{occupancyRate}%</h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {occupiedPropIds.size} of {activePropertiesCount} listed units
            </span>
          </div>
        </div>

        {/* Card 2: Active Bookings */}
        <div className="card flex align-center gap-4">
          <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Bookings</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '2px' }}>{activeBookingsCount}</h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {bookings.filter(b => b.status === 'pending').length} bookings pending
            </span>
          </div>
        </div>

        {/* Card 3: Total Properties */}
        <div className="card flex align-center gap-4">
          <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
            <Building size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Properties</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '2px' }}>{properties.length}</h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {properties.filter(p => p.status === 'maintenance').length} in maintenance
            </span>
          </div>
        </div>

        {/* Card 4: Platform Commission / Total Earnings */}
        <div className="card flex align-center gap-4">
          <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {user?.role === 'owner' ? 'Your Earnings' : 'Platform Commissions'}
            </p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
              {Object.keys(currencyStats).length === 0 ? '0.00' : 
                Object.entries(currencyStats).map(([cur, stats]) => {
                  const val = user?.role === 'owner' ? stats.payouts : stats.commission;
                  return `${val.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${cur}`;
                }).join(' / ')
              }
            </h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Gross Volume: {Object.entries(currencyStats).map(([cur, stats]) => `${stats.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${cur}`).join(' / ') || '0'}
            </span>
          </div>
        </div>
      </div>

      {/* Multi-Currency Financial Details Panel */}
      <div className="card">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
          Financial Breakdown by Currency
        </h3>
        
        {Object.keys(currencyStats).length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No transaction records available. Bookings must be active to calculate financial totals.
          </div>
        ) : (
          <div className="grid grid-3 gap-4">
            {Object.entries(currencyStats).map(([cur, stats]) => (
              <div 
                key={cur} 
                style={{
                  background: 'var(--bg-app)',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  border: '1px solid var(--border)',
                  position: 'relative'
                }}
              >
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontWeight: '800', color: 'var(--primary)', opacity: 0.15, fontSize: '1.8rem' }}>
                  {cur}
                </div>
                <h4 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>{cur} Wallet</h4>
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between" style={{ fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Gross Volume:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{stats.totalVolume.toFixed(2)} {cur}</strong>
                  </div>
                  <div className="flex justify-between" style={{ fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Platform Commissions:</span>
                    <strong style={{ color: 'var(--danger)' }}>{stats.commission.toFixed(2)} {cur}</strong>
                  </div>
                  <div className="flex justify-between" style={{ fontSize: '0.85rem', borderTop: '1px dashed var(--border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Owner Payouts:</span>
                    <strong style={{ color: 'var(--success)', fontWeight: 700 }}>{stats.payouts.toFixed(2)} {cur}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Split Views: Recent Bookings & Payments */}
      <div className="grid grid-2 gap-6">
        {/* Recent Bookings */}
        <div className="card flex flex-col" style={{ minHeight: '350px' }}>
          <h3 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} style={{ color: 'var(--primary)' }} />
            Recent Bookings
          </h3>
          <div className="table-container" style={{ flexGrow: 1, border: 'none' }}>
            {bookings.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No bookings registered yet.</div>
            ) : (
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Property</th>
                    <th>Check In</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(-5).reverse().map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600 }}>{b.guest_name}</td>
                      <td style={{ maxWidth: '120px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {b.property?.title || 'Unknown'}
                      </td>
                      <td>{format(parseISO(b.check_in_date), 'MMM d')}</td>
                      <td>
                        <span className={`badge ${
                          b.status === 'confirmed' ? 'badge-info' : 
                          b.status === 'completed' ? 'badge-success' : 
                          b.status === 'pending' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card flex flex-col" style={{ minHeight: '350px' }}>
          <h3 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
            Recent Payment Ledger
          </h3>
          <div className="table-container" style={{ flexGrow: 1, border: 'none' }}>
            {transactions.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No payment transactions received.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(-5).reverse().map(t => {
                    // Find matching booking to get currency
                    const booking = bookings.find(b => b.id === t.booking_id);
                    const currency = booking?.currency || 'USD';
                    return (
                      <tr key={t.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{t.transaction_reference || 'MANUAL'}</td>
                        <td style={{ textTransform: 'capitalize' }}>{t.payment_method.replace('_', ' ')}</td>
                        <td style={{ fontWeight: 600 }}>{t.amount.toFixed(2)} {currency}</td>
                        <td>
                          <span className="badge badge-success">{t.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
