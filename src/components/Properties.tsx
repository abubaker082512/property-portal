import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/supabase';
import type { Property, PropertyStatus, PropertyType, CommissionType, PropertyOwner } from '../types';
import { 
  Building, Plus, Edit2, Trash2, X, Check, 
  MapPin
} from 'lucide-react';

const AMENITIES_LIST = [
  'WiFi', 'Pool', 'Air Conditioning', 'Hot Tub', 
  'Kitchen', 'Fireplace', 'Gym', 'Parking', 
  'Beach View', 'Pet Friendly', 'Balcony', 'Elevator'
];

export const Properties: React.FC = () => {
  const { user } = useAuth();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  
  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [pricePerNight, setPricePerNight] = useState('');
  const [commissionType, setCommissionType] = useState<CommissionType>('percentage');
  const [commissionValue, setCommissionValue] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [maxGuests, setMaxGuests] = useState('2');
  const [status, setStatus] = useState<PropertyStatus>('listed');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [ownerId, setOwnerId] = useState('');
  
  const [formError, setFormError] = useState('');

  const fetchPropertiesAndOwners = async () => {
    try {
      setLoading(true);
      const [allProps, allOwners] = await Promise.all([
        api.getProperties(),
        api.getOwners()
      ]);

      setOwners(allOwners);

      if (user?.role === 'owner') {
        setProperties(allProps.filter(p => p.owner?.profile_id === user.id));
      } else {
        setProperties(allProps);
      }
    } catch (err) {
      console.error('Failed to fetch property details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertiesAndOwners();
  }, [user]);

  // Open modal for NEW property
  const openNewModal = () => {
    setEditingProperty(null);
    setTitle('');
    setDescription('');
    setAddress('');
    setCity('');
    setState('');
    setCountry('');
    setZipCode('');
    setCurrency('USD');
    setPricePerNight('');
    setCommissionType('percentage');
    setCommissionValue('10'); // Default 10%
    setPropertyType('apartment');
    setBedrooms('1');
    setBathrooms('1');
    setMaxGuests('2');
    setStatus('listed');
    setSelectedAmenities([]);
    setImageUrl('');
    setFormError('');
    
    // Auto-select owner if current user is owner
    if (user?.role === 'owner') {
      const matchOwner = owners.find(o => o.profile_id === user.id);
      setOwnerId(matchOwner?.id || '');
    } else {
      setOwnerId(owners[0]?.id || '');
    }

    setModalOpen(true);
  };

  // Open modal for EDIT property
  const openEditModal = (prop: Property) => {
    setEditingProperty(prop);
    setTitle(prop.title);
    setDescription(prop.description || '');
    setAddress(prop.address);
    setCity(prop.city);
    setState(prop.state || '');
    setCountry(prop.country);
    setZipCode(prop.zip_code || '');
    setCurrency(prop.currency);
    setPricePerNight(prop.price_per_night.toString());
    setCommissionType(prop.commission_type);
    setCommissionValue(prop.commission_value.toString());
    setPropertyType(prop.property_type);
    setBedrooms(prop.bedrooms.toString());
    setBathrooms(prop.bathrooms.toString());
    setMaxGuests(prop.max_guests.toString());
    setStatus(prop.status);
    setSelectedAmenities(prop.amenities);
    setImageUrl(prop.images && prop.images.length > 0 ? prop.images[0] : '');
    setOwnerId(prop.owner_id);
    setFormError('');
    setModalOpen(true);
  };

  const closeFormModal = () => {
    setModalOpen(false);
    setEditingProperty(null);
    setFormError('');
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this property listing? All associated bookings will be impacted.')) {
      return;
    }
    try {
      await api.deleteProperty(id);
      fetchPropertiesAndOwners();
    } catch (err: any) {
      alert(err.message || 'Failed to delete property.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Form validation
    if (!title.trim() || !address.trim() || !city.trim() || !country.trim() || !ownerId) {
      setFormError('Please fill in all required fields (Title, Address, City, Country, and Owner).');
      return;
    }

    const price = parseFloat(pricePerNight);
    const commVal = parseFloat(commissionValue);

    if (isNaN(price) || price < 0) {
      setFormError('Price per night must be a valid positive number.');
      return;
    }
    if (isNaN(commVal) || commVal < 0) {
      setFormError('Commission value must be a valid positive number.');
      return;
    }

    const payload = {
      owner_id: ownerId,
      title,
      description,
      address,
      city,
      state,
      country,
      zip_code: zipCode,
      currency,
      price_per_night: price,
      commission_type: commissionType,
      commission_value: commVal,
      property_type: propertyType,
      bedrooms: parseInt(bedrooms),
      bathrooms: parseFloat(bathrooms),
      max_guests: parseInt(maxGuests),
      amenities: selectedAmenities,
      images: imageUrl.trim() ? [imageUrl.trim()] : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80'],
      status
    };

    try {
      if (editingProperty) {
        await api.updateProperty(editingProperty.id, payload);
      } else {
        await api.createProperty(payload);
      }
      closeFormModal();
      fetchPropertiesAndOwners();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save property listing.');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade">
      {/* List Header */}
      <div className="flex justify-between align-center">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Listed Portfolios</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Create and manage property cards, pricing, and commissions.</p>
        </div>
        
        {/* Only Admin, Staff, or verified Owners can add listings */}
        <button className="btn btn-primary" onClick={openNewModal}>
          <Plus size={18} /> Add Property
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <Building className="animate-spin" style={{ color: 'var(--primary)', animation: 'spin 2s linear infinite', margin: '0 auto 1rem' }} size={32} />
          <span style={{ color: 'var(--text-secondary)' }}>Loading properties portfolio...</span>
        </div>
      ) : properties.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Building size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h4>No Properties Registered</h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Get started by adding your first rental unit listing.</p>
        </div>
      ) : (
        <div className="grid grid-3 gap-6">
          {properties.map(p => (
            <div key={p.id} className="card flex flex-col" style={{ padding: 0, overflow: 'hidden', height: '100%' }}>
              {/* Header Image */}
              <div style={{ position: 'relative', height: '180px', width: '100%' }}>
                <img 
                  src={p.images && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'} 
                  alt={p.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span 
                  className={`badge ${
                    p.status === 'listed' ? 'badge-success' : 
                    p.status === 'maintenance' ? 'badge-warning' : 'badge-secondary'
                  }`}
                  style={{ position: 'absolute', top: '12px', right: '12px', boxShadow: 'var(--shadow-sm)' }}
                >
                  {p.status}
                </span>

                <div 
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    padding: '0.25rem 0.625rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    backdropFilter: 'blur(4px)',
                    fontWeight: 600
                  }}
                >
                  {p.property_type.toUpperCase()}
                </div>
              </div>

              {/* Card Contents */}
              <div className="p-4 flex flex-col" style={{ flexGrow: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={p.title}>
                    {p.title}
                  </h4>
                </div>

                <div className="flex align-center gap-1" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <MapPin size={12} style={{ color: 'var(--primary)' }} />
                  <span>{p.city}, {p.country}</span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.4rem' }}>
                  {p.description || 'No description provided.'}
                </p>

                {/* Specs */}
                <div 
                  style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    fontSize: '0.75rem', 
                    color: 'var(--text-muted)', 
                    borderTop: '1px solid var(--border)', 
                    borderBottom: '1px solid var(--border)',
                    padding: '0.5rem 0',
                    marginTop: '1rem'
                  }}
                >
                  <span><strong>{p.bedrooms}</strong> Bed</span>
                  <span><strong>{p.bathrooms}</strong> Bath</span>
                  <span><strong>{p.max_guests}</strong> Guests</span>
                </div>

                {/* Owner info */}
                {p.owner && (
                  <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Owned by:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {p.owner.company_name || p.owner.profile?.full_name || 'Anonymous'}
                    </strong>
                  </div>
                )}

                {/* Price and commission flex */}
                <div className="flex justify-between align-center" style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>NIGHTLY RATE</div>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--primary)', fontWeight: 800 }}>
                      {p.price_per_night} {p.currency}
                    </strong>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>COMMISSION</div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 700 }}>
                      {p.commission_type === 'percentage' 
                        ? `${p.commission_value}%` 
                        : `${p.commission_value} ${p.currency}`
                      }
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2" style={{ borderTop: '1px solid var(--border)', marginTop: '1rem', paddingTop: '0.75rem' }}>
                  <button 
                    className="btn btn-secondary w-full" 
                    style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                    onClick={() => openEditModal(p)}
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Property Creator / Editor Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '95vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="drawer-header" style={{ borderBottom: 'none', padding: 0, marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>
                  {editingProperty ? 'Edit Property Listing' : 'List New Rental Unit'}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Set base rates, owner commissions, and structural metrics.
                </p>
              </div>
              <button onClick={closeFormModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {formError && (
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 600 }}>
                  {formError}
                </div>
              )}

              {/* Owner selection (Only staff sees this list. If current user is owner, they can only map to themselves) */}
              <div className="form-group">
                <label className="form-label">Property Owner *</label>
                {user?.role === 'owner' ? (
                  <input
                    type="text"
                    className="form-control"
                    disabled
                    value={owners.find(o => o.profile_id === user.id)?.company_name || user.full_name}
                  />
                ) : (
                  <select 
                    className="form-control"
                    value={ownerId}
                    onChange={e => setOwnerId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Owner --</option>
                    {owners.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.company_name || o.profile?.full_name} ({o.profile?.full_name})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Title & Description */}
              <div className="form-group">
                <label className="form-label">Listing Title *</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. Luxury Penthouse Suite with Skyline Views"
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Property Description</label>
                <textarea 
                  className="form-control"
                  rows={2}
                  placeholder="Provide details about the stay, rules, location, amenities, etc..."
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              {/* Geography Details */}
              <div className="grid grid-3 gap-3">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Street Address *</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="123 Ocean Drive"
                    value={address} 
                    onChange={e => setAddress(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Miami"
                    value={city} 
                    onChange={e => setCity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-3 gap-3">
                <div className="form-group">
                  <label className="form-label">State / Region</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Florida"
                    value={state} 
                    onChange={e => setState(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Country *</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="United States"
                    value={country} 
                    onChange={e => setCountry(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Zip Code</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="33139"
                    value={zipCode} 
                    onChange={e => setZipCode(e.target.value)}
                  />
                </div>
              </div>

              {/* Pricing, Currency & Commission */}
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Rate & Portal Commission Rules</h4>
                
                <div className="grid grid-3 gap-3">
                  <div className="form-group">
                    <label className="form-label">Nightly Rate *</label>
                    <input 
                      type="number" 
                      className="form-control"
                      placeholder="150"
                      value={pricePerNight} 
                      onChange={e => setPricePerNight(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Currency *</label>
                    <select 
                      className="form-control"
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="AED">AED (د.إ)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Listing Status</label>
                    <select 
                      className="form-control"
                      value={status}
                      onChange={e => setStatus(e.target.value as PropertyStatus)}
                    >
                      <option value="listed">Listed (Active)</option>
                      <option value="unlisted">Unlisted (Draft)</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-2 gap-3" style={{ marginTop: '0.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Commission Model</label>
                    <select 
                      className="form-control"
                      value={commissionType}
                      onChange={e => setCommissionType(e.target.value as CommissionType)}
                    >
                      <option value="percentage">Percentage (%) of Total Price</option>
                      <option value="fixed">Fixed Rate (amount per night)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Commission Value ({commissionType === 'percentage' ? '%' : currency})
                    </label>
                    <input 
                      type="number" 
                      className="form-control"
                      placeholder={commissionType === 'percentage' ? '10' : '25'}
                      value={commissionValue} 
                      onChange={e => setCommissionValue(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Specs & Types */}
              <div className="grid grid-4 gap-3">
                <div className="form-group">
                  <label className="form-label">Property Type</label>
                  <select 
                    className="form-control"
                    value={propertyType}
                    onChange={e => setPropertyType(e.target.value as PropertyType)}
                  >
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="villa">Villa</option>
                    <option value="condo">Condo</option>
                    <option value="cottage">Cottage</option>
                    <option value="cabin">Cabin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Bedrooms</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={bedrooms}
                    onChange={e => setBedrooms(e.target.value)}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bathrooms</label>
                  <input 
                    type="number" 
                    step="0.5"
                    className="form-control" 
                    value={bathrooms}
                    onChange={e => setBathrooms(e.target.value)}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Max Guests</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={maxGuests}
                    onChange={e => setMaxGuests(e.target.value)}
                    min="1"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div className="form-group">
                <label className="form-label">Cover Image URL</label>
                <input 
                  type="url" 
                  className="form-control"
                  placeholder="https://images.unsplash.com/... or leave blank for a default"
                  value={imageUrl} 
                  onChange={e => setImageUrl(e.target.value)}
                />
              </div>

              {/* Amenities checkboxes */}
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label className="form-label">Select Amenities</label>
                <div className="grid grid-4 gap-2" style={{ marginTop: '0.25rem' }}>
                  {AMENITIES_LIST.map(amenity => {
                    const isChecked = selectedAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--border)'}`,
                          backgroundColor: isChecked ? 'var(--primary-light)' : 'var(--bg-card)',
                          color: isChecked ? 'var(--primary)' : 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <span>{amenity}</span>
                        {isChecked && <Check size={12} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeFormModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingProperty ? 'Save Changes' : 'Publish Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
