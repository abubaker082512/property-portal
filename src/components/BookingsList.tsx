import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/supabase';
import type { Booking, BookingStatus, PaymentStatus, PaymentMethod } from '../types';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { Search, Receipt, CreditCard, X, Save, AlertTriangle } from 'lucide-react';

export const BookingsList: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Payment Modal states
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('bank_transfer');
  const [payReference, setPayReference] = useState('');
  const [modalError, setModalError] = useState('');

  // Status Change State
  const [statusChangeBooking, setStatusChangeBooking] = useState<Booking | null>(null);
  const [newStatus, setNewStatus] = useState<BookingStatus>('confirmed');
  const [newPayStatus, setNewPayStatus] = useState<PaymentStatus>('unpaid');
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const allBookings = await api.getBookings();
      if (user?.role === 'owner') {
        // Find properties belonging to owner first
        const allProps = await api.getProperties();
        const ownerPropIds = allProps
          .filter(p => p.owner?.profile_id === user.id)
          .map(p => p.id);
        setBookings(allBookings.filter(b => ownerPropIds.includes(b.property_id)));
      } else {
        setBookings(allBookings);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  // Filters
  const filteredBookings = bookings.filter(b => {
    const term = searchTerm.toLowerCase();
    const guestMatch = b.guest_name.toLowerCase().includes(term);
    const propMatch = b.property?.title.toLowerCase().includes(term) || false;
    const emailMatch = b.guest_email.toLowerCase().includes(term);
    return guestMatch || propMatch || emailMatch;
  });

  // Open transaction recorder
  const openPaymentModal = (booking: Booking) => {
    setSelectedBooking(booking);
    // Suggest the remaining balance
    // Let's query transactions for this booking to calculate what remains
    api.getTransactions(booking.id).then(txs => {
      const paid = txs.filter(t => t.status === 'success').reduce((sum, t) => sum + t.amount, 0);
      const remaining = Math.max(0, booking.total_price - paid);
      setPayAmount(remaining.toString());
    }).catch(() => {
      setPayAmount(booking.total_price.toString());
    });
    
    setPayMethod('bank_transfer');
    setPayReference('');
    setModalError('');
    setPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setPaymentModalOpen(false);
    setSelectedBooking(null);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setModalError('');

    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setModalError('Please enter a valid payment amount.');
      return;
    }

    try {
      await api.addTransaction({
        booking_id: selectedBooking.id,
        amount: amountNum,
        payment_method: payMethod,
        transaction_reference: payReference || 'MANUAL-ENTRY',
        status: 'success'
      });
      closePaymentModal();
      fetchBookings();
    } catch (err: any) {
      setModalError(err.message || 'Failed to record transaction.');
    }
  };

  // Open booking editor status modal
  const openStatusModal = (booking: Booking) => {
    setStatusChangeBooking(booking);
    setNewStatus(booking.status);
    setNewPayStatus(booking.payment_status);
    setStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setStatusModalOpen(false);
    setStatusChangeBooking(null);
  };

  const handleUpdateStatuses = async () => {
    if (!statusChangeBooking) return;
    try {
      await api.updateBookingStatus(statusChangeBooking.id, newStatus, newPayStatus);
      closeStatusModal();
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to update booking states.');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade">
      {/* Search Header */}
      <div className="flex justify-between align-center" style={{ gap: '1rem', flexWrap: 'wrap' }}>
        <div 
          style={{
            position: 'relative',
            maxWidth: '380px',
            width: '100%'
          }}
        >
          <Search 
            size={18} 
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input 
            type="text" 
            placeholder="Search by guest, property, or email..." 
            className="form-control w-full"
            style={{ paddingLeft: '38px' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <span className="badge badge-secondary">Total Bookings: {filteredBookings.length}</span>
          <span className="badge badge-info">Confirmed: {filteredBookings.filter(b => b.status === 'confirmed').length}</span>
          <span className="badge badge-success">Paid: {filteredBookings.filter(b => b.payment_status === 'paid').length}</span>
        </div>
      </div>

      {/* Bookings Table card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Receipt className="animate-spin" style={{ color: 'var(--primary)', animation: 'spin 2s linear infinite', margin: '0 auto 1rem' }} size={32} />
            <span style={{ color: 'var(--text-secondary)' }}>Loading bookings list...</span>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Receipt size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h4>No Bookings Found</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No entries match your search criteria.</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Guest / Contact</th>
                  <th>Property</th>
                  <th>Dates & Nights</th>
                  <th>Financial Details</th>
                  <th>Status</th>
                  <th>Payment</th>
                  {user?.role !== 'owner' && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(b => {
                  const checkIn = parseISO(b.check_in_date);
                  const checkOut = parseISO(b.check_out_date);
                  const nights = differenceInCalendarDays(checkOut, checkIn);
                  
                  return (
                    <tr key={b.id}>
                      {/* Guest info */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.guest_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{b.guest_email}</div>
                        {b.guest_phone && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.guest_phone}</div>}
                      </td>

                      {/* Property title */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {b.property?.title || 'Unknown Property'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {b.property?.city}, {b.property?.country}
                        </div>
                      </td>

                      {/* Booking Dates */}
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                          {format(checkIn, 'MMM d, yyyy')} → {format(checkOut, 'MMM d, yyyy')}
                        </div>
                        <span className="badge badge-secondary" style={{ fontSize: '0.65rem', marginTop: '4px', padding: '0.1rem 0.4rem' }}>
                          {nights} Nights
                        </span>
                      </td>

                      {/* Financials details */}
                      <td>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
                          {b.total_price.toFixed(2)} {b.currency}
                        </div>
                        
                        <div style={{ fontSize: '0.7rem', display: 'flex', gap: '8px', marginTop: '2px' }}>
                          <span style={{ color: 'var(--danger)' }}>Comm: {b.platform_commission.toFixed(0)} {b.currency}</span>
                          <span style={{ color: 'var(--success)' }}>Net: {b.owner_payout.toFixed(0)} {b.currency}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`badge ${
                          b.status === 'confirmed' ? 'badge-info' : 
                          b.status === 'completed' ? 'badge-success' : 
                          b.status === 'pending' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {b.status}
                        </span>
                        {b.staff && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            by {b.staff.full_name.split(' ')[0]}
                          </div>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td>
                        <span className={`badge ${
                          b.payment_status === 'paid' ? 'badge-success' : 
                          b.payment_status === 'partially_paid' ? 'badge-warning' : 
                          b.payment_status === 'refunded' ? 'badge-danger' : 'badge-secondary'
                        }`}>
                          {b.payment_status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      {user?.role !== 'owner' && (
                        <td style={{ textAlign: 'right' }}>
                          <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                            {/* Record manual transaction */}
                            {b.status !== 'cancelled' && b.payment_status !== 'paid' && (
                              <button 
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                                onClick={() => openPaymentModal(b)}
                                title="Record Manual Payout/Payment"
                              >
                                <CreditCard size={14} /> Pay
                              </button>
                            )}

                            {/* Edit status dropdown */}
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => openStatusModal(b)}
                            >
                              Manage
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Transaction Modal */}
      {paymentModalOpen && selectedBooking && (
        <div className="modal-overlay" onClick={closePaymentModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="drawer-header" style={{ borderBottom: 'none', padding: 0, marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>Record Manual Payment</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  For Booking ID: {selectedBooking.guest_name} ({selectedBooking.currency})
                </p>
              </div>
              <button onClick={closePaymentModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment}>
              {modalError && (
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 600 }}>
                  {modalError}
                </div>
              )}

              <div className="grid grid-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Amount Received ({selectedBooking.currency}) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-control"
                    value={payAmount} 
                    onChange={e => setPayAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method *</label>
                  <select 
                    className="form-control"
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="bank_transfer">Bank Wire Transfer</option>
                    <option value="cash">Cash Payment</option>
                    <option value="card_terminal">POS Card Terminal</option>
                    <option value="other">Other Manual Settlement</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reference ID / Receipt #</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. TXN-100293, Wire receipt number..."
                  value={payReference} 
                  onChange={e => setPayReference(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closePaymentModal}>Cancel</button>
                <button type="submit" className="btn btn-primary flex align-center gap-1">
                  <Save size={16} /> Save Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {statusModalOpen && statusChangeBooking && (
        <div className="modal-overlay" onClick={closeStatusModal}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="drawer-header" style={{ borderBottom: 'none', padding: 0, marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>Adjust Booking States</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Guest: {statusChangeBooking.guest_name}
                </p>
              </div>
              <button onClick={closeStatusModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="form-group">
                <label className="form-label">Booking Status</label>
                <select 
                  className="form-control" 
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as BookingStatus)}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Status</label>
                <select 
                  className="form-control"
                  value={newPayStatus}
                  onChange={e => setNewPayStatus(e.target.value as PaymentStatus)}
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="paid">Fully Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              {newStatus === 'cancelled' && (
                <div style={{ display: 'flex', gap: '8px', padding: '0.75rem', backgroundColor: 'var(--danger-light)', borderRadius: '6px', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 600 }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>Cancelling will release the scheduler dates back into available stock.</span>
                </div>
              )}

              <div className="flex justify-end gap-2" style={{ marginTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={closeStatusModal}>Cancel</button>
                <button className="btn btn-primary" onClick={handleUpdateStatuses}>Update States</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
