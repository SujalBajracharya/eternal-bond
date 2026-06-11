import { Button } from "@/components/ui/button";
import { useState } from "react";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M12 10.2v3.84h5.34c-.24 1.38-1.62 4.05-5.34 4.05-3.21 0-5.83-2.66-5.83-5.94S8.79 6.21 12 6.21c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.7 3.66 14.55 2.7 12 2.7 6.84 2.7 2.7 6.84 2.7 12s4.14 9.3 9.3 9.3c5.37 0 8.93-3.78 8.93-9.09 0-.61-.07-1.08-.15-1.55H12z"
    />
  </svg>
);

const SocialButtons = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogle = () => {
    setLoading(true);

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
    // Redirect to Spring Boot OAuth endpoint
    window.location.href = `${apiBaseUrl}/oauth2/authorization/google`;
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogle}
      disabled={loading}
      className="w-full h-11 rounded-full border-border/70 bg-background/60 hover:bg-secondary font-medium"
    >
      <GoogleIcon />
      Continue with Google
    </Button>
  );
};

export default SocialButtons;