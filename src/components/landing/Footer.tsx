import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-16 border-t border-border/60">
      <div className="container">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid place-items-center w-9 h-9 rounded-full bg-gradient-sunset text-primary-foreground">
                <Heart className="w-4 h-4 fill-current" />
              </span>
              <span className="font-serif text-xl font-semibold">
                Eternal<span className="text-primary">Bond</span>
              </span>
            </div>
            <p className="mt-4 text-muted-foreground max-w-sm">
              A thoughtful matrimonial experience — handcrafted matchmaking, cultural
              depth, and conversations that lead to lifelong partnerships.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold mb-3">Explore</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">How it works</a></li>
              <li><a href="#" className="hover:text-primary">Compatibility</a></li>
              <li><a href="#" className="hover:text-primary">Success stories</a></li>
              <li><a href="#" className="hover:text-primary">Pricing</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold mb-3">Care</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Safety</a></li>
              <li><a href="#" className="hover:text-primary">Privacy</a></li>
              <li><a href="#" className="hover:text-primary">Help center</a></li>
              <li><a href="#" className="hover:text-primary">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-border/60 flex flex-wrap justify-between gap-4 text-xs text-muted-foreground">
          <div>© 2026 EternalBond. Made with care for forever.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary">Terms</a>
            <a href="#" className="hover:text-primary">Privacy</a>
            <a href="#" className="hover:text-primary">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
