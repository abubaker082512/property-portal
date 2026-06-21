-- SUPABASE DATABASE SCHEMA FOR PROPERTY PORTAL
-- Run this in your Supabase SQL Editor to initialize all tables, triggers, functions, and RLS policies.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Syncs with Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('super_admin', 'admin', 'sales', 'support', 'owner', 'customer')),
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. PROPERTY OWNERS TABLE
CREATE TABLE IF NOT EXISTS public.property_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    company_name TEXT,
    tax_id TEXT,
    verified BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Property Owners
ALTER TABLE public.property_owners ENABLE ROW LEVEL SECURITY;

-- 3. PROPERTIES TABLE
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.property_owners(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    country TEXT NOT NULL,
    zip_code TEXT,
    currency TEXT NOT NULL DEFAULT 'USD',
    price_per_night NUMERIC(10, 2) NOT NULL CHECK (price_per_night >= 0),
    commission_type TEXT NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('fixed', 'percentage')),
    commission_value NUMERIC(10, 2) NOT NULL DEFAULT 10.00 CHECK (commission_value >= 0),
    property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'house', 'villa', 'condo', 'cottage', 'cabin')),
    bedrooms INTEGER NOT NULL DEFAULT 1 CHECK (bedrooms >= 0),
    bathrooms INTEGER NOT NULL DEFAULT 1 CHECK (bathrooms >= 0),
    max_guests INTEGER NOT NULL DEFAULT 2 CHECK (max_guests > 0),
    amenities TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    images TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    status TEXT NOT NULL DEFAULT 'listed' CHECK (status IN ('listed', 'unlisted', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 4. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL CHECK (check_out_date > check_in_date),
    currency TEXT NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    owner_payout NUMERIC(10, 2) NOT NULL CHECK (owner_payout >= 0),
    platform_commission NUMERIC(10, 2) NOT NULL CHECK (platform_commission >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    booked_by_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'partially_paid', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 5. PAYMENT TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'cash', 'card_terminal', 'other')),
    transaction_reference TEXT,
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Payment Transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;


--------------------------------------------------------------------------------
-- DATABASE TRIGGERS & FUNCTIONS
--------------------------------------------------------------------------------

-- A. Auto-create profile record when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, phone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
        NEW.phone
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- A2. Sync profile role back to auth.users raw_app_meta_data to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.sync_profile_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = 
        coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_role_sync
    AFTER INSERT OR UPDATE OF role ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role_to_auth();

-- B. Automatically update the updated_at column on rows
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- C. Prevent Overlapping Bookings (Double Booking Prevention)
CREATE OR REPLACE FUNCTION check_booking_overlap()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check overlapping dates for active bookings (not cancelled)
    IF NEW.status != 'cancelled' THEN
        IF EXISTS (
            SELECT 1 FROM public.bookings
            WHERE property_id = NEW.property_id
              AND status != 'cancelled'
              AND id != NEW.id -- ignore same record during updates
              AND check_in_date < NEW.check_out_date
              AND check_out_date > NEW.check_in_date
        ) THEN
            RAISE EXCEPTION 'Double booking detected! This property is already booked for the selected dates.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_overlap_trigger
    BEFORE INSERT OR UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION check_booking_overlap();


--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------------------------------------

-- Helper function to check if the current user is an admin or staff member
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- RLS recursion guard: guest/not-logged-in users cannot be staff/admin
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
          AND raw_app_meta_data->>'role' IN ('super_admin', 'admin', 'sales', 'support')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. PROFILES POLICIES
CREATE POLICY "Allow users to read their own profile, staff reads all"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_staff_or_admin());

CREATE POLICY "Allow users to update their own profiles"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Allow admin/super_admin to manage profiles"
    ON public.profiles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- 2. PROPERTY OWNERS POLICIES
CREATE POLICY "Allow staff to read/manage all owner details"
    ON public.property_owners FOR ALL
    USING (public.is_staff_or_admin());

CREATE POLICY "Allow owners to read/update their own profile"
    ON public.property_owners FOR ALL
    USING (
        auth.uid() = profile_id
    );

-- 3. PROPERTIES POLICIES
CREATE POLICY "Allow anyone to read listed properties"
    ON public.properties FOR SELECT
    USING (status = 'listed' OR public.is_staff_or_admin() OR EXISTS (
        SELECT 1 FROM public.property_owners po
        WHERE po.id = owner_id AND po.profile_id = auth.uid()
    ));

CREATE POLICY "Allow owners to manage their own properties"
    ON public.properties FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.property_owners po
            WHERE po.id = owner_id AND po.profile_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.property_owners po
            WHERE po.id = owner_id AND po.profile_id = auth.uid()
        )
    );

CREATE POLICY "Allow staff and admins to manage all properties"
    ON public.properties FOR ALL
    USING (public.is_staff_or_admin());

-- 4. BOOKINGS POLICIES
CREATE POLICY "Allow staff/admins to manage all bookings"
    ON public.bookings FOR ALL
    USING (public.is_staff_or_admin());

CREATE POLICY "Allow owners to view bookings for their properties"
    ON public.bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.properties p
            JOIN public.property_owners po ON p.owner_id = po.id
            WHERE p.id = property_id AND po.profile_id = auth.uid()
        )
    );

CREATE POLICY "Allow customers to view their own bookings"
    ON public.bookings FOR SELECT
    USING (customer_id = auth.uid() OR guest_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Allow customers/guests to create bookings"
    ON public.bookings FOR INSERT
    WITH CHECK (true); -- Public can submit bookings (leads to guest reservation)

-- 5. PAYMENT TRANSACTIONS POLICIES
CREATE POLICY "Allow staff to manage payment transactions"
    ON public.payment_transactions FOR ALL
    USING (public.is_staff_or_admin());

CREATE POLICY "Allow owners to read payment transactions for their bookings"
    ON public.payment_transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            JOIN public.properties p ON b.property_id = p.id
            JOIN public.property_owners po ON p.owner_id = po.id
            WHERE b.id = booking_id AND po.profile_id = auth.uid()
        )
    );
