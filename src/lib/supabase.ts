import { createClient } from '@supabase/supabase-js';
import type { 
  Profile, Property, Booking, PropertyOwner, 
  PaymentTransaction, UserRole, BookingStatus, PaymentStatus 
} from '../types';

// Read Env Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize Supabase Client
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isDemoMode = !supabase;

// --- MOCK DATABASE / DEMO MODE IMPLEMENTATION ---
const MOCK_PROFILES_KEY = 'prop_portal_profiles';
const MOCK_OWNERS_KEY = 'prop_portal_owners';
const MOCK_PROPERTIES_KEY = 'prop_portal_properties';
const MOCK_BOOKINGS_KEY = 'prop_portal_bookings';
const MOCK_TRANSACTIONS_KEY = 'prop_portal_transactions';
const MOCK_CURRENT_USER_KEY = 'prop_portal_current_user';

// Helper to load/save from localStorage
const getStorage = <T>(key: string, defaultVal: T): T => {
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : defaultVal;
};

const setStorage = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initial Seed Data for Demo Mode
const SEED_VERSION = 'v3'; // bump to force-reset all local demo data
const initDemoData = () => {
  if (localStorage.getItem('prop_portal_seed_version') !== SEED_VERSION) {
    [MOCK_PROFILES_KEY, MOCK_OWNERS_KEY, MOCK_PROPERTIES_KEY,
     MOCK_BOOKINGS_KEY, MOCK_TRANSACTIONS_KEY, MOCK_CURRENT_USER_KEY
    ].forEach(k => localStorage.removeItem(k));
    localStorage.setItem('prop_portal_seed_version', SEED_VERSION);
  }

  // 1. Initial Profiles
  if (!localStorage.getItem(MOCK_PROFILES_KEY)) {
    const profiles: Profile[] = [
      { id: 'u-admin', full_name: 'Admin Director', role: 'super_admin', phone: '+1234567890', created_at: new Date().toISOString() },
      { id: 'u-sales', full_name: 'Sarah Sales (Agent)', role: 'sales', phone: '+1234567891', created_at: new Date().toISOString() },
      { id: 'u-support', full_name: 'David Support (Agent)', role: 'support', phone: '+1234567892', created_at: new Date().toISOString() },
      { id: 'u-owner1', full_name: 'John Peterson', role: 'owner', phone: '+1234567893', created_at: new Date().toISOString() },
      { id: 'u-owner2', full_name: 'Elena Rostova', role: 'owner', phone: '+1234567894', created_at: new Date().toISOString() },
      { id: 'u-cust1', full_name: 'Michael Scott', role: 'customer', phone: '+1234567895', created_at: new Date().toISOString() }
    ];
    setStorage(MOCK_PROFILES_KEY, profiles);
  }

  // 2. Initial Owners
  if (!localStorage.getItem(MOCK_OWNERS_KEY)) {
    const owners: PropertyOwner[] = [
      { id: 'o-1', profile_id: 'u-owner1', company_name: 'Peterson Properties Ltd', tax_id: 'TX-998811', verified: true, created_at: new Date().toISOString() },
      { id: 'o-2', profile_id: 'u-owner2', company_name: 'Alpine & Desert Rentals', tax_id: 'TX-445522', verified: true, created_at: new Date().toISOString() }
    ];
    setStorage(MOCK_OWNERS_KEY, owners);
  }

  // 3. Initial Properties
  if (!localStorage.getItem(MOCK_PROPERTIES_KEY)) {
    const properties: Property[] = [
      {
        id: 'p-1',
        owner_id: 'o-1',
        title: 'Luxury Oceanfront Villa',
        description: 'Breathtaking coastal views, private heated infinity pool, direct beach access, and custom luxury finishes throughout. Located in the exclusive Malibu cove.',
        address: '24800 Pacific Coast Hwy',
        city: 'Malibu',
        state: 'California',
        country: 'USA',
        zip_code: '90265',
        currency: 'USD',
        price_per_night: 450,
        commission_type: 'percentage',
        commission_value: 15,
        property_type: 'villa',
        bedrooms: 4,
        bathrooms: 4,
        max_guests: 8,
        amenities: ['Pool', 'Beach View', 'WiFi', 'Air Conditioning', 'Kitchen', 'Hot Tub'],
        images: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=800&q=80',
        ],
        status: 'listed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'p-2',
        owner_id: 'o-1',
        title: 'Downtown Glass Penthouse',
        description: 'Sleek metropolitan living with 360-degree city views. Floor-to-ceiling windows, modern kitchen, private elevator access, and rooftop gym access.',
        address: '56 Wall Street',
        city: 'New York',
        state: 'New York',
        country: 'USA',
        zip_code: '10005',
        currency: 'USD',
        price_per_night: 220,
        commission_type: 'fixed',
        commission_value: 30,
        property_type: 'apartment',
        bedrooms: 1,
        bathrooms: 1.5,
        max_guests: 2,
        amenities: ['WiFi', 'Gym', 'Air Conditioning', 'Elevator'],
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
        ],
        status: 'listed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'p-3',
        owner_id: 'o-2',
        title: 'Cozy Mountain Log Cabin',
        description: 'Authentic logs, warm interior fireplace, outdoor cedar hot tub, and ski-in/ski-out capabilities. Perfect for winter ski trips or summer hiking adventures.',
        address: '410 Maroon Bells Rd',
        city: 'Aspen',
        state: 'Colorado',
        country: 'USA',
        zip_code: '81611',
        currency: 'USD',
        price_per_night: 180,
        commission_type: 'percentage',
        commission_value: 10,
        property_type: 'cabin',
        bedrooms: 2,
        bathrooms: 1,
        max_guests: 4,
        amenities: ['Fireplace', 'Hot Tub', 'WiFi', 'Parking', 'Pet Friendly'],
        images: [
          'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=800&q=80',
        ],
        status: 'listed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'p-4',
        owner_id: 'o-2',
        title: 'Classic Parisian Boulevard Apartment',
        description: 'Elegant apartment with classic Parisian architecture, high ceilings, crown molding, and a small balcony overlooking the historic streets.',
        address: '14 Rue de la Paix',
        city: 'Paris',
        state: 'Île-de-France',
        country: 'France',
        zip_code: '75002',
        currency: 'EUR',
        price_per_night: 290,
        commission_type: 'percentage',
        commission_value: 12,
        property_type: 'apartment',
        bedrooms: 2,
        bathrooms: 2,
        max_guests: 4,
        amenities: ['WiFi', 'Balcony', 'Kitchen', 'Heating'],
        images: [
          'https://images.unsplash.com/photo-1499955085172-a104c9463ece?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1550340499-a6c60fc8287c?auto=format&fit=crop&w=800&q=80',
        ],
        status: 'listed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'p-5',
        owner_id: 'o-2',
        title: 'Exclusive Palm Jumeirah Estate',
        description: 'Ultra-luxurious resort estate on the Palm. Private infinity beach, indoor cinema, custom wellness spa, 24/7 private chef and butler.',
        address: 'Frond D, Palm Jumeirah',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        zip_code: '00000',
        currency: 'AED',
        price_per_night: 1800,
        commission_type: 'fixed',
        commission_value: 200,
        property_type: 'villa',
        bedrooms: 5,
        bathrooms: 6,
        max_guests: 10,
        amenities: ['Pool', 'Beach View', 'WiFi', 'Air Conditioning', 'Kitchen', 'Hot Tub'],
        images: [
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        ],
        status: 'listed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // ── PKR Properties – Pakistan ──
      {
        id: 'p-6',
        owner_id: 'o-1',
        title: 'DHA Phase 6 Modern Villa',
        description: 'Stunning 5-bedroom modern villa in the heart of DHA Phase 6 Lahore. Features a private rooftop terrace, lush garden, home cinema, and 24/7 security with generator backup.',
        address: 'Street 12, Block M, DHA Phase 6',
        city: 'Lahore',
        state: 'Punjab',
        country: 'Pakistan',
        zip_code: '54000',
        currency: 'PKR',
        price_per_night: 35000,
        commission_type: 'percentage',
        commission_value: 10,
        property_type: 'villa',
        bedrooms: 5,
        bathrooms: 5,
        max_guests: 10,
        amenities: ['WiFi', 'Air Conditioning', 'Parking', 'Kitchen', 'Gym', 'Pet Friendly'],
        images: [
          'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1600566753151-384129cf4d3a?auto=format&fit=crop&w=800&q=80',
        ],
        status: 'listed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'p-7',
        owner_id: 'o-2',
        title: 'Clifton Sea-View Apartment',
        description: 'Elegant 3-bedroom apartment on the 12th floor with panoramic views of the Arabian Sea. Fully furnished with contemporary décor, backup power, and building amenities.',
        address: 'Block 2, Clifton',
        city: 'Karachi',
        state: 'Sindh',
        country: 'Pakistan',
        zip_code: '75600',
        currency: 'PKR',
        price_per_night: 22000,
        commission_type: 'fixed',
        commission_value: 2500,
        property_type: 'apartment',
        bedrooms: 3,
        bathrooms: 3,
        max_guests: 6,
        amenities: ['WiFi', 'Air Conditioning', 'Elevator', 'Parking', 'Beach View', 'Kitchen'],
        images: [
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80',
        ],
        status: 'listed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'p-8',
        owner_id: 'o-1',
        title: 'Nathiagali Pine Forest Cottage',
        description: 'Rustic yet comfortable 4-bedroom hill-station cottage surrounded by towering pine forests. Cozy fireplaces, breathtaking mountain views, and an outdoor BBQ area perfect for families.',
        address: 'Near Dunga Gali Road',
        city: 'Nathiagali',
        state: 'KPK',
        country: 'Pakistan',
        zip_code: '22020',
        currency: 'PKR',
        price_per_night: 18000,
        commission_type: 'percentage',
        commission_value: 8,
        property_type: 'cottage',
        bedrooms: 4,
        bathrooms: 2,
        max_guests: 8,
        amenities: ['Fireplace', 'Parking', 'Kitchen', 'Pet Friendly', 'Balcony'],
        images: [
          'https://images.unsplash.com/photo-1452784444945-3f422708fe5e?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1416949929422-a1d9c8fe84af?auto=format&fit=crop&w=800&q=80',
        ],
        status: 'listed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    setStorage(MOCK_PROPERTIES_KEY, properties);
  }

  // 4. Initial Bookings (Seeded around June 18, 2026)
  if (!localStorage.getItem(MOCK_BOOKINGS_KEY)) {
    const bookings: Booking[] = [
      {
        id: 'b-1',
        property_id: 'p-1',
        guest_name: 'Alice Smith',
        guest_email: 'alice@example.com',
        guest_phone: '+1 555-0199',
        check_in_date: '2026-06-15',
        check_out_date: '2026-06-20',
        currency: 'USD',
        total_price: 2250, // 5 nights * 450
        platform_commission: 337.5, // 15% of 2250
        owner_payout: 1912.5,
        status: 'confirmed',
        payment_status: 'paid',
        booked_by_staff_id: 'u-sales',
        notes: 'VIP guest. Requested early check-in at 1:00 PM if possible.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'b-2',
        property_id: 'p-2',
        guest_name: 'Bob Miller',
        guest_email: 'bob@example.com',
        guest_phone: '+1 555-0188',
        check_in_date: '2026-06-17',
        check_out_date: '2026-06-19',
        currency: 'USD',
        total_price: 440, // 2 nights * 220
        platform_commission: 60, // 2 nights * 30 fixed
        owner_payout: 380,
        status: 'confirmed',
        payment_status: 'paid',
        booked_by_staff_id: 'u-support',
        notes: 'Needs high-speed internet verification for remote working.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'b-3',
        property_id: 'p-3',
        guest_name: 'Charlie Brown',
        guest_email: 'charlie@example.com',
        guest_phone: '+1 555-0177',
        check_in_date: '2026-06-21',
        check_out_date: '2026-06-25',
        currency: 'USD',
        total_price: 720, // 4 nights * 180
        platform_commission: 72, // 10% of 720
        owner_payout: 648,
        status: 'pending',
        payment_status: 'unpaid',
        notes: 'Inquiry via phone. Guest will call back to process bank wire transaction.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'b-4',
        property_id: 'p-5',
        guest_name: 'David Miller',
        guest_email: 'david@example.com',
        guest_phone: '+971 50 1234567',
        check_in_date: '2026-06-13',
        check_out_date: '2026-06-17',
        currency: 'AED',
        total_price: 7200, // 4 nights * 1800
        platform_commission: 800, // 4 nights * 200 fixed
        owner_payout: 6400,
        status: 'completed',
        payment_status: 'paid',
        booked_by_staff_id: 'u-sales',
        notes: 'Everything went perfectly. Guest left a positive feedback note.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'b-5',
        property_id: 'p-5',
        guest_name: 'Emma Watson',
        guest_email: 'emma@example.com',
        guest_phone: '+44 7911 123456',
        check_in_date: '2026-06-19',
        check_out_date: '2026-06-24',
        currency: 'AED',
        total_price: 9000, // 5 nights * 1800
        platform_commission: 1000, // 5 nights * 200 fixed
        owner_payout: 8000,
        status: 'confirmed',
        payment_status: 'partially_paid',
        booked_by_staff_id: 'u-sales',
        notes: 'Deposit paid via bank wire. Remainder to be settled in cash upon check-in.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    setStorage(MOCK_BOOKINGS_KEY, bookings);
  }

  // 5. Initial Transactions
  if (!localStorage.getItem(MOCK_TRANSACTIONS_KEY)) {
    const transactions: PaymentTransaction[] = [
      { id: 't-1', booking_id: 'b-1', amount: 2250, payment_method: 'bank_transfer', transaction_reference: 'WIRE-908812', status: 'success', created_at: new Date().toISOString() },
      { id: 't-2', booking_id: 'b-2', amount: 440, payment_method: 'card_terminal', transaction_reference: 'POS-7762', status: 'success', created_at: new Date().toISOString() },
      { id: 't-3', booking_id: 'b-4', amount: 7200, payment_method: 'bank_transfer', transaction_reference: 'DXB-WIRE-5544', status: 'success', created_at: new Date().toISOString() },
      { id: 't-4', booking_id: 'b-5', amount: 4500, payment_method: 'bank_transfer', transaction_reference: 'DEP-WIRE-22', status: 'success', created_at: new Date().toISOString() }
    ];
    setStorage(MOCK_TRANSACTIONS_KEY, transactions);
  }

  // 6. Default Active User is Admin for easy starting
  if (!localStorage.getItem(MOCK_CURRENT_USER_KEY)) {
    const profiles: Profile[] = getStorage(MOCK_PROFILES_KEY, []);
    setStorage(MOCK_CURRENT_USER_KEY, profiles[0]); // default to Admin
  }
};

// Seed mock data
initDemoData();

// --- ABSTRACTED API CLIENT ---
export const api = {
  // --- AUTH / USER API ---
  getCurrentUser: async (): Promise<Profile | null> => {
    if (isDemoMode) {
      return getStorage<Profile | null>(MOCK_CURRENT_USER_KEY, null);
    }
    const { data: { user } } = await supabase!.auth.getUser();
    if (!user) return null;
    const { data } = await supabase!
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    return data;
  },

  switchUser: async (profileId: string): Promise<Profile> => {
    if (isDemoMode) {
      const profiles = getStorage<Profile[]>(MOCK_PROFILES_KEY, []);
      const user = profiles.find(p => p.id === profileId);
      if (!user) throw new Error('User not found');
      setStorage(MOCK_CURRENT_USER_KEY, user);
      return user;
    }
    // Real Supabase simulation or custom sign-in would go here
    throw new Error('Switching users is only available in Demo Mode. In production, log in with auth credentials.');
  },

  logout: async (): Promise<void> => {
    if (isDemoMode) {
      setStorage(MOCK_CURRENT_USER_KEY, null);
      return;
    }
    await supabase!.auth.signOut();
  },

  getProfiles: async (): Promise<Profile[]> => {
    if (isDemoMode) {
      return getStorage<Profile[]>(MOCK_PROFILES_KEY, []);
    }
    const { data, error } = await supabase!
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  updateProfileRole: async (profileId: string, role: UserRole): Promise<Profile> => {
    if (isDemoMode) {
      const profiles = getStorage<Profile[]>(MOCK_PROFILES_KEY, []);
      const idx = profiles.findIndex(p => p.id === profileId);
      if (idx === -1) throw new Error('Profile not found');
      profiles[idx].role = role;
      setStorage(MOCK_PROFILES_KEY, profiles);
      return profiles[idx];
    }
    const { data, error } = await supabase!
      .from('profiles')
      .update({ role })
      .eq('id', profileId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteProfile: async (profileId: string): Promise<void> => {
    if (isDemoMode) {
      const profiles = getStorage<Profile[]>(MOCK_PROFILES_KEY, []);
      const filtered = profiles.filter(p => p.id !== profileId);
      setStorage(MOCK_PROFILES_KEY, filtered);
      return;
    }
    const { error } = await supabase!
      .from('profiles')
      .delete()
      .eq('id', profileId);
    if (error) throw error;
  },

  createStaffAccount: async (fullName: string, email: string, role: UserRole, phone?: string, username?: string, password?: string): Promise<Profile> => {
    if (isDemoMode) {
      const profiles = getStorage<Profile[]>(MOCK_PROFILES_KEY, []);
      const newId = `u-staff-${Date.now()}`;
      
      const newStaff: Profile = {
        id: newId,
        full_name: fullName,
        role,
        phone,
        email,
        username,
        password,
        created_at: new Date().toISOString()
      };
      
      profiles.push(newStaff);
      setStorage(MOCK_PROFILES_KEY, profiles);

      // If they are owner, we also register a Property Owner profile
      if (role === 'owner') {
        const owners = getStorage<PropertyOwner[]>(MOCK_OWNERS_KEY, []);
        owners.push({
          id: `o-${Date.now()}`,
          profile_id: newId,
          company_name: `${fullName} Properties`,
          verified: true,
          created_at: new Date().toISOString()
        });
        setStorage(MOCK_OWNERS_KEY, owners);
      }

      return newStaff;
    }
    
    // In production, Admins call a Supabase Edge Function or Auth Admin API to create a user.
    // Here we can call Supabase Auth Admin API or sign them up. Note: Auth admin requires service role key,
    // so in client code, this is usually delegated to an Edge Function.
    // For direct simplicity, we can insert into Profiles (assuming the auth side is handled).
    throw new Error('Staff manual creation in production requires configuring a Supabase Admin Edge Function. (Working in Demo Mode!)');
  },

  // --- OWNERS API ---
  getOwners: async (): Promise<PropertyOwner[]> => {
    if (isDemoMode) {
      const owners = getStorage<PropertyOwner[]>(MOCK_OWNERS_KEY, []);
      const profiles = getStorage<Profile[]>(MOCK_PROFILES_KEY, []);
      return owners.map(o => ({
        ...o,
        profile: profiles.find(p => p.id === o.profile_id)
      }));
    }
    const { data, error } = await supabase!
      .from('property_owners')
      .select('*, profile:profiles(*)');
    if (error) throw error;
    return data;
  },

  createOwner: async (ownerData: { fullName?: string; companyName?: string; taxId?: string; phone?: string; profileId?: string }): Promise<PropertyOwner> => {
    if (isDemoMode) {
      const profiles = getStorage<Profile[]>(MOCK_PROFILES_KEY, []);
      const owners = getStorage<PropertyOwner[]>(MOCK_OWNERS_KEY, []);
      
      let profileId = ownerData.profileId;
      let matchedProfile = profileId ? profiles.find(p => p.id === profileId) : undefined;
      
      if (!profileId || !matchedProfile) {
        profileId = `u-owner-${Date.now()}`;
        matchedProfile = {
          id: profileId,
          full_name: ownerData.fullName || 'New Owner',
          role: 'owner',
          phone: ownerData.phone,
          created_at: new Date().toISOString()
        };
        profiles.push(matchedProfile);
        setStorage(MOCK_PROFILES_KEY, profiles);
      } else {
        // Upgrade existing profile to owner
        matchedProfile.role = 'owner';
        if (ownerData.phone) matchedProfile.phone = ownerData.phone;
        setStorage(MOCK_PROFILES_KEY, profiles);
      }
      
      const newOwnerId = `o-${Date.now()}`;
      const newOwner: PropertyOwner = {
        id: newOwnerId,
        profile_id: profileId,
        company_name: ownerData.companyName || `${matchedProfile.full_name} Properties`,
        tax_id: ownerData.taxId || `TX-${Math.floor(100000 + Math.random() * 900000)}`,
        verified: true,
        created_at: new Date().toISOString()
      };
      
      owners.push(newOwner);
      setStorage(MOCK_OWNERS_KEY, owners);
      
      return {
        ...newOwner,
        profile: matchedProfile
      };
    }
    
    // In Production Mode
    if (ownerData.profileId) {
      // 1. Update the profile role to 'owner'
      const { error: profileError } = await supabase!
        .from('profiles')
        .update({ role: 'owner' })
        .eq('id', ownerData.profileId);
        
      if (profileError) throw profileError;
      
      // 2. Insert the property owner row
      const { data, error } = await supabase!
        .from('property_owners')
        .insert({
          profile_id: ownerData.profileId,
          company_name: ownerData.companyName,
          tax_id: ownerData.taxId,
          verified: true
        })
        .select('*, profile:profiles(*)')
        .single();
        
      if (error) throw error;
      return data;
    }
    
    throw new Error('Direct Owner creation in production requires choosing an existing profile to upgrade to owner, or creating a user via User Management Registry first.');
  },

  updateOwner: async (ownerId: string, ownerData: { companyName?: string; taxId?: string; verified?: boolean }): Promise<PropertyOwner> => {
    if (isDemoMode) {
      const owners = getStorage<PropertyOwner[]>(MOCK_OWNERS_KEY, []);
      const idx = owners.findIndex(o => o.id === ownerId);
      if (idx === -1) throw new Error('Owner profile not found');
      
      owners[idx] = {
        ...owners[idx],
        company_name: ownerData.companyName !== undefined ? ownerData.companyName : owners[idx].company_name,
        tax_id: ownerData.taxId !== undefined ? ownerData.taxId : owners[idx].tax_id,
        verified: ownerData.verified !== undefined ? ownerData.verified : owners[idx].verified
      };
      
      setStorage(MOCK_OWNERS_KEY, owners);
      
      const profiles = getStorage<Profile[]>(MOCK_PROFILES_KEY, []);
      return {
        ...owners[idx],
        profile: profiles.find(p => p.id === owners[idx].profile_id)
      };
    }
    
    // In Production Mode
    const { data, error } = await supabase!
      .from('property_owners')
      .update({
        company_name: ownerData.companyName,
        tax_id: ownerData.taxId,
        verified: ownerData.verified
      })
      .eq('id', ownerId)
      .select('*, profile:profiles(*)')
      .single();
      
    if (error) throw error;
    return data;
  },

  deleteOwner: async (ownerId: string): Promise<void> => {
    if (isDemoMode) {
      const owners = getStorage<PropertyOwner[]>(MOCK_OWNERS_KEY, []);
      const filtered = owners.filter(o => o.id !== ownerId);
      setStorage(MOCK_OWNERS_KEY, filtered);
      return;
    }
    
    // In Production Mode
    const { error } = await supabase!
      .from('property_owners')
      .delete()
      .eq('id', ownerId);
      
    if (error) throw error;
  },

  // --- PROPERTIES API ---
  getProperties: async (): Promise<Property[]> => {
    if (isDemoMode) {
      const properties = getStorage<Property[]>(MOCK_PROPERTIES_KEY, []);
      const owners = getStorage<PropertyOwner[]>(MOCK_OWNERS_KEY, []);
      const profiles = getStorage<Profile[]>(MOCK_PROFILES_KEY, []);
      return properties.map(p => {
        const owner = owners.find(o => o.id === p.owner_id);
        const ownerProfile = owner ? profiles.find(pr => pr.id === owner.profile_id) : undefined;
        return {
          ...p,
          owner: owner ? { ...owner, profile: ownerProfile } : undefined
        };
      });
    }
    const { data, error } = await supabase!
      .from('properties')
      .select('*, owner:property_owners(*, profile:profiles(*))');
    if (error) throw error;
    return data;
  },

  createProperty: async (property: Omit<Property, 'id' | 'created_at' | 'updated_at'>): Promise<Property> => {
    if (isDemoMode) {
      const properties = getStorage<Property[]>(MOCK_PROPERTIES_KEY, []);
      const newProp: Property = {
        ...property,
        id: `p-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      properties.push(newProp);
      setStorage(MOCK_PROPERTIES_KEY, properties);
      return newProp;
    }
    const { data, error } = await supabase!
      .from('properties')
      .insert([property])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateProperty: async (id: string, property: Partial<Property>): Promise<Property> => {
    if (isDemoMode) {
      const properties = getStorage<Property[]>(MOCK_PROPERTIES_KEY, []);
      const idx = properties.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Property not found');
      
      const updated = {
        ...properties[idx],
        ...property,
        updated_at: new Date().toISOString()
      };
      properties[idx] = updated;
      setStorage(MOCK_PROPERTIES_KEY, properties);
      return updated;
    }
    const { data, error } = await supabase!
      .from('properties')
      .update(property)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteProperty: async (id: string): Promise<void> => {
    if (isDemoMode) {
      const properties = getStorage<Property[]>(MOCK_PROPERTIES_KEY, []);
      const filtered = properties.filter(p => p.id !== id);
      setStorage(MOCK_PROPERTIES_KEY, filtered);
      return;
    }
    const { error } = await supabase!
      .from('properties')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // --- BOOKINGS API ---
  getBookings: async (): Promise<Booking[]> => {
    if (isDemoMode) {
      const bookings = getStorage<Booking[]>(MOCK_BOOKINGS_KEY, []);
      const properties = getStorage<Property[]>(MOCK_PROPERTIES_KEY, []);
      const profiles = getStorage<Profile[]>(MOCK_PROFILES_KEY, []);
      return bookings.map(b => ({
        ...b,
        property: properties.find(p => p.id === b.property_id),
        staff: b.booked_by_staff_id ? profiles.find(p => p.id === b.booked_by_staff_id) : undefined
      }));
    }
    const { data, error } = await supabase!
      .from('bookings')
      .select('*, property:properties(*), staff:profiles(*)');
    if (error) throw error;
    return data;
  },

  createBooking: async (bookingData: {
    property_id: string;
    customer_id?: string;
    guest_name: string;
    guest_email: string;
    guest_phone?: string;
    check_in_date: string;
    check_out_date: string;
    currency: string;
    total_price: number;
    platform_commission: number;
    owner_payout: number;
    notes?: string;
    payment_status: PaymentStatus;
    status: BookingStatus;
    booked_by_staff_id?: string;
  }): Promise<Booking> => {
    if (isDemoMode) {
      const bookings = getStorage<Booking[]>(MOCK_BOOKINGS_KEY, []);

      // 1. Date overlap check
      const overlap = bookings.some(b => 
        b.property_id === bookingData.property_id &&
        b.status !== 'cancelled' &&
        b.check_in_date < bookingData.check_out_date &&
        b.check_out_date > bookingData.check_in_date
      );

      if (overlap) {
        throw new Error('Double booking detected! This property is already booked for the selected dates.');
      }

      const newBooking: Booking = {
        ...bookingData,
        id: `b-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      bookings.push(newBooking);
      setStorage(MOCK_BOOKINGS_KEY, bookings);

      // Create a transaction if paid
      if (bookingData.payment_status === 'paid' || bookingData.payment_status === 'partially_paid') {
        const transactions = getStorage<PaymentTransaction[]>(MOCK_TRANSACTIONS_KEY, []);
        transactions.push({
          id: `t-${Date.now()}`,
          booking_id: newBooking.id,
          amount: bookingData.payment_status === 'paid' ? bookingData.total_price : bookingData.total_price / 2,
          payment_method: 'cash',
          transaction_reference: 'MOCK-AUTO-REF',
          status: 'success',
          created_at: new Date().toISOString()
        });
        setStorage(MOCK_TRANSACTIONS_KEY, transactions);
      }

      return newBooking;
    }

    const { data, error } = await supabase!
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateBookingStatus: async (
    id: string, 
    status: BookingStatus, 
    paymentStatus: PaymentStatus
  ): Promise<Booking> => {
    if (isDemoMode) {
      const bookings = getStorage<Booking[]>(MOCK_BOOKINGS_KEY, []);
      const idx = bookings.findIndex(b => b.id === id);
      if (idx === -1) throw new Error('Booking not found');
      
      const updated = {
        ...bookings[idx],
        status,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      };
      bookings[idx] = updated;
      setStorage(MOCK_BOOKINGS_KEY, bookings);
      return updated;
    }
    const { data, error } = await supabase!
      .from('bookings')
      .update({ status, payment_status: paymentStatus })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- TRANSACTIONS API ---
  getTransactions: async (bookingId?: string): Promise<PaymentTransaction[]> => {
    if (isDemoMode) {
      const transactions = getStorage<PaymentTransaction[]>(MOCK_TRANSACTIONS_KEY, []);
      if (bookingId) {
        return transactions.filter(t => t.booking_id === bookingId);
      }
      return transactions;
    }
    let query = supabase!.from('payment_transactions').select('*');
    if (bookingId) {
      query = query.eq('booking_id', bookingId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  addTransaction: async (transaction: Omit<PaymentTransaction, 'id' | 'created_at'>): Promise<PaymentTransaction> => {
    if (isDemoMode) {
      const transactions = getStorage<PaymentTransaction[]>(MOCK_TRANSACTIONS_KEY, []);
      const newTx: PaymentTransaction = {
        ...transaction,
        id: `t-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      transactions.push(newTx);
      setStorage(MOCK_TRANSACTIONS_KEY, transactions);

      // Dynamically update booking payment status
      const bookings = getStorage<Booking[]>(MOCK_BOOKINGS_KEY, []);
      const bookingIdx = bookings.findIndex(b => b.id === transaction.booking_id);
      if (bookingIdx !== -1) {
        const b = bookings[bookingIdx];
        const bTx = transactions.filter(t => t.booking_id === b.id && t.status === 'success');
        const paidAmt = bTx.reduce((sum, t) => sum + t.amount, 0);
        
        if (paidAmt >= b.total_price) {
          b.payment_status = 'paid';
        } else if (paidAmt > 0) {
          b.payment_status = 'partially_paid';
        } else {
          b.payment_status = 'unpaid';
        }
        b.updated_at = new Date().toISOString();
        bookings[bookingIdx] = b;
        setStorage(MOCK_BOOKINGS_KEY, bookings);
      }

      return newTx;
    }
    const { data, error } = await supabase!
      .from('payment_transactions')
      .insert([transaction])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
