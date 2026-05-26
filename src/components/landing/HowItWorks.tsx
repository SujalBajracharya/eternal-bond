import chat from "@/assets/illust-chat.png";

const steps = [
  {
    n: "01",
    t: "Tell us your story",
    d: "Build a soulful profile — values, traditions, dreams. Not a checklist.",
    color: "bg-gradient-warm",
  },
  {
    n: "02",
    t: "Meet thoughtful matches",
    d: "Our model blends temperament, lifestyle, and family fit — daily, never overwhelming.",
    color: "bg-gradient-blush",
  },
  {
    n: "03",
    t: "Talk, meet, decide",
    d: "Private chats, video meetings, optional family rooms — at your pace.",
    color: "bg-gradient-plum text-plum-foreground",
  },
];

const HowItWorks = () => {
  return (
    <section id="how" className="relative py-32 bg-secondary/40 overflow-hidden">
      <div className="container relative">
        <div className="max-w-2xl reveal">
          <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">
            Chapter two — Connection
          </span>
          <h2 className="mt-3 font-serif text-5xl md:text-6xl leading-[1.05] font-medium">
            Three quiet steps,{" "}
            <span className="italic">one extraordinary</span> beginning.
          </h2>
        </div>

        {/* Asymmetrical grid: 3 steps + floating illustration */}
        <div className="mt-16 grid lg:grid-cols-12 gap-6">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className={`reveal relative rounded-5xl p-8 shadow-card overflow-hidden transition-all duration-700 hover:-translate-y-2 ${s.color} ${
                i === 0 ? "lg:col-span-5 lg:row-span-2 min-h-[360px]" : i === 1 ? "lg:col-span-4 lg:translate-y-12" : "lg:col-span-3"
              }`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div className="font-serif text-7xl font-semibold opacity-30">{s.n}</div>
              <h3 className="mt-4 font-serif text-2xl font-semibold leading-tight">{s.t}</h3>
              <p className="mt-3 text-sm opacity-80 max-w-xs">{s.d}</p>
              <div
                className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-card/30 blur-2xl"
                aria-hidden
              />
            </div>
          ))}
        </div>

        {/* Wide illustration card */}
        <div className="mt-16 grid lg:grid-cols-12 gap-6 items-center reveal">
          <div className="lg:col-span-5 order-2 lg:order-1">
            <h3 className="font-serif text-3xl md:text-4xl leading-tight">
              Conversations that feel like <em className="text-primary not-italic font-medium">home</em>.
            </h3>
            <p className="mt-4 text-muted-foreground">
              Smart prompts, voice notes, and shared rituals turn first messages into
              meaningful dialogue. No swipes. No noise.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Voice notes", "Shared rituals", "Family room", "Translation"].map((t) => (
                <span
                  key={t}
                  className="px-4 py-1.5 rounded-full bg-card border border-border text-sm hover:border-primary hover:text-primary transition-colors"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="lg:col-span-7 order-1 lg:order-2 relative">
            <div className="relative bg-card rounded-5xl p-8 shadow-card">
              <div className="absolute top-6 left-6 flex gap-1.5" aria-hidden>
                <span className="w-2.5 h-2.5 rounded-full bg-primary/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-accent/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-sage/40" />
              </div>
              <img
                src={chat}
                alt="Two people chatting on phones"
                width={1024}
                height={1024}
                loading="lazy"
                className="w-full h-auto animate-float-tiny"
              />
              {/* floating message bubbles */}
              <div className="absolute top-12 right-6 bg-gradient-sunset text-primary-foreground px-4 py-2 rounded-2xl rounded-br-sm text-sm shadow-soft animate-float-mid">
                "Tea or coffee person?" ☕
              </div>
              <div className="absolute bottom-16 left-6 bg-card border border-border px-4 py-2 rounded-2xl rounded-bl-sm text-sm shadow-soft animate-float-slow">
                Both. Depends on the season 🍂
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
