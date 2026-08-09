import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import AuthLayout from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { forgotPassword } from "@/api/auth";

const emailSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
});

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    
    setLoading(true);
    try {
      await forgotPassword(parsed.data.email);
      setSubmitted(true);
      toast.success("If an account exists, a reset link has been sent.");
    } catch (error: any) {
      toast.error(error.message || "Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      side="right"
      title="Reset Password"
      subtitle="Enter your email to receive a reset link"
    >
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-full bg-gradient-sunset text-primary-foreground hover:opacity-95 shadow-soft font-semibold"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>
      ) : (
        <div className="text-center space-y-4">
          <div className="bg-primary/10 text-primary p-4 rounded-xl">
            <p>
              We've sent a password reset link to <strong>{email}</strong> if it exists in our system.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Please check your email and click the link to reset your password.
          </p>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link
          to="/signin"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
