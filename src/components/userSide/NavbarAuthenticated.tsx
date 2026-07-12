import { useState, useEffect } from "react";
import { Heart, LogOut, User } from "lucide-react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NavbarAuthenticated = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.avatar_url) setProfilePhoto(data.avatar_url);
      });
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `transition-colors ${
      isActive ? "text-primary font-semibold" : "hover:text-primary"
    }`;

  return (
    <header className="sticky top-0 z-50">
      <div className="container py-5">
        <nav className="flex items-center justify-between rounded-full backdrop-blur-xl border border-border/60 px-5 py-3 shadow-soft">
          {/* Logo */}
          <Link to="/today" className="flex items-center gap-2 group">
            <span className="relative grid place-items-center w-9 h-9 rounded-full bg-gradient-sunset text-primary-foreground shadow-soft transition-transform duration-500 group-hover:rotate-12">
              <Heart className="w-4 h-4 fill-current" />
              <span className="absolute inset-0 rounded-full ring-2 ring-primary/40 animate-[pulse-ring_2.4s_ease-out_infinite]" />
            </span>

            <span className="font-serif text-xl font-semibold tracking-tight">
              Eternal<span className="text-primary">Bond</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/80">
            <NavLink to="/" className={navLinkClass}>
              Constellation
            </NavLink>

            <NavLink to="/today" className={navLinkClass}>
              For You
            </NavLink>

            <NavLink to="/matches" className={navLinkClass}>
              Connections
            </NavLink>

            <NavLink to="/notifications" className={navLinkClass}>
              Notifications
            </NavLink>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `inline-flex items-center justify-center rounded-full transition-all duration-300
   ${
     isActive
       ? "ring-2 ring-primary"
       : "hover:scale-105 hover:shadow-md hover:ring-2 hover:ring-primary/30"
   }`
              }
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border border-border"
                />
              ) : (
                <User className="w-4 h-4" />
              )}
            </NavLink>

            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-all duration-500 shadow-soft hover:scale-[1.03]"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default NavbarAuthenticated;
