-- Enums for new structured fields
DO $$ BEGIN
  CREATE TYPE public.family_type AS ENUM ('joint', 'nuclear', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.kyc_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.income_range AS ENUM (
    'under_5l',
    '5l_10l',
    '10l_20l',
    '20l_50l',
    '50l_1cr',
    'above_1cr',
    'prefer_not_to_say'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.education_level AS ENUM (
    'high_school',
    'diploma',
    'bachelors',
    'masters',
    'doctorate',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- New profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS highest_education public.education_level,
  ADD COLUMN IF NOT EXISTS income_range public.income_range,
  ADD COLUMN IF NOT EXISTS father_occupation text,
  ADD COLUMN IF NOT EXISTS mother_occupation text,
  ADD COLUMN IF NOT EXISTS siblings text,
  ADD COLUMN IF NOT EXISTS family_type public.family_type,
  ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS kundali_name text,
  ADD COLUMN IF NOT EXISTS kundali_url text,
  ADD COLUMN IF NOT EXISTS kyc_status public.kyc_status NOT NULL DEFAULT 'unverified';

-- Storage bucket for profile photos & kundali (private; signed URLs / RLS-controlled)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: each user manages only their own folder (path prefix = user id)
DROP POLICY IF EXISTS "Profile photos are viewable by everyone" ON storage.objects;
CREATE POLICY "Profile photos are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Users can upload own profile photos" ON storage.objects;
CREATE POLICY "Users can upload own profile photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update own profile photos" ON storage.objects;
CREATE POLICY "Users can update own profile photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete own profile photos" ON storage.objects;
CREATE POLICY "Users can delete own profile photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);