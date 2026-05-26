const logos = [
  "Vogue",
  "Forbes",
  "TechCrunch",
  "The Times",
  "Wired",
  "Elle",
  "GQ",
  "Hindustan",
];

const Marquee = () => {
  return (
    <section className="py-10 border-y border-border/60 bg-card/60 backdrop-blur">
      <div className="container flex items-center gap-6">
        <span className="hidden md:block text-xs uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
          Featured in
        </span>
        <div className="overflow-hidden ticker-mask flex-1">
          <div className="flex gap-14 marquee-track w-max">
            {[...logos, ...logos].map((l, i) => (
              <span
                key={i}
                className="font-serif text-2xl text-foreground/40 hover:text-foreground transition-colors whitespace-nowrap"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Marquee;
