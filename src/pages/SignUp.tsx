import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import AuthLayout from "@/components/auth/AuthLayout";
import SocialButtons from "@/components/auth/SocialButtons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { signupUser } from "@/api/auth";

const emailSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long"),
});

const SignUp = () => {
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [emailSent, setEmailSent] = useState<string | null>(null);

  // email form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse({ fullName, email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const response = await signupUser({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        password: parsed.data.password,
      });
      toast.success(response.message || "User registered successfully");
      setEmailSent(parsed.data.email);
    } catch (error: any) {
      toast.error(error.message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <AuthLayout
        side="left"
        title="Check your inbox"
        subtitle="One last step to unlock your story"
      >
        <div className="text-center py-4 space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-sunset grid place-items-center shadow-soft">
            <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <p className="text-foreground/85">
              We sent a confirmation link to
            </p>
            <p className="font-serif text-lg text-primary mt-1">{emailSent}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Click the link in the email to verify your account, then sign in to begin.
          </p>
          <div className="pt-2 space-y-2">
            <Link to="/signin">
              <Button className="w-full h-11 rounded-full bg-foreground text-background hover:bg-primary hover:text-primary-foreground">
                Go to sign in
              </Button>
            </Link>
            <button
              onClick={() => setEmailSent(null)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Use a different email
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      side="left"
      title="Begin your story"
      subtitle="Create an account to find your match"
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

      <form onSubmit={handleEmailSignUp} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Aanya Sharma"
            className="h-11 rounded-xl"
            required
          />
        </div>
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
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
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
              Create account
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-7">
        Already have an account?{" "}
        <Link to="/signin" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>

      <p className="text-center text-[11px] text-muted-foreground/80 mt-4 leading-relaxed">
        By continuing you agree to our{" "}
        <a href="#" className="underline">Terms</a> and{" "}
        <a href="#" className="underline">Privacy Policy</a>.
      </p>
    </AuthLayout>
  );
};

export default SignUp;
