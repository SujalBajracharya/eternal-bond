import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

interface Props {
  children: ReactNode;
  title: string;
  subtitle: string;
  side: "left" | "right";
}

const AuthLayout = ({ children, title, subtitle, side }: Props) => {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-gradient-sunset opacity-30 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 w-[32rem] h-[32rem] rounded-full bg-gradient-plum opacity-20 blur-3xl animate-blob [animation-delay:2s]" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-gradient-warm opacity-40 blur-3xl animate-blob [animation-delay:4s]" />

      <div className="relative z-10 grid lg:grid-cols-2 min-h-screen">
        {/* Storytelling side */}
        <aside
          className={`hidden lg:flex flex-col justify-between p-12 xl:p-16 ${
            side === "right" ? "order-2" : "order-1"
          }`}
        >
          <Link to="/" className="flex items-center gap-2 group w-fit">
            <span className="grid place-items-center w-10 h-10 rounded-full bg-gradient-sunset text-primary-foreground shadow-soft transition-transform duration-500 group-hover:rotate-12">
              <Heart className="w-4 h-4 fill-current" />
            </span>
            <span className="font-serif text-2xl font-semibold tracking-tight">
              Eternal<span className="text-primary">Bond</span>
            </span>
          </Link>

          <div className="space-y-8 max-w-md">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/70 backdrop-blur border border-border/60 text-xs font-medium tracking-wide uppercase text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Where stories begin
              </span>
              <h2 className="font-serif text-5xl xl:text-6xl leading-[1.05] tracking-tight">
                Every <em className="text-primary not-italic">heartbeat</em> finds its rhythm.
              </h2>
              <p className="text-foreground/70 text-lg leading-relaxed">
                Join thousands who found their forever through thoughtful matchmaking,
                verified profiles, and meaningful conversations.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-sm">
              {[
                { n: "120k", l: "Hearts joined" },
                { n: "96%", l: "Compatibility" },
                { n: "42", l: "Cultures" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-2xl bg-card/70 backdrop-blur border border-border/60 p-4 shadow-soft"
                >
                  <div className="font-serif text-2xl text-primary">{s.n}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
                </div>
              ))}
            </div>

            <figure className="rounded-3xl bg-card/70 backdrop-blur border border-border/60 p-6 shadow-soft">
              <blockquote className="font-serif text-lg italic leading-snug text-foreground/85">
                "Within three weeks, we were planning our first chai together. A year later, our wedding."
              </blockquote>
              <figcaption className="mt-3 text-sm text-muted-foreground">
                — Aanya & Rohan, Bengaluru
              </figcaption>
            </figure>
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} EternalBond · Crafted with care
          </p>
        </aside>

        {/* Form side */}
        <section
          className={`flex items-center justify-center p-6 sm:p-10 ${
            side === "right" ? "order-1" : "order-2"
          }`}
        >
          <div className="w-full max-w-md">
            <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
              <span className="grid place-items-center w-9 h-9 rounded-full bg-gradient-sunset text-primary-foreground shadow-soft">
                <Heart className="w-4 h-4 fill-current" />
              </span>
              <span className="font-serif text-xl font-semibold">
                Eternal<span className="text-primary">Bond</span>
              </span>
            </Link>

            <div className="rounded-3xl bg-card/80 backdrop-blur-xl border border-border/60 shadow-soft p-7 sm:p-9">
              <header className="mb-6">
                <h1 className="font-serif text-3xl tracking-tight">{title}</h1>
                <p className="text-muted-foreground text-sm mt-1.5">{subtitle}</p>
              </header>
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AuthLayout;
