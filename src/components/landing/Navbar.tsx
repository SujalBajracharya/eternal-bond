import { Heart, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="container pt-5">
        <nav className="flex items-center justify-between rounded-full bg-card/70 backdrop-blur-xl border border-border/60 px-5 py-3 shadow-soft">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="relative grid place-items-center w-9 h-9 rounded-full bg-gradient-sunset text-primary-foreground shadow-soft transition-transform duration-500 group-hover:rotate-12">
              <Heart className="w-4 h-4 fill-current" />
              <span className="absolute inset-0 rounded-full ring-2 ring-primary/40 animate-[pulse-ring_2.4s_ease-out_infinite]" />
            </span>
            <span className="font-serif text-xl font-semibold tracking-tight">
              Eternal<span className="text-primary">Bond</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/80">
            <a href="#story" className="hover:text-primary transition-colors">Story</a>
            <a href="#how" className="hover:text-primary transition-colors">How it works</a>
            <a href="#match" className="hover:text-primary transition-colors">Compatibility</a>
            <a href="#voices" className="hover:text-primary transition-colors">Voices</a>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden sm:inline text-sm text-muted-foreground max-w-[160px] truncate">
                  {user.email ?? user.phone}
                </span>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-all duration-500 shadow-soft hover:scale-[1.03]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="hidden sm:inline-flex text-sm font-medium px-4 py-2 rounded-full hover:bg-secondary transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-semibold px-5 py-2.5 rounded-full bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-all duration-500 shadow-soft hover:scale-[1.03]"
                >
                  Begin
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
