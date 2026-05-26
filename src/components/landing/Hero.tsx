import heroCouple from "@/assets/hero-couple.png";
import { useParallax } from "@/hooks/use-parallax";
import { ArrowRight, Heart, Sparkles, Star } from "lucide-react";

const Hero = () => {
  const y = useParallax();

  return (
    <section className="relative pt-36 pb-32 overflow-hidden grain">
      {/* Background blobs */}
      <div
        className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-gradient-warm opacity-80 animate-blob blur-2xl"
        style={{ transform: `translate3d(0, ${y * 0.15}px, 0)` }}
        aria-hidden
      />
      <div
        className="absolute top-40 -right-40 w-[460px] h-[460px] bg-gradient-blush opacity-90 animate-blob blur-2xl"
        style={{ animationDelay: "2s", transform: `translate3d(0, ${y * -0.1}px, 0)` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" aria-hidden />

      <div className="container relative">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          {/* LEFT: Text composition */}
          <div className="lg:col-span-7 relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card/80 backdrop-blur border border-border shadow-soft text-xs font-medium animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Trusted by 2M+ families across 40 countries
            </div>

            <h1 className="mt-6 font-serif text-[clamp(3rem,7vw,6rem)] leading-[0.95] font-medium tracking-tight">
              <span className="block animate-fade-in-up">Where two</span>
              <span className="block italic text-gradient-sunset animate-fade-in-up [animation-delay:120ms]">
                heartbeats
              </span>
              <span className="block animate-fade-in-up [animation-delay:240ms]">
                find their{" "}
                <span className="relative inline-block">
                  rhythm
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 200 12"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M2 8 Q 50 -2, 100 6 T 198 4"
                      stroke="hsl(var(--primary))"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                .
              </span>
            </h1>

            <p className="mt-8 text-lg text-muted-foreground max-w-md animate-fade-in-up [animation-delay:380ms]">
              EternalBond is a thoughtful matrimonial experience — handcrafted matchmaking,
              cultural depth, and honest conversations that lead to lifelong partnerships.
            </p>

            {/* CTA cluster - non-rectangular */}
            <div className="mt-10 flex flex-wrap items-center gap-5 animate-fade-in-up [animation-delay:520ms]">
              <a
                href="#begin"
                className="group relative inline-flex items-center gap-3 pl-6 pr-2 py-2 rounded-full bg-foreground text-background shadow-glow hover:shadow-soft transition-all duration-500 hover:-translate-y-0.5"
              >
                <span className="font-semibold">Create your profile</span>
                <span className="grid place-items-center w-11 h-11 rounded-full bg-gradient-sunset transition-transform duration-500 group-hover:rotate-45">
                  <ArrowRight className="w-4 h-4 text-primary-foreground" />
                </span>
              </a>

              <a href="#story" className="group inline-flex items-center gap-2 text-sm font-medium">
                <span className="relative w-10 h-10 grid place-items-center rounded-full border border-border bg-card transition-colors group-hover:bg-secondary">
                  <Heart className="w-4 h-4 text-primary fill-primary" />
                </span>
                Watch our story
              </a>
            </div>

            {/* Stat strip */}
            <div className="mt-12 flex flex-wrap gap-8 animate-fade-in-up [animation-delay:680ms]">
              {[
                { n: "184k", l: "Successful matches" },
                { n: "97%", l: "Verified profiles" },
                { n: "4.9★", l: "Family rating" },
              ].map((s) => (
                <div key={s.l} className="">
                  <div className="font-serif text-3xl font-semibold">{s.n}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Layered illustration composition */}
          <div className="lg:col-span-5 relative h-[560px] lg:h-[640px]">
            {/* Soft backplate */}
            <div
              className="absolute inset-4 bg-gradient-sunset rounded-[42%_58%_63%_37%/41%_44%_56%_59%] animate-blob shadow-glow"
              style={{ transform: `translate3d(0, ${y * -0.08}px, 0)` }}
              aria-hidden
            />
            {/* Decorative ring */}
            <div className="absolute inset-0 grid place-items-center pointer-events-none" aria-hidden>
              <div className="w-[92%] h-[92%] rounded-full border border-dashed border-primary/30 animate-spin-slow" />
            </div>

            {/* Couple */}
            <img
              src={heroCouple}
              alt="Stylized illustration of a couple holding hands"
              width={1024}
              height={1024}
              className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl animate-float-slow"
              style={{ transform: `translate3d(0, ${y * -0.05}px, 0)` }}
            />

            {/* Floating chip — verified */}
            <div className="absolute top-6 -left-2 lg:-left-8 bg-card rounded-2xl shadow-card px-4 py-3 flex items-center gap-3 animate-float-mid">
              <div className="w-9 h-9 rounded-full bg-sage/20 grid place-items-center">
                <Heart className="w-4 h-4 text-sage fill-sage" />
              </div>
              <div className="text-left">
                <div className="text-xs text-muted-foreground">Profile verified</div>
                <div className="text-sm font-semibold">Aanya & Rohan</div>
              </div>
            </div>

            {/* Floating chip — match */}
            <div className="absolute bottom-10 -right-2 lg:-right-6 bg-card rounded-2xl shadow-card px-4 py-3 animate-float-tiny">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                Compatibility
              </div>
              <div className="mt-1 font-serif text-2xl font-semibold text-primary">96%</div>
            </div>

            {/* Floating heart bubble */}
            <div className="absolute top-1/3 -right-4 w-12 h-12 rounded-full bg-card shadow-soft grid place-items-center animate-float-slow">
              <Heart className="w-5 h-5 text-primary fill-primary" />
            </div>
            <div className="absolute bottom-1/4 left-0 w-8 h-8 rounded-full bg-accent/30 grid place-items-center animate-float-mid">
              <Sparkles className="w-3.5 h-3.5 text-accent-foreground" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
