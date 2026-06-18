import React, { useState, useEffect } from 'react';
import { api } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Property, PropertyType } from '../types';
import {
  Search, MapPin, Star, Wifi, Wind, Waves, Dumbbell,
  Flame, Car, Home, Building, TreePine,
  X, ChevronLeft, ChevronRight, Users, Bed, Bath,
  Calendar, Check, ArrowRight, Shield, Globe, Heart,
  Plus, Minus, Info
} from 'lucide-react';
import { differenceInCalendarDays, format, addDays, parseISO } from 'date-fns';

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  WiFi: <Wifi size={14} />, 'Air Conditioning': <Wind size={14} />,
  Pool: <Waves size={14} />, Gym: <Dumbbell size={14} />,
  Fireplace: <Flame size={14} />, Parking: <Car size={14} />,
  Kitchen: <Home size={14} />, 'Hot Tub': <Waves size={14} />,
  'Beach View': <Globe size={14} />, 'Pet Friendly': <Heart size={14} />,
  Balcony: <TreePine size={14} />, Elevator: <Building size={14} />,
};

const CURRENCIES = [
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

const PROPERTY_TYPES: PropertyType[] = ['apartment', 'house', 'villa', 'condo', 'cottage', 'cabin'];

type GuestView = 'search' | 'detail' | 'booking_confirm' | 'list_property';

// ---- BOOKING CONFIRMATION MODAL ----
const BookingModal: React.FC<{
  property: Property;
  checkIn: string;
  checkOut: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ property, checkIn, checkOut, onClose, onSuccess }) => {
  const { user } = useAuth();
  const nights = differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
  const totalPrice = nights * property.price_per_night;
  const commission = property.commission_type === 'percentage'
    ? (totalPrice * property.commission_value) / 100
    : property.commission_value * nights;
  const ownerPayout = totalPrice - commission;

  const [guestName, setGuestName] = useState(user?.full_name || '');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestEmail.trim()) {
      setError('Name and email are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.createBooking({
        property_id: property.id,
        customer_id: user?.id,
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim(),
        guest_phone: guestPhone.trim(),
        check_in_date: checkIn,
        check_out_date: checkOut,
        currency: property.currency,
        total_price: totalPrice,
        platform_commission: commission,
        owner_payout: ownerPayout,
        notes: notes.trim(),
        payment_status: 'unpaid',
        status: 'pending',
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '500px', maxHeight: '95vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Confirm Your Booking</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{property.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Price Summary */}
        <div style={{ backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            <span>{property.price_per_night} {property.currency} × {nights} nights</span>
            <strong>{totalPrice.toLocaleString()} {property.currency}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
            <span>Check-in</span>
            <span>{format(parseISO(checkIn), 'dd MMM yyyy')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            <span>Check-out</span>
            <span>{format(parseISO(checkOut), 'dd MMM yyyy')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
            <span>Total</span>
            <span>{totalPrice.toLocaleString()} {property.currency}</span>
          </div>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Full Name *</label>
            <input type="text" className="form-control" placeholder="John Doe" value={guestName} onChange={e => setGuestName(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address *</label>
            <input type="email" className="form-control" placeholder="john@example.com" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Phone Number</label>
            <input type="tel" className="form-control" placeholder="+92 300 1234567" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Special Requests / Notes</label>
            <textarea className="form-control" rows={2} placeholder="Early check-in, dietary needs, etc." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--primary-light)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--primary)' }}>
            <Shield size={14} />
            <span>Your booking will be confirmed by our team. Payment is handled offline (bank transfer / cash).</span>
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: '0.75rem', marginTop: '0.25rem' }}>
            {submitting ? 'Submitting...' : `Request Booking · ${totalPrice.toLocaleString()} ${property.currency}`}
          </button>
        </form>
      </div>
    </div>
  );
};

// ---- LIST YOUR PROPERTY FORM ----
const ListPropertyForm: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [propType, setPropType] = useState<PropertyType>('apartment');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [maxGuests, setMaxGuests] = useState(2);
  const [currency, setCurrency] = useState('PKR');
  const [pricePerNight, setPricePerNight] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [ownerName, setOwnerName] = useState(user?.full_name || '');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState(user?.phone || '');

  const addImageField = () => setImageUrls(prev => [...prev, '']);
  const removeImageField = (i: number) => setImageUrls(prev => prev.filter((_, idx) => idx !== i));
  const updateImageUrl = (i: number, val: string) => setImageUrls(prev => prev.map((u, idx) => idx === i ? val : u));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !city || !country || !pricePerNight) {
      setError('Please fill all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      // In demo mode: create property with unlisted status for review
      // Get or create a dummy owner id
      const owners = await api.getOwners();
      let ownerId = owners[0]?.id;
      if (!ownerId) ownerId = 'o-1';

      const images = imageUrls.filter(u => u.trim()).length > 0
        ? imageUrls.filter(u => u.trim())
        : ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'];

      await api.createProperty({
        owner_id: ownerId,
        title,
        description,
        address,
        city,
        state: '',
        country,
        zip_code: '',
        currency,
        price_per_night: parseFloat(pricePerNight),
        commission_type: 'percentage',
        commission_value: 10,
        property_type: propType,
        bedrooms,
        bathrooms,
        max_guests: maxGuests,
        amenities: [],
        images,
        status: 'unlisted',
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ width: '72px', height: '72px', backgroundColor: 'var(--success-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Check size={36} style={{ color: 'var(--success)' }} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.75rem' }}>Listing Submitted!</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 2rem' }}>
          Your property has been submitted for review. Our team will verify and publish it within 24–48 hours.
        </p>
        <button className="btn btn-primary" onClick={onBack}>
          <ArrowRight size={16} /> Back to Browse
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1rem' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        <ChevronLeft size={16} /> Back to Search
      </button>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>List Your Property</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Share your space and earn with Mortal Portal.</p>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: s <= step ? 'var(--primary)' : 'var(--border)', transition: 'background var(--transition-normal)' }} />
        ))}
      </div>

      {error && (
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1.5rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Step 1: Property Basics</h3>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Listing Title *</label>
              <input type="text" className="form-control" placeholder="e.g. Modern Apartment in DHA Phase 6" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} placeholder="Describe your property, highlights, rules, access..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-2 gap-3">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">City *</label>
                <input type="text" className="form-control" placeholder="Lahore" value={city} onChange={e => setCity(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Country *</label>
                <input type="text" className="form-control" placeholder="Pakistan" value={country} onChange={e => setCountry(e.target.value)} required />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Street Address</label>
              <input type="text" className="form-control" placeholder="123 Main Boulevard" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Property Type</label>
              <select className="form-control" value={propType} onChange={e => setPropType(e.target.value as PropertyType)}>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>

            <button type="button" className="btn btn-primary" onClick={() => { if (!title || !city || !country) { setError('Please fill title, city, and country.'); } else { setError(''); setStep(2); } }} style={{ alignSelf: 'flex-end', marginTop: '0.5rem' }}>
              Next <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: Details & Pricing */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Step 2: Capacity & Pricing</h3>

            <div className="grid grid-3 gap-3">
              {[
                { label: 'Bedrooms', value: bedrooms, set: setBedrooms, min: 0 },
                { label: 'Bathrooms', value: bathrooms, set: setBathrooms, min: 0 },
                { label: 'Max Guests', value: maxGuests, set: setMaxGuests, min: 1 },
              ].map(({ label, value, set, min }) => (
                <div key={label} className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{label}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button type="button" onClick={() => set(v => Math.max(min, v - 1))} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Minus size={14} /></button>
                    <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{value}</span>
                    <button type="button" onClick={() => set(v => v + 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Plus size={14} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-2 gap-3">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Currency *</label>
                <select className="form-control" value={currency} onChange={e => setCurrency(e.target.value)}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol}) – {c.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nightly Rate *</label>
                <input type="number" className="form-control" placeholder="e.g. 25000" value={pricePerNight} onChange={e => setPricePerNight(e.target.value)} required min="0" />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Property Images (URLs)</label>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Add links to your property photos (Unsplash, Cloudinary, etc.)</p>
              {imageUrls.map((url, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <input type="url" className="form-control" style={{ marginBottom: 0 }} placeholder={`Photo ${i + 1} URL (optional)`} value={url} onChange={e => updateImageUrl(i, e.target.value)} />
                  {imageUrls.length > 1 && (
                    <button type="button" onClick={() => removeImageField(i)} style={{ background: 'none', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '6px', padding: '0.4rem', cursor: 'pointer' }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              {imageUrls.length < 8 && (
                <button type="button" onClick={addImageField} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}>
                  <Plus size={12} /> Add Another Image
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}><ChevronLeft size={16} /> Back</button>
              <button type="button" className="btn btn-primary" onClick={() => { if (!pricePerNight) { setError('Please enter nightly rate.'); } else { setError(''); setStep(3); } }}>Next <ArrowRight size={16} /></button>
            </div>
          </div>
        )}

        {/* Step 3: Your Contact Info */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Step 3: Your Contact Details</h3>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Your Full Name *</label>
              <input type="text" className="form-control" placeholder="Ahmed Khan" value={ownerName} onChange={e => setOwnerName(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address *</label>
              <input type="email" className="form-control" placeholder="ahmed@example.com" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone Number</label>
              <input type="tel" className="form-control" placeholder="+92 300 1234567" value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--warning-light)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600 }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>Your listing will be reviewed by our team before going live. We'll contact you within 24 hours via the email provided.</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}><ChevronLeft size={16} /> Back</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

// ---- PROPERTY DETAIL VIEW ----
const PropertyDetail: React.FC<{
  property: Property;
  onBack: () => void;
}> = ({ property, onBack }) => {
  const [currentImg, setCurrentImg] = useState(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  const nights = checkIn && checkOut ? differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn)) : 0;
  const totalPrice = nights > 0 ? nights * property.price_per_night : 0;

  const images = property.images && property.images.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80'];

  const handleBookNow = () => {
    if (!checkIn || !checkOut || nights <= 0) {
      alert('Please select valid check-in and check-out dates.');
      return;
    }
    setBookingOpen(true);
  };

  if (bookingSuccess) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ width: '72px', height: '72px', backgroundColor: 'var(--success-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Check size={36} style={{ color: 'var(--success)' }} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.75rem' }}>Booking Request Sent!</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 0.5rem' }}>
          Your reservation for <strong>{property.title}</strong> has been submitted. Our team will confirm and reach out within 24 hours.
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>
          {format(parseISO(checkIn), 'dd MMM')} → {format(parseISO(checkOut), 'dd MMM yyyy')} · {nights} nights · {totalPrice.toLocaleString()} {property.currency}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={onBack}>Browse More</button>
          <button className="btn btn-primary" onClick={onBack}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
        <ChevronLeft size={16} /> Back to listings
      </button>

      {/* Image Gallery */}
      <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: '380px', marginBottom: '1.5rem' }}>
        <img src={images[currentImg]} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {images.length > 1 && (
          <>
            <button onClick={() => setCurrentImg(i => (i - 1 + images.length) % images.length)}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setCurrentImg(i => (i + 1) % images.length)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={18} />
            </button>
            <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
              {images.map((_, i) => (
                <button key={i} onClick={() => setCurrentImg(i)} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === currentImg ? 'white' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', padding: 0 }} />
              ))}
            </div>
          </>
        )}
        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div style={{ position: 'absolute', bottom: '40px', right: '12px', display: 'flex', gap: '4px' }}>
            {images.slice(0, 4).map((img, i) => (
              <div key={i} onClick={() => setCurrentImg(i)} style={{ width: '48px', height: '36px', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer', border: i === currentImg ? '2px solid white' : '2px solid transparent', opacity: i === currentImg ? 1 : 0.7 }}>
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
            {images.length > 4 && <div style={{ width: '48px', height: '36px', borderRadius: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>+{images.length - 4}</div>}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
        {/* Left: Details */}
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '0.5rem' }}>
            <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{property.property_type}</span>
            <span className={`badge ${property.status === 'listed' ? 'badge-success' : 'badge-secondary'}`} style={{ textTransform: 'capitalize' }}>{property.status}</span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>{property.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            <MapPin size={14} style={{ color: 'var(--primary)' }} />
            <span>{property.address && `${property.address}, `}{property.city}, {property.country}</span>
          </div>

          {/* Specs row */}
          <div style={{ display: 'flex', gap: '1.5rem', padding: '0.75rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '1.25rem' }}>
            {[
              { icon: <Bed size={16} />, label: `${property.bedrooms} Bedrooms` },
              { icon: <Bath size={16} />, label: `${property.bathrooms} Bathrooms` },
              { icon: <Users size={16} />, label: `${property.max_guests} Guests` },
            ].map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--primary)' }}>{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>

          {property.description && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>About this place</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9rem' }}>{property.description}</p>
            </div>
          )}

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>What this place offers</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {property.amenities.map(a => (
                  <div key={a} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--primary)' }}>{AMENITY_ICONS[a] || <Check size={14} />}</span>
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Booking Card */}
        <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: '80px' }}>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{property.price_per_night.toLocaleString()} {property.currency}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}> / night</span>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ padding: '0.75rem', borderRight: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Check-in</div>
                <input type="date" value={checkIn} min={today} onChange={e => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(''); }}
                  style={{ border: 'none', outline: 'none', fontSize: '0.85rem', fontWeight: 600, width: '100%', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ padding: '0.75rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Check-out</div>
                <input type="date" value={checkOut} min={checkIn || tomorrow} onChange={e => setCheckOut(e.target.value)}
                  style={{ border: 'none', outline: 'none', fontSize: '0.85rem', fontWeight: 600, width: '100%', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)' }} />
              </div>
            </div>
          </div>

          <button className="btn btn-primary w-full" style={{ padding: '0.875rem', fontSize: '0.95rem' }} onClick={handleBookNow}>
            <Calendar size={16} /> {nights > 0 ? `Reserve · ${totalPrice.toLocaleString()} ${property.currency}` : 'Check Availability'}
          </button>

          {nights > 0 && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>{property.price_per_night.toLocaleString()} {property.currency} × {nights} nights</span>
                <span>{totalPrice.toLocaleString()} {property.currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: '4px', marginTop: '4px' }}>
                <span>Total</span>
                <span>{totalPrice.toLocaleString()} {property.currency}</span>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <Shield size={11} style={{ display: 'inline', marginRight: '4px' }} />
            You won't be charged yet. Payment is confirmed offline.
          </div>

          {property.owner && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>Hosted by</div>
              <div style={{ color: 'var(--text-secondary)' }}>{property.owner.company_name || property.owner.profile?.full_name || 'Verified Host'}</div>
            </div>
          )}
        </div>
      </div>

      {bookingOpen && (
        <BookingModal
          property={property}
          checkIn={checkIn}
          checkOut={checkOut}
          onClose={() => setBookingOpen(false)}
          onSuccess={() => { setBookingOpen(false); setBookingSuccess(true); }}
        />
      )}
    </div>
  );
};

// ---- MAIN GUEST PORTAL ----
export const GuestPortal: React.FC = () => {
  const [view, setView] = useState<GuestView>('search');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [filterMin, setFilterMin] = useState('');
  const [filterMax, setFilterMax] = useState('');
  const [filterGuests, setFilterGuests] = useState('');

  useEffect(() => {
    api.getProperties()
      .then(all => setProperties(all.filter(p => p.status === 'listed')))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = properties.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.country.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
    const matchType = !filterType || p.property_type === filterType;
    const matchCurrency = !filterCurrency || p.currency === filterCurrency;
    const matchMin = !filterMin || p.price_per_night >= parseFloat(filterMin);
    const matchMax = !filterMax || p.price_per_night <= parseFloat(filterMax);
    const matchGuests = !filterGuests || p.max_guests >= parseInt(filterGuests);
    return matchSearch && matchType && matchCurrency && matchMin && matchMax && matchGuests;
  });

  if (view === 'list_property') {
    return <ListPropertyForm onBack={() => setView('search')} />;
  }

  if (view === 'detail' && selectedProperty) {
    return <PropertyDetail property={selectedProperty} onBack={() => setView('search')} />;
  }

  return (
    <div className="animate-fade">
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, hsl(243, 75%, 59%) 0%, hsl(172, 80%, 40%) 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '2.5rem 2rem',
        marginBottom: '1.5rem',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', position: 'relative' }}>Find Your Perfect Stay</h1>
        <p style={{ opacity: 0.85, marginBottom: '1.5rem', fontSize: '0.9rem', position: 'relative' }}>Browse premium properties — apartments, villas, cabins, and more</p>

        {/* Search Bar */}
        <div style={{ display: 'flex', maxWidth: '560px', margin: '0 auto', background: 'white', borderRadius: 'var(--radius-full)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '1rem', color: '#999' }}><Search size={18} /></div>
          <input
            type="text"
            placeholder="Search by city, country, or keyword..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', padding: '0.875rem 1rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.75rem', color: '#999' }}><X size={16} /></button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ padding: '0.875rem 1rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <select className="form-control" style={{ width: 'auto', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select className="form-control" style={{ width: 'auto', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }} value={filterCurrency} onChange={e => setFilterCurrency(e.target.value)}>
          <option value="">All Currencies</option>
          {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
        </select>
        <input type="number" className="form-control" placeholder="Min price" value={filterMin} onChange={e => setFilterMin(e.target.value)} style={{ width: '110px', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }} />
        <input type="number" className="form-control" placeholder="Max price" value={filterMax} onChange={e => setFilterMax(e.target.value)} style={{ width: '110px', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }} />
        <select className="form-control" style={{ width: 'auto', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }} value={filterGuests} onChange={e => setFilterGuests(e.target.value)}>
          <option value="">Any Guests</option>
          {[1,2,3,4,5,6,8,10].map(n => <option key={n} value={n}>{n}+ Guests</option>)}
        </select>
        {(filterType || filterCurrency || filterMin || filterMax || filterGuests) && (
          <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }} onClick={() => { setFilterType(''); setFilterCurrency(''); setFilterMin(''); setFilterMax(''); setFilterGuests(''); }}>
            <X size={12} /> Clear
          </button>
        )}
        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <strong>{filtered.length}</strong> {filtered.length === 1 ? 'property' : 'properties'} found
        </div>
      </div>

      {/* Property Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          Loading properties...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Search size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
          <h3>No properties found</h3>
          <p style={{ fontSize: '0.9rem' }}>Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-3 gap-6">
          {filtered.map(p => {
            const images = p.images && p.images.length > 0 ? p.images : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'];
            return (
              <div
                key={p.id}
                className="card"
                style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)' }}
                onClick={() => { setSelectedProperty(p); setView('detail'); }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
              >
                <div style={{ position: 'relative', height: '200px' }}>
                  <img src={images[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span className={`badge ${p.property_type === 'villa' ? 'badge-info' : 'badge-secondary'}`} style={{ position: 'absolute', top: '10px', left: '10px', textTransform: 'capitalize', fontSize: '0.65rem' }}>{p.property_type}</span>
                  {images.length > 1 && (
                    <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.65rem', borderRadius: '4px', padding: '2px 6px', fontWeight: 600 }}>
                      +{images.length - 1} photos
                    </span>
                  )}
                </div>
                <div style={{ padding: '1rem' }}>
                  <h4 style={{ fontWeight: 700, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    <MapPin size={11} style={{ color: 'var(--primary)' }} />
                    <span>{p.city}, {p.country}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    <span>{p.bedrooms} bed</span>
                    <span>{p.bathrooms} bath</span>
                    <span>{p.max_guests} guests</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>{p.price_per_night.toLocaleString()}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}> {p.currency}/night</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                      <Star size={12} fill="#f59e0b" /> 4.8
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Become a Host CTA */}
      <div style={{
        marginTop: '3rem',
        background: 'linear-gradient(135deg, hsl(220, 30%, 12%) 0%, hsl(243, 40%, 25%) 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '2.5rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Have a property to rent?</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>List it on Mortal Portal and reach thousands of guests worldwide.</p>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem' }}>
            {['Free to list', 'Verified guests', '24/7 support'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem' }}>
                <Check size={13} style={{ color: 'hsl(172, 80%, 60%)' }} /> {t}
              </div>
            ))}
          </div>
        </div>
        <button className="btn" onClick={() => setView('list_property')} style={{ backgroundColor: 'white', color: 'hsl(243, 75%, 59%)', fontWeight: 700, padding: '0.875rem 1.75rem', whiteSpace: 'nowrap', flexShrink: 0, border: 'none' }}>
          <Home size={16} /> List Your Property
        </button>
      </div>
    </div>
  );
};
