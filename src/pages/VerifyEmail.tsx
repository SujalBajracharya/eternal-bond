import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MailCheck, Loader2, RefreshCw, LogOut } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VerifyEmail = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/signin", { replace: true });
      return;
    }
    if (user.email_confirmed_at || user.confirmed_at) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Poll for confirmation while user is on this page
  useEffect(() => {
    const i = setInterval(async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user?.email_confirmed_at || data.user?.confirmed_at) {
        await supabase.auth.refreshSession();
        navigate("/onboarding", { replace: true });
      }
    }, 4000);
    return () => clearInterval(i);
  }, [navigate]);

  const handleResend = async () => {
    if (!user?.email || cooldown > 0) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: { emailRedirectTo: window.location.origin },
    });
    setResending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Verification email sent");
    setCooldown(45);
  };

  return (
    <AuthLayout
      side="left"
      title="Verify your email"
      subtitle="One quick step before you begin"
    >
      <div className="text-center py-2 space-y-5">
        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-sunset grid place-items-center shadow-soft">
          <MailCheck className="w-8 h-8 text-primary-foreground" />
        </div>
        <div>
          <p className="text-foreground/85">We sent a confirmation link to</p>
          <p className="font-serif text-lg text-primary mt-1 break-all">
            {user?.email ?? "your inbox"}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Click the link in the email to verify. This page will continue
          automatically once you're verified.
        </p>

        <div className="space-y-2 pt-2">
          <Button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            variant="outline"
            className="w-full h-11 rounded-full"
          >
            {resending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
              </>
            )}
          </Button>
          <button
            onClick={async () => {
              await signOut();
              navigate("/signin");
            }}
            className="inline-flex items-center gap-1.5 mx-auto text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Sign out
          </button>
        </div>

        <p className="text-xs text-muted-foreground pt-2">
          Already verified?{" "}
          <Link to="/signin" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;
