import { ArrowRight, Heart } from "lucide-react";

const CTASection = () => {
  return (
    <section id="begin" className="py-32 relative overflow-hidden">
      <div className="container">
        <div className="relative reveal-scale rounded-5xl bg-gradient-sunset p-10 md:p-20 shadow-glow overflow-hidden grain">
          {/* decorative shapes */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-card/20 rounded-full blur-3xl" aria-hidden />
          <div className="absolute -bottom-20 -left-10 w-60 h-60 bg-foreground/10 rounded-full blur-3xl" aria-hidden />
          <div className="absolute top-10 right-16 animate-float-slow" aria-hidden>
            <Heart className="w-8 h-8 text-primary-foreground/40 fill-current" />
          </div>
          <div className="absolute bottom-12 left-20 animate-float-mid" aria-hidden>
            <Heart className="w-5 h-5 text-primary-foreground/30 fill-current" />
          </div>

          <div className="relative max-w-3xl">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-primary-foreground/80">
              Begin your chapter
            </span>
            <h2 className="mt-4 font-serif text-5xl md:text-7xl text-primary-foreground leading-[1.02] font-medium">
              Forever <em className="not-italic">starts</em> with a single,{" "}
              <span className="italic">brave hello</span>.
            </h2>
            <p className="mt-6 text-lg text-primary-foreground/90 max-w-xl">
              Join EternalBond today and meet someone who feels like home — at your pace,
              with your people, the way it should be.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#"
                className="group inline-flex items-center gap-3 pl-6 pr-2 py-2 rounded-full bg-foreground text-background hover:scale-[1.03] transition-transform duration-500 shadow-soft"
              >
                <span className="font-semibold">Create free profile</span>
                <span className="grid place-items-center w-11 h-11 rounded-full bg-card text-foreground transition-transform duration-500 group-hover:rotate-45">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </a>
              <a
                href="#"
                className="px-6 py-3 rounded-full border border-primary-foreground/30 text-primary-foreground font-medium hover:bg-primary-foreground/10 transition-colors"
              >
                Talk to a matchmaker
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
