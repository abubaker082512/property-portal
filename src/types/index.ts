export type UserRole = 'admin' | 'sales' | 'support' | 'owner' | 'customer';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  created_at: string;
}

export interface PropertyOwner {
  id: string;
  profile_id: string;
  company_name?: string;
  tax_id?: string;
  verified: boolean;
  created_at: string;
  profile?: Profile;
}

export type PropertyStatus = 'listed' | 'unlisted' | 'maintenance';
export type PropertyType = 'apartment' | 'house' | 'villa' | 'condo' | 'cottage' | 'cabin';
export type CommissionType = 'fixed' | 'percentage';

export interface Property {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  zip_code?: string;
  currency: string;
  price_per_night: number;
  commission_type: CommissionType;
  commission_value: number;
  property_type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  amenities: string[];
  images: string[];
  status: PropertyStatus;
  created_at: string;
  updated_at: string;
  owner?: PropertyOwner;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'unpaid' | 'paid' | 'partially_paid' | 'refunded';

export interface Booking {
  id: string;
  property_id: string;
  customer_id?: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  check_in_date: string;
  check_out_date: string;
  currency: string;
  total_price: number;
  owner_payout: number;
  platform_commission: number;
  status: BookingStatus;
  booked_by_staff_id?: string;
  payment_status: PaymentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  property?: Property;
  staff?: Profile;
}

export type PaymentMethod = 'bank_transfer' | 'cash' | 'card_terminal' | 'other';
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface PaymentTransaction {
  id: string;
  booking_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_reference?: string;
  status: TransactionStatus;
  created_at: string;
}
