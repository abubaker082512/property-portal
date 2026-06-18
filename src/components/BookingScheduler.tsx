import React, { useState, useEffect } from 'react';
import type { Property, Booking, PaymentStatus, BookingStatus } from '../types';
import { api } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { format, addDays, differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight, RefreshCw, User, Mail, Phone, FileText, Building } from 'lucide-react';

interface BookingSchedulerProps {
  onBookingCreated?: () => void;
}

export const BookingScheduler: React.FC<BookingSchedulerProps> = ({ onBookingCreated }) => {
  const { user } = useAuth();
  
  // Date Management: 30 days window starting from 5 days ago to keep today centered
  const [startDate, setStartDate] = useState<Date>(() => startOfDay(addDays(new Date(), -5)));
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // Form states for NEW booking
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [notes, setNotes] = useState('');
  const [payStatus, setPayStatus] = useState<PaymentStatus>('unpaid');
  const [bookStatus, setBookStatus] = useState<BookingStatus>('confirmed');
  const [formError, setFormError] = useState('');

  // Fetch scheduler data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [allProps, allBookings] = await Promise.all([
        api.getProperties(),
        api.getBookings()
      ]);
      
      // If user is owner, filter properties and bookings
      if (user?.role === 'owner') {
        const ownerProps = allProps.filter(p => p.owner?.profile_id === user.id);
        const ownerPropIds = ownerProps.map(p => p.id);
        setProperties(ownerProps);
        setBookings(allBookings.filter(b => ownerPropIds.includes(b.property_id)));
      } else {
        setProperties(allProps.filter(p => p.status === 'listed'));
        setBookings(allBookings);
      }
    } catch (err) {
      console.error('Failed to load scheduler data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Generate 30 days starting from startDate
  const days = Array.from({ length: 30 }, (_, i) => addDays(startDate, i));

  const handlePrevWeek = () => setStartDate(prev => addDays(prev, -7));
  const handleNextWeek = () => setStartDate(prev => addDays(prev, 7));
  const handleToday = () => setStartDate(startOfDay(addDays(new Date(), -5)));

  // Opening drawer for editing an existing booking
  const openEditDrawer = (booking: Booking, property: Property) => {
    setSelectedBooking(booking);
    setSelectedProperty(property);
    setDrawerOpen(true);
  };

  // Opening drawer for creating a new booking
  const openNewDrawer = (property: Property, checkInDate?: Date) => {
    setSelectedBooking(null);
    setSelectedProperty(property);
    setGuestName('');
    setGuestEmail('');
    setGuestPhone('');
    setCheckIn(checkInDate ? format(checkInDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
    setCheckOut(checkInDate ? format(addDays(checkInDate, 3), 'yyyy-MM-dd') : format(addDays(new Date(), 3), 'yyyy-MM-dd'));
    setNotes('');
    setPayStatus('unpaid');
    setBookStatus('confirmed');
    setFormError('');
    setDrawerOpen(true);
  };

  // Close drawer
  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedProperty(null);
    setSelectedBooking(null);
    setFormError('');
  };

  // Handle Booking submission
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;
    setFormError('');

    // Validations
    if (!guestName.trim() || !guestEmail.trim()) {
      setFormError('Guest Name and Email are required.');
      return;
    }

    const checkInDate = parseISO(checkIn);
    const checkOutDate = parseISO(checkOut);
    if (checkOutDate <= checkInDate) {
      setFormError('Check-out date must be after check-in date.');
      return;
    }

    // Calculations
    const nights = differenceInCalendarDays(checkOutDate, checkInDate);
    const subtotal = nights * selectedProperty.price_per_night;
    
    let commission = 0;
    if (selectedProperty.commission_type === 'percentage') {
      commission = (subtotal * selectedProperty.commission_value) / 100;
    } else {
      commission = nights * selectedProperty.commission_value;
    }
    const payout = subtotal - commission;

    try {
      if (selectedBooking) {
        // Edit Booking Status/Payments
        await api.updateBookingStatus(selectedBooking.id, bookStatus, payStatus);
      } else {
        // Create Booking
        await api.createBooking({
          property_id: selectedProperty.id,
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
          check_in_date: checkIn,
          check_out_date: checkOut,
          currency: selectedProperty.currency,
          total_price: subtotal,
          platform_commission: commission,
          owner_payout: payout,
          status: bookStatus,
          payment_status: payStatus,
          notes: notes,
          booked_by_staff_id: user?.id
        });
      }
      closeDrawer();
      fetchData();
      if (onBookingCreated) onBookingCreated();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save booking.');
    }
  };

  // Check booking block positions
  const getBookingBlocksForProperty = (propertyId: string) => {
    const propertyBookings = bookings.filter(b => b.property_id === propertyId && b.status !== 'cancelled');
    
    return propertyBookings.map(b => {
      const checkInDate = parseISO(b.check_in_date);
      const checkOutDate = parseISO(b.check_out_date);
      
      // Calculate start index inside our 30-day window
      let startIndex = differenceInCalendarDays(checkInDate, startDate);
      let spanNights = differenceInCalendarDays(checkOutDate, checkInDate);
      
      // If booking check-out is before scheduler view window, skip rendering
      if (checkOutDate < startDate) return null;
      
      // If booking check-in is after scheduler view end, skip rendering
      const viewEnd = addDays(startDate, 30);
      if (checkInDate >= viewEnd) return null;

      // Handle bookings starting before the window
      if (startIndex < 0) {
        spanNights = spanNights + startIndex;
        startIndex = 0;
      }

      // Handle bookings ending after the window
      const overlapDaysLeft = 30 - startIndex;
      if (spanNights > overlapDaysLeft) {
        spanNights = overlapDaysLeft;
      }

      if (spanNights <= 0) return null;

      // Color coding based on status
      let bgColor = 'var(--primary)'; // confirmed
      if (b.status === 'pending') bgColor = 'var(--warning)';
      if (b.status === 'completed') bgColor = 'var(--success)';
      if (b.payment_status === 'unpaid' && b.status === 'confirmed') bgColor = 'hsl(243, 60%, 55%)';
      
      return {
        booking: b,
        left: startIndex * 60, // 60px cell width
        width: spanNights * 60,
        bgColor
      };
    }).filter(Boolean);
  };

  // Calculated Pricing on the fly
  const getLivePricing = () => {
    if (!selectedProperty || !checkIn || !checkOut) return null;
    const inDate = parseISO(checkIn);
    const outDate = parseISO(checkOut);
    if (outDate <= inDate) return null;

    const nights = differenceInCalendarDays(outDate, inDate);
    const subtotal = nights * selectedProperty.price_per_night;
    let commission = 0;
    if (selectedProperty.commission_type === 'percentage') {
      commission = (subtotal * selectedProperty.commission_value) / 100;
    } else {
      commission = nights * selectedProperty.commission_value;
    }
    const payout = subtotal - commission;

    return { nights, subtotal, commission, payout };
  };

  const pricing = getLivePricing();

  return (
    <div className="scheduler-container animate-fade">
      {/* Scheduler Controls */}
      <div className="scheduler-header">
        <div className="flex align-center gap-3">
          <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Availability Calendar</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Showing {format(startDate, 'MMM d, yyyy')} — {format(addDays(startDate, 29), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        <div className="flex align-center gap-2">
          <button className="btn btn-secondary" onClick={handlePrevWeek} style={{ padding: '0.4rem 0.6rem' }}>
            <ChevronLeft size={16} />
          </button>
          <button className="btn btn-secondary" onClick={handleToday} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            Today
          </button>
          <button className="btn btn-secondary" onClick={handleNextWeek} style={{ padding: '0.4rem 0.6rem' }}>
            <ChevronRight size={16} />
          </button>
          <button className="btn btn-secondary" onClick={fetchData} style={{ padding: '0.4rem' }} title="Refresh scheduler">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Scheduler Grid Wrapper */}
      <div className="scheduler-viewports">
        {loading ? (
          <div className="flex align-center justify-between h-full w-full" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px' }}>
            <div className="flex flex-col align-center gap-2">
              <RefreshCw className="animate-spin" style={{ color: 'var(--primary)', animation: 'spin 2s linear infinite' }} size={32} />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Loading schedule board...</span>
            </div>
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col align-center justify-between" style={{ padding: '3rem', textAlign: 'center', width: '100%' }}>
            <Building size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h4>No Properties Found</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Please add properties to view the scheduler grid.</p>
          </div>
        ) : (
          <div className="scheduler-grid" style={{ gridTemplateColumns: `280px repeat(30, 60px)` }}>
            {/* Header Columns */}
            <div className="scheduler-row-header-col" style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-app)', height: '55px' }}>
              Properties
            </div>
            {days.map((day, i) => {
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              return (
                <div 
                  key={i} 
                  style={{
                    borderBottom: '2px solid var(--border)',
                    borderRight: '1px solid var(--border)',
                    background: isToday ? 'var(--primary-light)' : 'var(--bg-app)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '55px',
                    fontSize: '0.75rem',
                    fontWeight: isToday ? 'bold' : 'normal',
                    color: isToday ? 'var(--primary)' : 'var(--text-secondary)'
                  }}
                >
                  <div style={{ opacity: 0.8, textTransform: 'uppercase', fontSize: '0.6rem' }}>{format(day, 'EEE')}</div>
                  <div style={{ fontSize: '0.85rem' }}>{format(day, 'd')}</div>
                </div>
              );
            })}

            {/* Properties Rows */}
            {properties.map(prop => {
              const blocks = getBookingBlocksForProperty(prop.id);
              
              return (
                <React.Fragment key={prop.id}>
                  {/* Property Name Cell */}
                  <div 
                    className="scheduler-row-header-col"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      height: '75px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'center'
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '250px' }}>
                      {prop.title}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500, marginTop: '2px' }}>
                      {prop.price_per_night} {prop.currency} <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>/ night</span>
                    </span>
                  </div>

                  {/* Property Days Cells (Wrapped in relative wrapper for booking positioning) */}
                  <div 
                    style={{ 
                      gridColumn: '2 / span 30', 
                      position: 'relative', 
                      height: '75px',
                      display: 'flex'
                    }}
                  >
                    {/* Day background cells */}
                    {days.map((day, idx) => (
                      <div 
                        key={idx}
                        className="scheduler-cell" 
                        style={{ width: '60px', height: '100%' }}
                        onClick={() => user?.role !== 'owner' && openNewDrawer(prop, day)}
                        title="Click to add booking"
                      />
                    ))}

                    {/* Booking Blocks overlay */}
                    {blocks.map((block, bIdx) => {
                      if (!block) return null;
                      const { booking, left, width, bgColor } = block;
                      const nights = differenceInCalendarDays(parseISO(booking.check_out_date), parseISO(booking.check_in_date));
                      
                      return (
                        <div
                          key={bIdx}
                          className="scheduler-booking-block"
                          style={{
                            left: `${left}px`,
                            width: `${width}px`,
                            backgroundColor: bgColor
                          }}
                          onClick={(e) => {
                            e.stopPropagation(); // prevent grid cell click
                            openEditDrawer(booking, prop);
                          }}
                        >
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                            {booking.guest_name} ({nights}n - {booking.payment_status})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Form Drawer (New/Edit) */}
      {drawerOpen && selectedProperty && (
        <div className="modal-overlay" onClick={closeDrawer}>
          <div className="drawer animate-scale" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>
                  {selectedBooking ? 'Booking Details' : 'New Booking Desk'}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {selectedProperty.title} ({selectedProperty.city})
                </p>
              </div>
              <button 
                onClick={closeDrawer}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitBooking} className="drawer-body">
              {formError && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--danger-light)',
                  color: 'var(--danger)',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  marginBottom: '1rem'
                }}>
                  {formError}
                </div>
              )}

              {/* Guest Details Panel */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem', color: 'var(--text-primary)' }}>
                  Guest Information
                </h4>
                
                <div className="form-group">
                  <label className="form-label flex align-center gap-2">
                    <User size={14} /> Guest Full Name *
                  </label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={guestName} 
                    onChange={e => setGuestName(e.target.value)}
                    disabled={!!selectedBooking}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="grid grid-2 gap-3">
                  <div className="form-group">
                    <label className="form-label flex align-center gap-2">
                      <Mail size={14} /> Guest Email *
                    </label>
                    <input 
                      type="email" 
                      className="form-control"
                      value={guestEmail} 
                      onChange={e => setGuestEmail(e.target.value)}
                      disabled={!!selectedBooking}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label flex align-center gap-2">
                      <Phone size={14} /> Guest Phone
                    </label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={guestPhone} 
                      onChange={e => setGuestPhone(e.target.value)}
                      disabled={!!selectedBooking}
                      placeholder="+1 555-0100"
                    />
                  </div>
                </div>
              </div>

              {/* Booking Dates Panel */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem', color: 'var(--text-primary)' }}>
                  Stay Details
                </h4>

                <div className="grid grid-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Check-In Date *</label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={checkIn} 
                      onChange={e => setCheckIn(e.target.value)}
                      disabled={!!selectedBooking}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Check-Out Date *</label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={checkOut} 
                      onChange={e => setCheckOut(e.target.value)}
                      disabled={!!selectedBooking}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label flex align-center gap-2">
                    <FileText size={14} /> Internal Staff Notes
                  </label>
                  <textarea 
                    className="form-control"
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    disabled={!!selectedBooking}
                    placeholder="Enter booking requirements or follow-up details..."
                  />
                </div>
              </div>

              {/* Status and Payout settings */}
              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem', color: 'var(--text-primary)' }}>
                  Billing & Status
                </h4>

                <div className="grid grid-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Booking Status</label>
                    <select 
                      className="form-control" 
                      value={bookStatus}
                      onChange={e => setBookStatus(e.target.value as BookingStatus)}
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
                      value={payStatus}
                      onChange={e => setPayStatus(e.target.value as PaymentStatus)}
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="partially_paid">Partially Paid</option>
                      <option value="paid">Fully Paid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>

                {/* Real-time calculated pricing panel */}
                {pricing && (
                  <div style={{
                    marginTop: '1.25rem',
                    padding: '1rem',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: '8px',
                    border: '1px dashed var(--border)',
                    fontSize: '0.85rem'
                  }}>
                    <div className="flex justify-between" style={{ marginBottom: '0.4rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Nights:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{pricing.nights} nights</strong>
                    </div>
                    <div className="flex justify-between" style={{ marginBottom: '0.4rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Rate:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedProperty.price_per_night} {selectedProperty.currency} / night</strong>
                    </div>
                    <div className="flex justify-between" style={{ marginBottom: '0.8rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Total Cost:</span>
                      <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>{pricing.subtotal.toFixed(2)} {selectedProperty.currency}</strong>
                    </div>
                    
                    {/* Platform Commission info */}
                    <div className="flex justify-between" style={{ marginBottom: '0.3rem', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Commission ({selectedProperty.commission_type === 'percentage' 
                          ? `${selectedProperty.commission_value}%` 
                          : `${selectedProperty.commission_value} ${selectedProperty.currency} fixed`
                        }):
                      </span>
                      <strong style={{ color: 'var(--danger)' }}>+{pricing.commission.toFixed(2)} {selectedProperty.currency}</strong>
                    </div>
                    
                    <div className="flex justify-between" style={{ fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Owner Net Payout:</span>
                      <strong style={{ color: 'var(--success)' }}>{pricing.payout.toFixed(2)} {selectedProperty.currency}</strong>
                    </div>
                  </div>
                )}
              </div>
            </form>

            <div className="drawer-footer">
              <button className="btn btn-secondary" onClick={closeDrawer}>
                Cancel
              </button>
              {/* If owner, disable updates or creation on staff drawer */}
              {user?.role === 'owner' && !selectedBooking ? null : (
                <button className="btn btn-primary" onClick={handleSubmitBooking}>
                  {selectedBooking ? 'Save Changes' : 'Create Booking'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
