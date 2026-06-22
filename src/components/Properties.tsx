import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, supabase, isDemoMode } from '../lib/supabase';
import type { Property, PropertyStatus, PropertyType, CommissionType, PropertyOwner, Profile } from '../types';
import { 
  Building, Plus, Edit2, Trash2, X, Check, UserPlus,
  MapPin, ChevronLeft, ChevronRight, Images, Upload, Loader, Users, ShieldCheck, ArrowUpRight,
  Link2, Sparkles, AlertCircle, ExternalLink
} from 'lucide-react';

const AMENITIES_LIST = [
  'WiFi', 'Pool', 'Air Conditioning', 'Hot Tub', 
  'Kitchen', 'Fireplace', 'Gym', 'Parking', 
  'Beach View', 'Pet Friendly', 'Balcony', 'Elevator'
];

// Small image carousel for property cards
const ImageCarousel: React.FC<{ images: string[]; title: string; status: string; propertyType: string }> = ({ images, title, status, propertyType }) => {
  const [cur, setCur] = useState(0);
  const fallbackImage = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';
  const displayImages = images && images.length > 0 ? images : [fallbackImage];

  return (
    <div style={{ position: 'relative', height: '180px', width: '100%', overflow: 'hidden' }}>
      <img src={displayImages[cur]} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' }} />
      <span className={`badge ${status === 'listed' ? 'badge-success' : status === 'maintenance' ? 'badge-warning' : 'badge-secondary'}`}
        style={{ position: 'absolute', top: '12px', right: '12px', boxShadow: 'var(--shadow-sm)' }}>
        {status}
      </span>
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', backdropFilter: 'blur(4px)', fontWeight: 600 }}>
        {propertyType.toUpperCase()}
      </div>
      {displayImages.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); setCur(i => (i - 1 + displayImages.length) % displayImages.length); }}
            style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(0,0,0,0.45)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={14} />
          </button>
          <button onClick={e => { e.stopPropagation(); setCur(i => (i + 1) % displayImages.length); }}
            style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(0,0,0,0.45)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={14} />
          </button>
          <div style={{ position: 'absolute', bottom: '8px', right: '12px', display: 'flex', gap: '4px' }}>
            {displayImages.map((_, i) => (
              <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: i === cur ? 'white' : 'rgba(255,255,255,0.5)' }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

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
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [ownerId, setOwnerId] = useState('');

  // Add/Manage Owners Modal States
  const [ownersModalOpen, setOwnersModalOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [promoteMode, setPromoteMode] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerCompanyName, setNewOwnerCompanyName] = useState('');
  const [newOwnerTaxId, setNewOwnerTaxId] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [editingOwner, setEditingOwner] = useState<PropertyOwner | null>(null);
  const [ownersModalError, setOwnersModalError] = useState('');
  const [ownersModalSuccess, setOwnersModalSuccess] = useState('');
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  
  const [formError, setFormError] = useState('');
  const [uploading, setUploading] = useState(false);

  // ── Airbnb Import Modal States ──────────────────────────────────────────────
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importPreview, setImportPreview] = useState<{
    title: string;
    description: string;
    city: string;
    country: string;
    address: string;
    bedrooms: string;
    bathrooms: string;
    maxGuests: string;
    pricePerNight: string;
    propertyType: string;
    images: string[];
    amenities: string[];
    sourceUrl: string;
  } | null>(null);

  const fetchProfilesForOwners = async () => {
    try {
      setLoadingProfiles(true);
      const allProfiles = await api.getProfiles();
      setProfiles(allProfiles);
    } catch (err) {
      console.error('Failed to load profiles:', err);
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    if (ownersModalOpen) {
      fetchProfilesForOwners();
    }
  }, [ownersModalOpen]);

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOwnersModalError('');
    setOwnersModalSuccess('');

    try {
      if (editingOwner) {
        await api.updateOwner(editingOwner.id, {
          companyName: newOwnerCompanyName,
          taxId: newOwnerTaxId
        });
        
        const allOwners = await api.getOwners();
        setOwners(allOwners);
        setOwnersModalSuccess('Owner details updated successfully!');
        cancelOwnerEdit();
      } else {
        const payload: { fullName?: string; companyName?: string; taxId?: string; phone?: string; profileId?: string } = {
          companyName: newOwnerCompanyName,
          taxId: newOwnerTaxId
        };
        
        if (promoteMode) {
          if (!selectedProfileId) {
            setOwnersModalError('Please select a profile to promote.');
            return;
          }
          payload.profileId = selectedProfileId;
        } else {
          if (!newOwnerName.trim()) {
            setOwnersModalError("Please enter the owner's full name.");
            return;
          }
          payload.fullName = newOwnerName;
          payload.phone = newOwnerPhone;
        }
        
        const created = await api.createOwner(payload);
        const allOwners = await api.getOwners();
        setOwners(allOwners);
        setOwnerId(created.id);
        
        setOwnersModalSuccess(`Owner "${created.profile?.full_name}" registered successfully!`);
        
        setNewOwnerName('');
        setNewOwnerCompanyName('');
        setNewOwnerTaxId('');
        setNewOwnerPhone('');
        setSelectedProfileId('');
        
        setTimeout(() => {
          setOwnersModalOpen(false);
          setOwnersModalSuccess('');
        }, 1200);
      }
    } catch (err: any) {
      console.error('Owner submit error:', err);
      setOwnersModalError(err.message || 'Failed to submit owner data.');
    }
  };

  const handleOwnerDelete = async (oId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete owner "${name}"? All properties associated with this owner will be deleted as well!`)) {
      return;
    }
    setOwnersModalError('');
    setOwnersModalSuccess('');
    try {
      await api.deleteOwner(oId);
      const allOwners = await api.getOwners();
      setOwners(allOwners);
      
      if (ownerId === oId) {
        setOwnerId('');
      }
      
      setOwnersModalSuccess('Owner deleted successfully.');
    } catch (err: any) {
      setOwnersModalError(err.message || 'Failed to delete owner.');
    }
  };

  const startOwnerEdit = (o: PropertyOwner) => {
    setEditingOwner(o);
    setNewOwnerName(o.profile?.full_name || '');
    setNewOwnerCompanyName(o.company_name || '');
    setNewOwnerTaxId(o.tax_id || '');
    setNewOwnerPhone(o.profile?.phone || '');
    setPromoteMode(false);
  };

  // ── Airbnb Scraper ──────────────────────────────────────────────────────────
  const scrapeAirbnbListing = async () => {
    const url = importUrl.trim();
    if (!url) { setImportError('Please paste an Airbnb listing URL.'); return; }

    // Validate it looks like an Airbnb URL
    if (!url.includes('airbnb.') && !url.includes('abnb.me')) {
      setImportError('Please enter a valid Airbnb listing URL (e.g. https://www.airbnb.com/rooms/12345).');
      return;
    }

    setImportLoading(true);
    setImportError('');
    setImportPreview(null);

    try {
      // Fetch through CORS proxy — allorigins wraps response in { contents: "..." }
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
      const json = await res.json();
      const html: string = json.contents || '';

      if (!html || html.length < 200) {
        throw new Error('Could not retrieve listing data. Airbnb may have blocked the request. Try again or fill manually.');
      }

      // --- Parse with DOMParser ---
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const getOg = (prop: string) =>
        doc.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') ||
        doc.querySelector(`meta[name="${prop}"]`)?.getAttribute('content') || '';

      // --- Title ---
      let title = getOg('og:title') || doc.title || '';
      // Strip " - Airbnb" suffixes
      title = title.replace(/\s*[-|]\s*Airbnb.*$/i, '').trim();

      // Description
      const description = getOg('og:description') || getOg('description') || '';

      // Images
      const images: string[] = [];
      doc.querySelectorAll('meta[property="og:image"], meta[property="og:image:secure_url"]').forEach(n => {
        const src = n.getAttribute('content') || '';
        if (src && !images.includes(src)) images.push(src);
      });
      doc.querySelectorAll('img[src*="muscache.com"], img[src*="airbnb"]').forEach(n => {
        const src = n.getAttribute('src') || '';
        if (src && !images.includes(src) && src.startsWith('http')) images.push(src);
      });

      // ── JSON-LD ───────────────────────────────────────────────────────────
      let jsonLd: any = null;
      doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
        if (jsonLd) return;
        try {
          const parsed = JSON.parse(script.textContent || '');
          if (parsed['@type'] === 'LodgingBusiness' || parsed.address) { jsonLd = parsed; return; }
          if (Array.isArray(parsed)) {
            const found = parsed.find((p: any) => p.address || p['@type'] === 'LodgingBusiness');
            if (found) jsonLd = found;
          }
        } catch { /* skip */ }
      });

      // ── Mine Airbnb embedded JS data blobs ───────────────────────────────
      let embeddedData: any = null;
      const scriptTags = Array.from(doc.querySelectorAll('script:not([src])'));
      for (const s of scriptTags) {
        const text = s.textContent || '';
        const match = text.match(/"listing"\s*:\s*(\{[^<]{50,})/);
        if (match) {
          try {
            let depth = 0, start = match.index! + match[0].indexOf('{'), end = start;
            for (; end < text.length; end++) {
              if (text[end] === '{') depth++;
              else if (text[end] === '}') { depth--; if (depth === 0) break; }
            }
            embeddedData = JSON.parse(text.slice(start, end + 1));
            if (embeddedData) break;
          } catch { /* skip */ }
        }
      }

      // ── Extract fields ────────────────────────────────────────────────────
      let city    = jsonLd?.address?.addressLocality || jsonLd?.address?.addressRegion || '';
      let country = jsonLd?.address?.addressCountry || '';
      let address = jsonLd?.address?.streetAddress || '';

      if (embeddedData) {
        city    = city    || embeddedData.city || embeddedData.public_address || '';
        country = country || embeddedData.country_name || embeddedData.country || '';
        address = address || embeddedData.public_address || '';
      }

      if (!city) {
        const m = title.match(/\bin\s+([\w\s]+?)(?:,\s*([\w\s]+))?$/i);
        if (m) { city = m[1]?.trim() || ''; country = m[2]?.trim() || ''; }
      }

      let bedrooms  = jsonLd?.numberOfRooms ? String(jsonLd.numberOfRooms) : String(embeddedData?.bedrooms || '');
      let bathrooms = String(embeddedData?.bathrooms || '');
      let maxGuests = String(embeddedData?.person_capacity || embeddedData?.guests_included || '');

      const searchText = `${description} ${title}`;
      if (!bedrooms)  { const m = searchText.match(/(\d+)\s*bed(?:room)?s?/i);            if (m) bedrooms  = m[1]; }
      if (!bathrooms) { const m = searchText.match(/(\d+(?:\.\d+)?)\s*bath(?:room)?s?/i); if (m) bathrooms = m[1]; }
      if (!maxGuests) { const m = searchText.match(/(\d+)\s*guests?/i);                   if (m) maxGuests = m[1]; }

      let pricePerNight = '';
      const priceMeta = getOg('product:price:amount') || getOg('price');
      if (priceMeta) pricePerNight = String(Math.round(parseFloat(priceMeta)));
      if (!pricePerNight && embeddedData?.price) pricePerNight = String(Math.round(parseFloat(String(embeddedData.price))));
      if (!pricePerNight) {
        const m = html.match(/"price"\s*:\s*"?([\d.]+)"?/);
        if (m) pricePerNight = String(Math.round(parseFloat(m[1])));
      }

      const lower = `${title} ${description}`.toLowerCase();
      let propertyType = 'apartment';
      if (/\bvilla\b/.test(lower))              propertyType = 'villa';
      else if (/\bcabin\b/.test(lower))         propertyType = 'cabin';
      else if (/\bcottage\b/.test(lower))       propertyType = 'cottage';
      else if (/\bhouse\b|\bhome\b/.test(lower)) propertyType = 'house';
      else if (/\bcondo\b/.test(lower))         propertyType = 'condo';

      const amenities: string[] = [];
      const amenityMap: Record<string, string> = {
        wifi: 'WiFi', pool: 'Pool', 'air condition': 'Air Conditioning',
        'hot tub': 'Hot Tub', kitchen: 'Kitchen', fireplace: 'Fireplace',
        gym: 'Gym', parking: 'Parking', beach: 'Beach View',
        'pet': 'Pet Friendly', balcony: 'Balcony', elevator: 'Elevator'
      };
      const scanText = lower + ' ' + html.substring(0, 80000).toLowerCase();
      Object.entries(amenityMap).forEach(([kw, label]) => {
        if (scanText.includes(kw)) amenities.push(label);
      });

      setImportPreview({
        title:         title || 'Imported Airbnb Listing',
        description,
        city,
        country,
        address,
        bedrooms:      String(bedrooms  || '1'),
        bathrooms:     String(bathrooms || '1'),
        maxGuests:     String(maxGuests || '2'),
        pricePerNight: pricePerNight || '',
        propertyType,
        images:        images.slice(0, 8),
        amenities,
        sourceUrl:     url
      });

    } catch (err: any) {
      console.error('Airbnb scrape error:', err);
      const msg = err.message || 'Failed to fetch listing data.';
      setImportError(err.name === 'AbortError' || msg.includes('AbortError')
        ? 'Request timed out. Airbnb may be slow. Please try again.'
        : msg
      );
    } finally {
      setImportLoading(false);
    }
  };

  const applyImportedData = () => {
    if (!importPreview) return;
    // Reset the property form and fill with scraped data
    setEditingProperty(null);
    setTitle(importPreview.title);
    setDescription(importPreview.description);
    setAddress(importPreview.address);
    setCity(importPreview.city);
    setState('');
    setCountry(importPreview.country);
    setZipCode('');
    setCurrency('USD');
    setPricePerNight(importPreview.pricePerNight);
    setCommissionType('percentage');
    setCommissionValue('10');
    setPropertyType(importPreview.propertyType as any);
    setBedrooms(importPreview.bedrooms);
    setBathrooms(importPreview.bathrooms);
    setMaxGuests(importPreview.maxGuests);
    setStatus('listed');
    setSelectedAmenities(importPreview.amenities);
    setImageUrls(importPreview.images);
    setFormError('');
    if (user?.role === 'owner') {
      const matchOwner = owners.find(o => o.profile_id === user.id);
      setOwnerId(matchOwner?.id || '');
    } else {
      setOwnerId(owners[0]?.id || '');
    }
    // Close import modal and open property form
    setImportModalOpen(false);
    setImportPreview(null);
    setImportUrl('');
    setModalOpen(true);
  };

  const cancelOwnerEdit = () => {
    setEditingOwner(null);
    setNewOwnerName('');
    setNewOwnerCompanyName('');
    setNewOwnerTaxId('');
    setNewOwnerPhone('');
    setSelectedProfileId('');
  };

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
    setImageUrls([]);
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
    setImageUrls(prop.images || []);
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

  const handleToggleStatus = async (id: string, currentStatus: PropertyStatus) => {
    const newStatus: PropertyStatus = currentStatus === 'listed' ? 'unlisted' : 'listed';
    try {
      await api.updateProperty(id, { status: newStatus });
      setProperties(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    } catch (err: any) {
      alert(err.message || 'Failed to update property status.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (imageUrls.length + files.length > 8) {
      alert('You can upload up to 8 photos per property.');
      return;
    }

    setUploading(true);
    setFormError('');

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (isDemoMode) {
          // Sandbox Mode fallback: Convert to Base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
          });

          if (base64.length > 1.5 * 1024 * 1024) {
            alert(`File "${file.name}" is too large for fallback demo mode. Please upload photos under 1.5MB.`);
            continue;
          }
          uploadedUrls.push(base64);
        } else {
          // Production Mode: Upload to Supabase Storage Bucket
          if (!supabase) throw new Error('Supabase client not initialized.');

          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
          const filePath = `${user?.id || 'public'}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('property-media')
            .upload(filePath, file, { cacheControl: '3600', upsert: true });

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from('property-media')
            .getPublicUrl(filePath);

          if (!data || !data.publicUrl) throw new Error('Failed to retrieve public upload link.');
          uploadedUrls.push(data.publicUrl);
        }
      }

      setImageUrls(prev => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      console.error('File upload error:', err);
      setFormError(err.message || 'Image upload failed. Ensure the "property-media" storage bucket is public.');
    } finally {
      setUploading(false);
    }
  };

  const removeImageIndex = (indexToRemove: number) => {
    setImageUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
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
      images: imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80'],
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
        
        <div className="flex gap-2" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <button
              className="btn btn-secondary"
              onClick={() => { setOwnersModalOpen(true); cancelOwnerEdit(); setOwnersModalError(''); setOwnersModalSuccess(''); }}
            >
              <Users size={18} /> Manage Owners
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => { setImportModalOpen(true); setImportUrl(''); setImportError(''); setImportPreview(null); }}
            style={{ background: 'linear-gradient(135deg, #ff5a5f22, #fc642d22)', borderColor: '#ff5a5f55', color: '#ff5a5f', fontWeight: 700 }}
          >
            <Link2 size={16} /> Import from Airbnb
          </button>
          <button className="btn btn-primary" onClick={openNewModal}>
            <Plus size={18} /> Add Property
          </button>
        </div>
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
          {properties.map(p => {
            const images = p.images && p.images.length > 0 ? p.images : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'];
            return (
              <div key={p.id} className="card flex flex-col" style={{ padding: 0, overflow: 'hidden', height: '100%' }}>
                {/* Header Image with gallery dots */}
                <ImageCarousel images={images} title={p.title} status={p.status} propertyType={p.property_type} />

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
                      onClick={() => handleToggleStatus(p.id, p.status)}
                      className={`btn`}
                      style={{ 
                        padding: '0.4rem 0.75rem', 
                        fontSize: '0.75rem', 
                        flexGrow: 1,
                        backgroundColor: p.status === 'listed' ? 'rgba(0,0,0,0.05)' : 'var(--primary)',
                        color: p.status === 'listed' ? 'var(--text-secondary)' : 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                    >
                      {p.status === 'listed' ? 'Unlist' : 'List Property'}
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                      onClick={() => openEditModal(p)}
                      title="Edit Property"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}
                      onClick={() => handleDelete(p.id)}
                      title="Delete Property"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Property Creator / Editor Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
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

              {/* Owner selection */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Property Owner *</label>
                  {user?.role !== 'owner' && (
                    <button
                      type="button"
                      onClick={() => { setOwnersModalOpen(true); cancelOwnerEdit(); setOwnersModalError(''); setOwnersModalSuccess(''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      <UserPlus size={12} /> Add / Manage Owners
                    </button>
                  )}
                </div>
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
                      <option value="PKR">PKR (₨) – Pakistani Rupee</option>
                      <option value="USD">USD ($) – US Dollar</option>
                      <option value="EUR">EUR (€) – Euro</option>
                      <option value="AED">AED (د.إ) – UAE Dirham</option>
                      <option value="GBP">GBP (£) – British Pound</option>
                      <option value="INR">INR (₹) – Indian Rupee</option>
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

              {/* Multiple Image Upload Zone */}
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Images size={14} /> Property Photos
                </label>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Upload high-quality photos for your property. Drag and drop or browse files. First photo will be the cover image (Max 8 photos).
                </p>

                {/* Upload Card Dropzone */}
                <div 
                  onClick={() => document.getElementById('media-upload-input')?.click()}
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '2rem 1.5rem',
                    textAlign: 'center',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    transition: 'all var(--transition-fast)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={e => { if (!uploading) e.currentTarget.style.borderColor = 'var(--primary)'; }}
                  onMouseLeave={e => { if (!uploading) e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <input 
                    type="file" 
                    id="media-upload-input" 
                    multiple 
                    accept="image/*" 
                    style={{ display: 'none' }}
                    disabled={uploading}
                    onChange={handleImageUpload}
                  />
                  {uploading ? (
                    <>
                      <Loader className="animate-spin" size={24} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Uploading property media...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={24} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Click to upload photos</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Supports JPG, PNG, WEBP (Max 8 files)</span>
                    </>
                  )}
                </div>

                {/* Thumbnail Previews */}
                {imageUrls.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '1rem' }}>
                    {imageUrls.map((url, index) => (
                      <div 
                        key={index} 
                        style={{ 
                          position: 'relative', 
                          height: '90px', 
                          borderRadius: '8px', 
                          overflow: 'hidden', 
                          border: index === 0 ? '2px solid var(--primary)' : '1px solid var(--border)',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <img src={url} alt={`preview-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {index === 0 && (
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--primary)', color: 'white', fontSize: '0.6rem', textAlign: 'center', padding: '1px 0', fontWeight: 700 }}>
                            COVER
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImageIndex(index)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(239, 68, 68, 0.85)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0
                          }}
                          title="Delete photo"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Amenities checkboxes */}
              <div className="form-group" style={{ marginTop: '1.25rem' }}>
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
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {editingProperty ? 'Save Changes' : 'Publish Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ OWNERS MANAGEMENT MODAL ============ */}
      {ownersModalOpen && (
        <div className="modal-overlay" onClick={() => setOwnersModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} style={{ color: 'var(--primary)' }} /> Owner Management
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Register new property owners or manage existing ones. Owners are linked to a profile account.
                </p>
              </div>
              <button onClick={() => setOwnersModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Feedback */}
            {ownersModalError && (
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 600 }}>
                {ownersModalError}
              </div>
            )}
            {ownersModalSuccess && (
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--success-light)', color: 'var(--success)', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={15} /> {ownersModalSuccess}
              </div>
            )}

            {/* Existing Owners List */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>Registered Owners ({owners.length})</h4>
              {owners.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No owners registered yet. Add one below.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                  {owners.map(o => (
                    <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.85rem', borderRadius: '10px', border: editingOwner?.id === o.id ? '2px solid var(--primary)' : '1px solid var(--border)', backgroundColor: editingOwner?.id === o.id ? 'var(--primary-light)' : 'var(--bg-app)', transition: 'all 0.15s' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                        {(o.profile?.full_name || 'O').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {o.profile?.full_name || 'Unknown'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', marginTop: '1px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <ShieldCheck size={10} style={{ color: o.verified ? 'var(--success)' : 'var(--warning)' }} />
                            {o.verified ? 'Verified' : 'Unverified'}
                          </span>
                          <span>·</span>
                          <span>{o.company_name || 'No company'}</span>
                          {o.tax_id && (<><span>·</span><span>Tax: {o.tax_id}</span></>)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => startOwnerEdit(o)}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                          title="Edit owner details"
                        >
                          <Edit2 size={11} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOwnerDelete(o.id, o.profile?.full_name || 'this owner')}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.45rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.25)' }}
                          title="Delete owner"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add / Edit Owner Form */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>
                {editingOwner ? `Editing: ${editingOwner.profile?.full_name}` : 'Register New Owner'}
              </h4>

              {/* Mode toggle (only in create mode) */}
              {!editingOwner && (
                <div style={{ display: 'flex', gap: '0', marginBottom: '1rem', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setPromoteMode(false)}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem', fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: !promoteMode ? 'var(--primary)' : 'transparent', color: !promoteMode ? 'white' : 'var(--text-secondary)', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                  >
                    <UserPlus size={13} /> Create New Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromoteMode(true)}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem', fontWeight: 600, border: 'none', borderLeft: '1px solid var(--border)', cursor: 'pointer', backgroundColor: promoteMode ? 'var(--primary)' : 'transparent', color: promoteMode ? 'white' : 'var(--text-secondary)', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                  >
                    <ArrowUpRight size={13} /> Promote Existing User
                  </button>
                </div>
              )}

              <form onSubmit={handleOwnerSubmit}>
                {promoteMode && !editingOwner ? (
                  <div className="form-group">
                    <label className="form-label">Select Existing Profile to Promote *</label>
                    {loadingProfiles ? (
                      <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading profiles...</div>
                    ) : (
                      <select
                        className="form-control"
                        value={selectedProfileId}
                        onChange={e => setSelectedProfileId(e.target.value)}
                        required
                      >
                        <option value="">-- Select a user profile --</option>
                        {profiles
                          .filter(p => !owners.some(o => o.profile_id === p.id))
                          .map(p => (
                            <option key={p.id} value={p.id}>
                              {p.full_name} ({p.role})
                            </option>
                          ))
                        }
                      </select>
                    )}
                  </div>
                ) : !editingOwner ? (
                  <div className="grid grid-2 gap-3">
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input type="text" className="form-control" placeholder="John Peterson" value={newOwnerName} onChange={e => setNewOwnerName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contact Phone</label>
                      <input type="text" className="form-control" placeholder="+1 555-0100" value={newOwnerPhone} onChange={e => setNewOwnerPhone(e.target.value)} />
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Company / Brand Name</label>
                    <input type="text" className="form-control" placeholder="Peterson Properties Ltd" value={newOwnerCompanyName} onChange={e => setNewOwnerCompanyName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tax / Registration ID</label>
                    <input type="text" className="form-control" placeholder="TX-998811" value={newOwnerTaxId} onChange={e => setNewOwnerTaxId(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  {editingOwner && (
                    <button type="button" className="btn btn-secondary" onClick={cancelOwnerEdit}>Cancel Edit</button>
                  )}
                  <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {editingOwner ? <><Check size={14} /> Save Changes</> : <><UserPlus size={14} /> {promoteMode ? 'Promote to Owner' : 'Register Owner'}</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ AIRBNB IMPORT MODAL ═══════════════════ */}
      {importModalOpen && (
        <div className="modal-overlay" onClick={() => setImportModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '660px' }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: 'linear-gradient(135deg,#ff5a5f,#fc642d)', borderRadius: '8px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Link2 size={14} style={{ color: 'white' }} />
                    <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.02em' }}>AIRBNB</span>
                  </span>
                  Import Listing
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Paste an Airbnb listing URL to auto-fill the property form. Review extracted data before saving.
                </p>
              </div>
              <button onClick={() => setImportModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* URL Input Step */}
            {!importPreview && (
              <>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="url"
                    className="form-control"
                    style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                    placeholder="https://www.airbnb.com/rooms/12345678"
                    value={importUrl}
                    onChange={e => { setImportUrl(e.target.value); setImportError(''); }}
                    onKeyDown={e => e.key === 'Enter' && scrapeAirbnbListing()}
                    autoFocus
                  />
                  <button
                    className="btn btn-primary"
                    onClick={scrapeAirbnbListing}
                    disabled={importLoading || !importUrl.trim()}
                    style={{ whiteSpace: 'nowrap', minWidth: '110px', background: 'linear-gradient(135deg,#ff5a5f,#fc642d)', border: 'none' }}
                  >
                    {importLoading ? <><Loader size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> Fetching…</> : <><Sparkles size={14} /> Extract Data</>}
                  </button>
                </div>

                {importError && (
                  <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.85rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>{importError}</span>
                  </div>
                )}

                {importLoading && (
                  <div style={{ marginTop: '1.25rem', padding: '1.5rem', border: '1px dashed var(--border)', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg,#ff5a5f22,#fc642d22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader size={20} style={{ color: '#ff5a5f', animation: 'spin 1s linear infinite' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Fetching Airbnb listing…</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Extracting title, photos, amenities and location details</div>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', background: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>How it works</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {[
                      ['1', 'Copy any Airbnb listing URL from your browser'],
                      ['2', 'Paste it above and click Extract Data'],
                      ['3', 'Review the auto-filled details in the preview'],
                      ['4', 'Click Import — the property form opens pre-filled'],
                      ['5', 'Set price, commission, owner & publish']
                    ].map(([n, text]) => (
                      <div key={n} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'linear-gradient(135deg,#ff5a5f,#fc642d)', color: 'white', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</span>
                        {text}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Preview Step */}
            {importPreview && (
              <>
                {/* Success banner */}
                <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--success-light)', color: 'var(--success)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '1rem' }}>
                  <Check size={14} /> Data extracted successfully! Review below then click Import.
                </div>

                {/* Images preview strip */}
                {importPreview.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '1rem', paddingBottom: '4px' }}>
                    {importPreview.images.slice(0, 6).map((img, i) => (
                      <div key={i} style={{ position: 'relative', flexShrink: 0, width: '90px', height: '68px', borderRadius: '8px', overflow: 'hidden', border: i === 0 ? '2px solid #ff5a5f' : '1px solid var(--border)' }}>
                        <img src={img} alt={`preview-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {i === 0 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#ff5a5f', color: 'white', fontSize: '0.55rem', fontWeight: 800, textAlign: 'center', padding: '1px' }}>COVER</div>}
                      </div>
                    ))}
                    {importPreview.images.length > 6 && (
                      <div style={{ flexShrink: 0, width: '90px', height: '68px', borderRadius: '8px', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>+{importPreview.images.length - 6} more</div>
                    )}
                  </div>
                )}

                {/* Extracted data grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                  {[
                    ['Listing Title', importPreview.title],
                    ['Location', [importPreview.city, importPreview.country].filter(Boolean).join(', ') || '—'],
                    ['Property Type', importPreview.propertyType],
                    ['Nightly Price', importPreview.pricePerNight ? `$${importPreview.pricePerNight}` : 'Not found (set manually)'],
                    ['Bedrooms / Baths', `${importPreview.bedrooms} bed · ${importPreview.bathrooms} bath`],
                    ['Max Guests', importPreview.maxGuests || '—'],
                    ['Photos', `${importPreview.images.length} extracted`],
                    ['Amenities', importPreview.amenities.length > 0 ? importPreview.amenities.slice(0, 3).join(', ') + (importPreview.amenities.length > 3 ? `… +${importPreview.amenities.length - 3}` : '') : 'None detected'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ padding: '0.55rem 0.75rem', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{label}</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Source URL */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  <ExternalLink size={11} />
                  <a href={importPreview.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#ff5a5f', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '2px', wordBreak: 'break-all' }}>
                    {importPreview.sourceUrl}
                  </a>
                </div>

                {/* Warning note */}
                <div style={{ padding: '0.6rem 0.85rem', background: 'var(--warning-light)', color: 'var(--warning)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <AlertCircle size={13} /> Some fields (price, exact address) may not be extracted. Please review and complete the form before publishing.
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => { setImportPreview(null); setImportError(''); }}>
                    ← Try Another URL
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={applyImportedData}
                    style={{ background: 'linear-gradient(135deg,#ff5a5f,#fc642d)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Sparkles size={14} /> Import & Open Form
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
