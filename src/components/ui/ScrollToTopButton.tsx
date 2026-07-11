import { ArrowUp, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 350);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: -20, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className="group fixed bottom-8 right-8 z-50"
    >
      {/* Glow */}
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Button */}
      <div className="relative flex h-12 w-12 items-center overflow-hidden rounded-full border border-border/60 bg-card/70 backdrop-blur-xl shadow-soft transition-all duration-500 ease-out group-hover:w-40 group-hover:border-primary/40 group-hover:shadow-lg animate-[float_3s_ease-in-out_infinite]">
        {/* Icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center">
          <ArrowUp className="h-5 w-5 transition-all duration-500 group-hover:-translate-y-1" />
        </div>

        {/* Text */}
        <span className="whitespace-nowrap text-sm font-medium opacity-0 -translate-x-2 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100">
          Back to Top
        </span>

        {/* Sparkle */}
        <Sparkles className="absolute right-3 h-3.5 w-3.5 text-primary opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:rotate-180" />
      </div>
    </button>
  );
};

export default ScrollToTopButton;
