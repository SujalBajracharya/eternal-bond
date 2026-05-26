const stories = [
  {
    name: "Aarav & Priya",
    place: "Mumbai → Toronto",
    quote:
      "We met for chai over a video call and never stopped talking. Married within a year — our families became one before we did.",
    accent: "bg-gradient-warm",
  },
  {
    name: "Zayn & Hira",
    place: "Karachi",
    quote:
      "EternalBond felt unhurried. The team actually checked in, asked questions, and helped us see what mattered.",
    accent: "bg-gradient-blush",
  },
  {
    name: "Ravi & Anjali",
    place: "Hyderabad",
    quote:
      "The compatibility report was uncanny. We laughed reading it together on our third date. We're now five years in.",
    accent: "bg-gradient-sunset text-primary-foreground",
  },
];

const Stories = () => {
  return (
    <section id="voices" className="py-32 bg-secondary/40 relative overflow-hidden">
      <div className="container">
        <div className="flex items-end justify-between flex-wrap gap-6 reveal">
          <div className="max-w-xl">
            <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">
              Chapter four — Voices
            </span>
            <h2 className="mt-3 font-serif text-5xl md:text-6xl leading-[1.05] font-medium">
              Real stories,{" "}
              <span className="italic text-gradient-sunset">honestly told</span>.
            </h2>
          </div>
          <div className="text-sm text-muted-foreground max-w-xs">
            184,000+ couples have begun forever with us. These are just three.
          </div>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {stories.map((s, i) => (
            <article
              key={s.name}
              className={`reveal group relative rounded-5xl p-8 shadow-card transition-all duration-700 hover:-translate-y-2 ${s.accent} ${
                i === 1 ? "md:translate-y-10" : ""
              }`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <svg className="w-10 h-10 opacity-50 mb-4" viewBox="0 0 32 32" fill="currentColor" aria-hidden>
                <path d="M10 8C5 8 2 12 2 17v7h10V14H7c0-3 2-4 5-4V8zm18 0c-5 0-8 4-8 9v7h10V14h-5c0-3 2-4 5-4V8z" />
              </svg>
              <p className="font-serif text-xl leading-snug">"{s.quote}"</p>
              <div className="mt-8 pt-6 border-t border-current/20 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm opacity-70">{s.place}</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-card/40 backdrop-blur grid place-items-center font-serif font-semibold">
                  {s.name[0]}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stories;
