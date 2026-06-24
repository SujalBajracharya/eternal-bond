ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS citizenship_front_url text,
  ADD COLUMN IF NOT EXISTS citizenship_back_url text;
