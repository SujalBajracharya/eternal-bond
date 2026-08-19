ALTER TABLE public.user_entitlements
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP;

UPDATE public.user_entitlements
SET activated_at = COALESCE(created_at, granted_at)
WHERE entitlement_key = 'profile_boost'
  AND grant_type IS NULL
  AND is_active = true
  AND is_consumed = false
  AND activated_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_profile_boost_per_user
ON public.user_entitlements (user_id)
WHERE entitlement_key = 'profile_boost'
  AND is_active = true
  AND is_consumed = false
  AND activated_at IS NOT NULL;