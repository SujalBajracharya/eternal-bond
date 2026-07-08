import compat from "@/assets/illust-compatibility.png";
import { Sparkles } from "lucide-react";

const traits = [
  { label: "Values", value: 94, color: "bg-primary" },
  { label: "Lifestyle", value: 88, color: "bg-accent" },
  { label: "Family rhythm", value: 91, color: "bg-plum" },
  { label: "Future vision", value: 97, color: "bg-sage" },
];

const Compatibility = () => {
  return (
    <section id="match" className="relative py-32 overflow-hidden">
      {/* organic backdrop */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] aspect-square bg-gradient-blush rounded-full opacity-60 -z-10"
        aria-hidden
      />

      <div className="container">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          {/* Left text */}
          <div className="lg:col-span-6 reveal">
            <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">
              Chapter three — Compatibility
            </span>
            <h2 className="mt-3 font-serif text-5xl md:text-6xl leading-[1.02] font-medium">
              Matchmaking that{" "}
              <span className="italic text-gradient-sunset">
                listens deeply
              </span>
              .
            </h2>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg">
              Our compatibility engine reads between the lines — temperament,
              traditions, ambitions — to introduce you to people who genuinely
              fit your life.
            </p>

            {/* Trait bars */}
            <div className="mt-10 space-y-5 max-w-md">
              {traits.map((t, i) => (
                <div
                  key={t.label}
                  className="reveal"
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="font-medium">{t.label}</span>
                    <span className="font-serif text-xl">{t.value}%</span>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${t.color} rounded-full transition-all duration-[1400ms] ease-out`}
                      style={{ width: `${t.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: large illustration with floating cards */}
          <div className="lg:col-span-6 relative reveal-scale">
            <div className="relative aspect-square">
              <div
                className="absolute inset-8 bg-gradient-warm rounded-[58%_42%_55%_45%/45%_55%_45%_55%] animate-blob shadow-glow"
                aria-hidden
              />
              <img
                src={compat}
                alt="Heart-shaped puzzle pieces fitting together"
                width={1024}
                height={1024}
                loading="lazy"
                className="relative w-full h-full object-contain animate-float-slow"
              />

              {/* Floating profile card */}
              <div className="absolute top-4 -left-4 lg:-left-10 bg-card rounded-3xl p-4 shadow-card animate-float-mid w-52">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full bg-gradient-sunset"
                    aria-hidden
                  />
                  <div>
                    <div className="text-sm font-semibold">Meera, 28</div>
                    <div className="text-xs text-muted-foreground">
                      Bhaktapur · Designer
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-primary font-semibold">
                  <Sparkles className="w-3 h-3" /> 94% in tune
                </div>
              </div>

              {/* Floating quote */}
              <div className="absolute bottom-6 -right-2 lg:-right-8 bg-foreground text-background rounded-3xl p-5 shadow-glow max-w-[230px] rotate-[3deg] hover:rotate-0 transition-transform duration-500">
                <div className="font-serif italic text-lg leading-snug">
                  "It felt less like an algorithm, more like a thoughtful
                  friend."
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Compatibility;
