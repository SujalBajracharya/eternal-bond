import { supabase } from "@/integrations/supabase/client";

/**
 * Determines where to send the user after a successful auth event.
 * - Email user without confirmation → /verify-email
 * - Profile not completed → /onboarding
 * - Otherwise → /
 */
export async function resolvePostAuthDestination(): Promise<string> {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return "/onboarding";


  const isEmailUser = !!user.email && !user.phone;
  if (isEmailUser && !user.email_confirmed_at && !user.confirmed_at) {
    return "/verify-email";
  }

  // If local storage says they completed onboarding, bypass DB check to ensure they go to home
  if (localStorage.getItem("onboardingCompleted") === "true") {
    return "/";
  }

  const { data } = await supabase
    .from("profiles")
    .select("profile_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (!data?.profile_completed) return "/onboarding";
  
  // They completed it in the DB, so set local flag for future
  localStorage.setItem("onboardingCompleted", "true");
  return "/";
}
