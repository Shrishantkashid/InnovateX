-- SAFEGUARD DATABASE SCHEMA (SUPABASE/POSTGRESQL)

-- 1. PROFILES TABLE (Linked to auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  full_name TEXT,
  role TEXT CHECK (role IN ('woman','child','parent','admin')),
  module TEXT CHECK (module IN ('m1','m2','m3')),
  is_verified BOOLEAN DEFAULT false,
  verification_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CHILD PROFILES
CREATE TABLE public.child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id_tag TEXT UNIQUE NOT NULL, -- CHILD-XXXXXX
  parent_id UUID REFERENCES public.profiles(id),
  school_name TEXT,
  age INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PARENT PROFILES
CREATE TABLE public.parent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id_tag TEXT UNIQUE NOT NULL, -- PARENT-XXXXXX
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TRUSTED CONTACTS
CREATE TABLE public.trusted_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  is_trusted_adult BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. SOS EVENTS
CREATE TABLE public.sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  module TEXT CHECK (module IN ('m1','m2')),
  trigger_type TEXT, -- 'audio'|'motion'|'eta'|'squeeze'|'manual'|'zone_exit'
  threat_score INTEGER, -- 0–100
  lat FLOAT8,
  lng FLOAT8,
  audio_clip_url TEXT,
  track_token TEXT UNIQUE,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. LOCATION PINGS
CREATE TABLE public.location_pings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  sos_event_id UUID REFERENCES public.sos_events(id),
  lat FLOAT8 NOT NULL,
  lng FLOAT8 NOT NULL,
  accuracy FLOAT8,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- 7. NOTIFICATION LOG
CREATE TABLE public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  sos_event_id UUID REFERENCES public.sos_events(id),
  channel TEXT, -- 'sms'|'whatsapp'|'voice'|'push'|'email'
  recipient_phone TEXT,
  status TEXT, -- 'sent'|'delivered'|'failed'
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- 8. TRUSTED ZONES (Requires PostGIS)
-- CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE public.trusted_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES public.profiles(id),
  label TEXT, -- 'school'|'home'|'tutor'|'custom'
  -- polygon GEOMETRY(Polygon, 4326),
  active_days INTEGER[],
  active_start TIME,
  active_end TIME,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. MODULE 3: DIGITAL SAFETY TABLES
CREATE TABLE public.contact_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES public.profiles(id),
  contact_hash TEXT,
  grooming_score FLOAT8,
  behaviour_delta FLOAT8,
  content_score FLOAT8,
  composite_score FLOAT8,
  risk_category TEXT, -- 'low'|'moderate'|'high'|'critical'
  top_flags TEXT[],
  scored_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.weekly_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES public.profiles(id),
  parent_id UUID REFERENCES public.profiles(id),
  narrative TEXT,
  conversation_starter TEXT,
  composite_risk FLOAT8,
  pdf_url TEXT,
  week_start DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS POLICIES (Basic placeholders)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- TRIGGER FOR NEW AUTH USER -> PROFILE
-- This ensures a profile is created automatically when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, module)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'role', new.raw_user_meta_data->>'module');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
