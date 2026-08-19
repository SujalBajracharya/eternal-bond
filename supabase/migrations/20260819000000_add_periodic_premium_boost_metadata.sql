ALTER TABLE public.user_entitlements
ADD COLUMN IF NOT EXISTS grant_period VARCHAR(32),
ADD COLUMN IF NOT EXISTS grant_type VARCHAR(32);

CREATE UNIQUE INDEX IF NOT EXISTS uq_periodic_profile_boost_grant
ON public.user_entitlements (user_id, entitlement_key, grant_type, grant_period)
WHERE entitlement_key = 'profile_boost'
  AND grant_type IS NOT NULL
  AND grant_period IS NOT NULL;