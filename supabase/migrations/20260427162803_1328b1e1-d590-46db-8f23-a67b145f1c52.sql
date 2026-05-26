-- Lock down SECURITY DEFINER functions
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.set_updated_at() from anon, authenticated, public;
revoke execute on function public.has_role(uuid, public.app_role) from anon, public;

-- has_role still needs to be callable by authenticated users (for RLS policies)
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- Ensure search_path on set_updated_at
alter function public.set_updated_at() set search_path = public;