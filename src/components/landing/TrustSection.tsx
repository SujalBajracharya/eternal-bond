import trust from "@/assets/illust-trust.png";
import { ShieldCheck, BadgeCheck, Eye } from "lucide-react";

const TrustSection = () => {
  return (
    <section id="story" className="relative py-32 overflow-hidden">
      <div
        className="absolute -left-24 top-20 w-72 h-72 rounded-full bg-secondary blur-3xl opacity-70"
        aria-hidden
      />
      <div className="container relative">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left: Illustration in offset card */}
          <div className="lg:col-span-5 relative reveal-scale">
            <div className="relative">
              <div
                className="absolute -inset-6 bg-gradient-warm rounded-5xl rotate-[-4deg]"
                aria-hidden
              />
              <div className="relative bg-card rounded-5xl p-8 shadow-card rotate-[2deg] hover:rotate-0 transition-transform duration-700">
                <img
                  src={trust}
                  alt="Shield with heart symbolizing trust"
                  width={1024}
                  height={1024}
                  loading="lazy"
                  className="w-full h-auto animate-float-slow"
                />
              </div>
              {/* Sticker */}
              <div className="absolute -bottom-4 -right-4 bg-foreground text-background rounded-full px-5 py-3 shadow-glow rotate-[6deg] hover:rotate-0 transition-transform duration-500">
                <div className="font-serif italic text-sm">100% verified</div>
              </div>
            </div>
          </div>

          {/* Right: Story text + cards */}
          <div className="lg:col-span-7 reveal">
            <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">
              Chapter one — Trust
            </span>
            <h2 className="mt-3 font-serif text-5xl md:text-6xl leading-[1.05] font-medium">
              A safe space where{" "}
              <span className="italic text-gradient-sunset">
                families feel seen
              </span>
              .
            </h2>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Every profile is hand-verified. Every conversation is private.
              Built with the gentle care of a family elder and the precision of
              modern technology.
            </p>

            <div className="mt-10 grid sm:grid-cols-3 gap-4">
              {[
                { icon: ShieldCheck, t: "ID verified", d: "Govt. checks" },
                {
                  icon: BadgeCheck,
                  t: "Family screened",
                  d: "Real introductions",
                },
                { icon: Eye, t: "Private mode", d: "You decide visibility" },
              ].map((c, i) => (
                <div
                  key={c.t}
                  className="reveal group relative p-5 rounded-3xl bg-card border border-border/70 hover:border-primary/40 hover:-translate-y-1 transition-all duration-500 shadow-soft"
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-warm grid place-items-center mb-3 group-hover:rotate-6 transition-transform">
                    <c.icon className="w-5 h-5 text-primary-deep" />
                  </div>
                  <div className="font-semibold">{c.t}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {c.d}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
