ALTER TYPE public.entitlement_key
ADD VALUE IF NOT EXISTS 'priority_interest';

CREATE TABLE IF NOT EXISTS public.priority_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entitlement_id UUID NOT NULL REFERENCES public.user_entitlements(id),
    sender_id VARCHAR(64) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    expires_at TIMESTAMP,
    CONSTRAINT uq_priority_interest_entitlement UNIQUE (entitlement_id),
    CONSTRAINT uq_priority_interest_sender_target UNIQUE (sender_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_priority_interests_target_active
ON public.priority_interests (target_id, expires_at);

INSERT INTO public.product_catalog
    (id, name, description, type, amount_npr, daily_limit, is_active)
VALUES
    ('priority_interest', 'Priority Interest',
    'Stand out in one target profile''s daily matches for 24 hours.',
     'one_time', 149, NULL, true)
ON CONFLICT (id) DO NOTHING;
