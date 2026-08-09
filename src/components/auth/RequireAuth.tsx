import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children: ReactNode;
  /** If true, requires profile_completed = true; otherwise redirects to /onboarding */
  requireProfile?: boolean;
}

/**
 * Auth gate:
 *  - Not signed in → /signin
 *  - Email user without confirmed_at → /verify-email
 *  - Signed in but profile_completed=false (and requireProfile) → /onboarding
 */
const RequireAuth = ({ children, requireProfile = true }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    if (!user) {
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    supabase
      .from("profiles")
      .select("profile_completed")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setProfileCompleted(data?.profile_completed ?? false);
        setProfileLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (loading || (user && profileLoading)) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  // Email verification gate (only for email-based accounts)
  const isEmailUser = !!user.email && !user.phone;
  if (isEmailUser && !user.email_confirmed_at && !user.confirmed_at) {
    return <Navigate to="/verify-email" replace />;
  }

  const isOnboardingCompletedLocally = localStorage.getItem("onboardingCompleted") === "true";

  if (requireProfile && !isOnboardingCompletedLocally && profileCompleted === false && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
