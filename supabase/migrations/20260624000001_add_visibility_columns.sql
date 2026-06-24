-- Migration to add photo_visibility and profile_visibility columns to public.profiles table
-- This prevents Hibernate startup DDL errors on tables containing existing rows.

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS photo_visibility varchar(255) NOT NULL DEFAULT 'everyone' CHECK (photo_visibility IN ('everyone','verified_only','matches_only','premium_only')),
  ADD COLUMN IF NOT EXISTS profile_visibility varchar(255) NOT NULL DEFAULT 'everyone' CHECK (profile_visibility IN ('everyone','verified_only','matches_only','premium_only'));
