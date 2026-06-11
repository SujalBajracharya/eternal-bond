import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import AuthLayout from "@/components/auth/AuthLayout";
import SocialButtons from "@/components/auth/SocialButtons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Mail, Phone, ArrowRight } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { resolvePostAuthDestination } from "@/lib/auth-redirect";

const emailSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(1, "Password is required").max(72),
});

const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{6,14}$/, "Enter phone in E.164 format (e.g. +14155552671)"),
});

type Mode = "email" | "phone";

const SignIn = () => {
  const navigate = useNavigate();
  // signIn() from useAuth calls the Spring Boot backend (/auth/signin) and stores the JWT.
  const { user, loading: authLoading, signIn } = useAuth();
  const [mode, setMode] = useState<Mode>("email");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Redirect if already logged in or process oauth token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("jwt_token", token);
      window.history.replaceState({}, document.title, window.location.pathname);
      toast.success("Welcome back");
      window.location.href = "/";
      return;
    }

    if (!authLoading && user) navigate("/", { replace: true });
  }, [user, authLoading, navigate]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      // FIX: Use signIn() from useAuth — this calls the Spring Boot backend at /auth/signin.
      // The old code called supabase.auth.signInWithPassword() which checks Supabase's own
      // auth.users table. But users are registered via Spring Boot into public.users — so
      // Supabase Auth never knew about them and always returned "Invalid email or password".
      await signIn(parsed.data.email, parsed.data.password);
      toast.success("Welcome back");
      navigate(await resolvePostAuthDestination(), { replace: true });
    } catch (error: any) {
      const msg: string = error?.message ?? "";
      if (msg.toLowerCase().includes("verify your email")) {
        toast.error("Please verify your email first. Check your inbox.");
      } else if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("password")) {
        toast.error("Invalid email or password.");
      } else if (msg) {
        toast.error(msg);
      } else {
        toast.error("Sign in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = phoneSchema.safeParse({ phone });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: parsed.data.phone,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOtpSent(true);
    toast.success("Code sent to your phone");
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    navigate(await resolvePostAuthDestination(), { replace: true });
  };

  return (
    <AuthLayout
      side="right"
      title="Welcome back"
      subtitle="Sign in to continue your journey"
    >
      <SocialButtons />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-card text-xs uppercase tracking-wider text-muted-foreground">
            or
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-secondary/60 border border-border/60 mb-5">
        <button
          type="button"
          onClick={() => {
            setMode("email");
            setOtpSent(false);
          }}
          className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-full transition-all ${
            mode === "email"
              ? "bg-card text-foreground shadow-soft"
              : "text-muted-foreground"
          }`}
        >
          <Mail className="w-3.5 h-3.5" /> Email
        </button>
        <button
          type="button"
          onClick={() => setMode("phone")}
          className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-full transition-all ${
            mode === "phone"
              ? "bg-card text-foreground shadow-soft"
              : "text-muted-foreground"
          }`}
        >
          <Phone className="w-3.5 h-3.5" /> Phone
        </button>
      </div>

      {mode === "email" ? (
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="h-11 rounded-xl"
              required
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a href="#" className="text-xs text-primary hover:underline">
                Forgot?
              </a>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="h-11 rounded-xl pr-11"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Toggle password visibility"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-full bg-gradient-sunset text-primary-foreground hover:opacity-95 shadow-soft font-semibold group"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Sign in
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </Button>
        </form>
      ) : !otpSent ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+14155552671"
              className="h-11 rounded-xl"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-full bg-gradient-sunset text-primary-foreground hover:opacity-95 shadow-soft font-semibold"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send verification code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div className="space-y-2">
            <Label>Enter the 6-digit code</Label>
            <p className="text-xs text-muted-foreground">Sent to {phone}</p>
            <div className="flex justify-center pt-2">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-full bg-gradient-sunset text-primary-foreground hover:opacity-95 shadow-soft font-semibold"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & sign in"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setOtpSent(false);
              setOtp("");
            }}
            className="block mx-auto text-xs text-muted-foreground hover:text-primary"
          >
            Use a different number
          </button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground mt-7">
        New to EternalBond?{" "}
        <Link to="/signup" className="text-primary font-semibold hover:underline">
          Begin your story
        </Link>
      </p>
    </AuthLayout>
  );
};

export default SignIn;
