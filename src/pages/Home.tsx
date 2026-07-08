import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  Sparkles,
  MessageCircle,
  Compass,
  Gem,
  Moon,
  Heart,
  LogOut,
  BadgeCheck,
  Bell,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Node = {
  to: string;
  label: string;
  whisper: string;
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  angle: number; // degrees
  badge?: number;
  badgeLabel?: string;
};

const BASE_NODES: Omit<Node, "angle">[] = [
  {
    to: "/today",
    label: "Today",
    whisper: "5 souls chosen at sunrise",
    icon: Sparkles,
    badge: 5,
    badgeLabel: "new",
  },
  {
    to: "/matches",
    label: "Matches",
    whisper: "Hearts that answered back",
    icon: Heart,
    badge: 3,
    badgeLabel: "new",
  },
  {
    to: "/chat",
    label: "Chat",
    whisper: "Conversations unfolding",
    icon: MessageCircle,
    badge: 2,
    badgeLabel: "unread",
  },
  {
    to: "/notifications",
    label: "Notifications",
    whisper: "Whispers from EternalBond",
    icon: Bell,
  },
  {
    to: "/filters",
    label: "Filter",
    whisper: "Your compass of preferences",
    icon: Compass,
  },
  {
    to: "/premium",
    label: "Premium",
    whisper: "A quieter, deeper search",
    icon: Gem,
  },
  {
    to: "/gamenight",
    label: "Game Night",
    whisper: "Soft prompts under moonlight",
    icon: Moon,
  },
];

const Home = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [zoomTo, setZoomTo] = useState<{
    x: number;
    y: number;
    href: string;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState(240);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const NODES: Node[] = useMemo(() => {
    const step = 360 / BASE_NODES.length;
    return BASE_NODES.map((n, i) => {
      const angle = -90 + i * step;
      if (n.to === "/notifications") {
        return {
          ...n,
          angle,
          badge: unreadNotifs || undefined,
          badgeLabel: "unread",
        };
      }
      return { ...n, angle };
    });
  }, [unreadNotifs]);

  // parallax
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 40, damping: 14 });
  const py = useSpring(my, { stiffness: 40, damping: 14 });
  const parallaxX = useTransform(px, (v) => v * 18);
  const parallaxY = useTransform(py, (v) => v * 18);
  const farX = useTransform(px, (v) => v * 8);
  const farY = useTransform(py, (v) => v * 8);

  useEffect(() => {
    document.title = "Your constellation — EternalBond";
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const fetchUnread = async () => {
      try {
        const [
          { data: ann, error: e1 },
          { data: reads, error: e2 },
          { data: profile, error: e3 },
          { data: roles, error: e4 },
        ] = await Promise.all([
          supabase.from("announcements").select("id, audience"),
          supabase
            .from("notification_reads")
            .select("announcement_id")
            .eq("user_id", user.id),
          supabase
            .from("profiles")
            .select("gender, created_at")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id),
        ]);

        if (e1 || e2 || e3 || e4 || cancelled) return;

        const userGender = profile?.gender;
        const userCreatedAt = profile?.created_at
          ? new Date(profile.created_at)
          : new Date(user.createdAt);
        const userRoles = (roles ?? []).map((r) => r.role);
        const isPremium =
          userRoles.includes("premium") ||
          userRoles.includes("admin") ||
          userRoles.includes("moderator");

        // A user is considered "new" if their account was created in the last 7 days
        const isNewUser =
          Date.now() - userCreatedAt.getTime() < 7 * 24 * 60 * 60 * 1000;

        const filteredAnnouncements = (
          (ann as { id: string; audience: string }[]) ?? []
        ).filter((item) => {
          const aud = item.audience;
          if (!aud || aud === "all") return true;
          if (aud === "male" && userGender === "male") return true;
          if (aud === "female" && userGender === "female") return true;
          if (aud === "premium" && isPremium) return true;
          if (aud === "new" && isNewUser) return true;
          return false;
        });

        const readIds = new Set(
          (reads ?? []).map(
            (r: { announcement_id: string }) => r.announcement_id,
          ),
        );
        const unreadCount = filteredAnnouncements.filter(
          (n) => !readIds.has(n.id),
        ).length;
        setUnreadNotifs(unreadCount);
      } catch (err) {
        console.error("Error fetching unread notifications count:", err);
      }
    };
    fetchUnread();
    const onVis = () => document.visibilityState === "visible" && fetchUnread();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user]);

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setRadius(w < 480 ? 130 : w < 768 ? 170 : w < 1100 ? 220 : 260);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handlePointerMove = (e: React.PointerEvent) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };

  const name = useMemo(() => {
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const candidate =
      (meta.full_name as string) ||
      (meta.name as string) ||
      (user?.email ? user.email.split("@")[0] : "") ||
      "Traveller";
    return candidate.charAt(0).toUpperCase() + candidate.slice(1).split(" ")[0];
  }, [user]);

  const initials = useMemo(() => name.slice(0, 1).toUpperCase(), [name]);
  const avatar = ((user?.user_metadata ?? {}) as Record<string, string>)
    .avatar_url;
  const verified = !!user?.email_confirmed_at;
  const completion = 72; // hook into real data later

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  // generate stars once
  const stars = useMemo(
    () =>
      Array.from({ length: 80 }).map(() => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 1.6 + 0.4,
        delay: Math.random() * 6,
        dur: 3 + Math.random() * 4,
        layer: Math.random() > 0.7 ? "near" : "far",
      })),
    [],
  );

  const particles = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1.5,
        dur: 14 + Math.random() * 12,
        delay: Math.random() * 8,
      })),
    [],
  );

  const triggerZoom = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    const r = target.getBoundingClientRect();
    setZoomTo({ x: r.left + r.width / 2, y: r.top + r.height / 2, href });
    setTimeout(() => navigate(href), 650);
  };

  return (
    <main
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className="relative min-h-screen overflow-hidden text-[hsl(40_30%_94%)]"
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, hsl(230 55% 16%) 0%, hsl(232 60% 9%) 45%, hsl(235 70% 4%) 100%)",
      }}
    >
      {/* Aurora wash */}
      <motion.div
        aria-hidden
        style={{ x: farX, y: farY }}
        className="pointer-events-none absolute inset-0"
      >
        <div
          className="absolute -top-32 left-1/4 w-[42rem] h-[42rem] rounded-full opacity-30 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, hsl(212 90% 55% / 0.55), transparent 60%)",
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[36rem] h-[36rem] rounded-full opacity-25 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, hsl(280 60% 50% / 0.5), transparent 60%)",
          }}
        />
        <div
          className="absolute top-1/3 right-10 w-[20rem] h-[20rem] rounded-full opacity-20 blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, hsl(45 80% 60% / 0.45), transparent 60%)",
          }}
        />
      </motion.div>

      {/* Twinkling stars */}
      <motion.div
        aria-hidden
        style={{ x: farX, y: farY }}
        className="pointer-events-none absolute inset-0"
      >
        {stars
          .filter((s) => s.layer === "far")
          .map((s, i) => (
            <span
              key={`f${i}`}
              className="absolute rounded-full bg-[hsl(45_30%_92%)]"
              style={{
                top: `${s.top}%`,
                left: `${s.left}%`,
                width: s.size,
                height: s.size,
                opacity: 0.6,
                animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
              }}
            />
          ))}
      </motion.div>
      <motion.div
        aria-hidden
        style={{ x: parallaxX, y: parallaxY }}
        className="pointer-events-none absolute inset-0"
      >
        {stars
          .filter((s) => s.layer === "near")
          .map((s, i) => (
            <span
              key={`n${i}`}
              className="absolute rounded-full bg-[hsl(45_60%_88%)]"
              style={{
                top: `${s.top}%`,
                left: `${s.left}%`,
                width: s.size * 1.4,
                height: s.size * 1.4,
                boxShadow: "0 0 6px hsl(45 80% 75% / 0.7)",
                animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
              }}
            />
          ))}
      </motion.div>

      {/* Drifting particles */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full"
            style={{
              top: `${p.y}%`,
              left: `${p.x}%`,
              width: p.size,
              height: p.size,
              background:
                "radial-gradient(circle, hsl(45 90% 75% / 0.8), transparent 70%)",
              animation: `drift ${p.dur}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Top bar */}
      <header className="relative z-20">
        <div className="container pt-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span
              className="relative grid place-items-center w-9 h-9 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, hsl(45 80% 65%), hsl(38 70% 50%))",
                boxShadow: "0 0 18px hsl(45 80% 60% / 0.55)",
              }}
            >
              <Heart className="w-4 h-4 text-[hsl(232_60%_10%)] fill-current" />
            </span>
            <span className="font-serif text-xl tracking-wide text-[hsl(45_30%_94%)]">
              Eternal<span style={{ color: "hsl(45 75% 65%)" }}>Bond</span>
            </span>
          </Link>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-[hsl(45_40%_70%/0.25)] text-[hsl(45_30%_88%)] hover:bg-[hsl(45_60%_70%/0.08)] hover:border-[hsl(45_60%_70%/0.5)] transition-all"
          >
            <LogOut className="w-3 h-3" />
            Sign out
          </button>
        </div>
      </header>

      {/* Welcome rune */}
      <div className="relative z-10 container pt-8 md:pt-10 text-center">
        <p className="text-[11px] uppercase tracking-[0.4em] text-[hsl(45_50%_75%)]">
          Welcome back
        </p>
        <h1 className="mt-3 font-serif text-3xl md:text-4xl lg:text-5xl font-light leading-tight">
          Your journey toward a{" "}
          <em className="not-italic" style={{ color: "hsl(45 75% 70%)" }}>
            meaningful
          </em>{" "}
          relationship
          <br className="hidden md:block" /> begins here,{" "}
          <span className="italic">{name}</span>.
        </h1>
      </div>

      {/* Constellation */}
      <section className="relative z-10 mx-auto mt-6 md:mt-4 grid place-items-center">
        <div
          className="relative"
          style={{
            width: radius * 2 + 280,
            height: radius * 2 + 280,
            maxWidth: "100vw",
          }}
        >
          {/* SVG constellation lines */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="-300 -300 600 600"
            aria-hidden
          >
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop
                  offset="0%"
                  stopColor="hsl(45 80% 75%)"
                  stopOpacity="0.05"
                />
                <stop
                  offset="50%"
                  stopColor="hsl(45 80% 75%)"
                  stopOpacity="0.55"
                />
                <stop
                  offset="100%"
                  stopColor="hsl(45 80% 75%)"
                  stopOpacity="0.05"
                />
              </linearGradient>
            </defs>
            {NODES.map((n, i) => {
              const rad = (n.angle * Math.PI) / 180;
              const x = Math.cos(rad) * radius;
              const y = Math.sin(rad) * radius;
              return (
                <motion.line
                  key={n.to}
                  x1={0}
                  y1={0}
                  x2={x}
                  y2={y}
                  stroke="url(#lineGrad)"
                  strokeWidth={1}
                  strokeDasharray="2 6"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    duration: 1.2,
                    delay: 0.4 + i * 0.12,
                    ease: "easeOut",
                  }}
                  style={{
                    filter: "drop-shadow(0 0 3px hsl(45 80% 65% / 0.4))",
                  }}
                />
              );
            })}
          </svg>

          {/* Center hub */}
          <CenterHub
            name={name}
            initials={initials}
            avatar={avatar}
            verified={verified}
            completion={completion}
            onOpenProfile={(e) => triggerZoom(e, "/profile")}
          />

          {/* Nodes */}
          {NODES.map((n, i) => {
            const rad = (n.angle * Math.PI) / 180;
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;
            const tooltipSide = x < -40 ? "right" : x > 40 ? "left" : "bottom";
            return (
              <StarNode
                key={n.to}
                node={n}
                x={x}
                y={y}
                delay={0.8 + i * 0.1}
                tooltipSide={tooltipSide}
                onClick={(e) => triggerZoom(e, n.to)}
              />
            );
          })}
        </div>
      </section>

      <p className="relative z-10 text-center mt-2 md:mt-4 pb-16 text-xs uppercase tracking-[0.32em] text-[hsl(45_40%_70%/0.7)]">
        Choose a star · move slowly · we'll wait
      </p>

      {/* Zoom transition overlay */}
      <AnimatePresence>
        {zoomTo && (
          <motion.div
            className="fixed inset-0 z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0.9 }}
              animate={{ scale: 60, opacity: 1 }}
              transition={{ duration: 0.65, ease: [0.7, 0, 0.85, 0] }}
              className="absolute w-12 h-12 rounded-full"
              style={{
                top: zoomTo.y - 24,
                left: zoomTo.x - 24,
                background:
                  "radial-gradient(circle, hsl(45 90% 75%) 0%, hsl(45 80% 60% / 0.8) 30%, hsl(232 60% 9%) 70%)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Local keyframes */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
        @keyframes drift {
          0% { transform: translate(0,0); opacity: 0; }
          15% { opacity: 0.8; }
          50% { transform: translate(40px, -60px); opacity: 0.5; }
          85% { opacity: 0.2; }
          100% { transform: translate(80px, -120px); opacity: 0; }
        }
        @keyframes hub-pulse {
          0%, 100% { box-shadow: 0 0 0 0 hsl(45 80% 65% / 0.35), 0 0 60px hsl(45 80% 60% / 0.25); }
          50% { box-shadow: 0 0 0 18px hsl(45 80% 65% / 0), 0 0 80px hsl(45 80% 60% / 0.4); }
        }
        @keyframes node-float {
          0%, 100% { transform: translate(0,0); }
          50% { transform: translate(0,-6px); }
        }
        @keyframes line-shimmer {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </main>
  );
};

const CenterHub = ({
  name,
  initials,
  avatar,
  verified,
  completion,
  onOpenProfile,
}: {
  name: string;
  initials: string;
  avatar?: string;
  verified: boolean;
  completion: number;
  onOpenProfile: (e: React.MouseEvent) => void;
}) => {
  const size = 168;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (completion / 100) * c;

  return (
    <motion.button
      onClick={onOpenProfile}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 group"
      style={{ width: size, height: size }}
      aria-label="Open your profile"
    >
      {/* outer aura */}
      <span
        className="absolute inset-0 rounded-full"
        style={{ animation: "hub-pulse 4.5s ease-in-out infinite" }}
      />
      {/* completion ring */}
      <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(45 30% 80% / 0.12)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(45 80% 68%)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - dash }}
          transition={{ duration: 1.6, delay: 0.6, ease: "easeOut" }}
          style={{ filter: "drop-shadow(0 0 6px hsl(45 80% 60% / 0.6))" }}
        />
      </svg>

      {/* glass disc */}
      <span
        className="absolute inset-3 rounded-full backdrop-blur-xl border overflow-hidden grid place-items-center"
        style={{
          background:
            "radial-gradient(circle at 30% 25%, hsl(45 60% 80% / 0.18), hsl(232 60% 12% / 0.6))",
          borderColor: "hsl(45 60% 80% / 0.25)",
        }}
      >
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span
            className="font-serif text-4xl"
            style={{ color: "hsl(45 75% 80%)" }}
          >
            {initials}
          </span>
        )}
      </span>

      {/* verified badge */}
      {verified && (
        <span
          className="absolute -bottom-1 right-3 grid place-items-center w-7 h-7 rounded-full"
          style={{
            background:
              "linear-gradient(135deg, hsl(45 80% 65%), hsl(38 70% 50%))",
            boxShadow: "0 0 12px hsl(45 80% 60% / 0.7)",
          }}
        >
          <BadgeCheck className="w-4 h-4 text-[hsl(232_60%_10%)]" />
        </span>
      )}

      {/* caption */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-5 text-center whitespace-nowrap">
        <p className="font-serif text-lg leading-none text-[hsl(45_30%_94%)]">
          {name}
        </p>
        <p
          className="mt-1 text-[10px] uppercase tracking-[0.3em]"
          style={{ color: "hsl(45 60% 75%)" }}
        >
          {completion}% complete · your light grows
        </p>
      </div>
    </motion.button>
  );
};

const StarNode = ({
  node,
  x,
  y,
  delay,
  tooltipSide,
  onClick,
}: {
  node: Node;
  x: number;
  y: number;
  delay: number;
  tooltipSide: "left" | "right" | "bottom";
  onClick: (e: React.MouseEvent) => void;
}) => {
  const Icon = node.icon;
  const tooltipPos =
    tooltipSide === "right"
      ? "left-full ml-3 top-1/2 -translate-y-1/2 text-left"
      : tooltipSide === "left"
        ? "right-full mr-3 top-1/2 -translate-y-1/2 text-right"
        : "top-full mt-3 left-1/2 -translate-x-1/2 text-center";

  return (
    <motion.a
      href={node.to}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.92 }}
      className="absolute group"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: "translate(-50%, -50%)",
      }}
      aria-label={node.label}
    >
      <div
        style={{
          animation: `node-float ${5 + (delay % 1) * 3}s ease-in-out infinite`,
        }}
      >
        <div className="relative grid place-items-center w-[68px] h-[68px] md:w-20 md:h-20">
          {/* halo */}
          <span
            className="absolute inset-0 rounded-full transition-all duration-500 group-hover:scale-125"
            style={{
              background:
                "radial-gradient(circle, hsl(45 90% 70% / 0.35) 0%, hsl(45 80% 60% / 0.08) 50%, transparent 70%)",
              filter: "blur(8px)",
            }}
          />
          {/* outer ring */}
          <span
            className="absolute inset-2 rounded-full border opacity-70 group-hover:opacity-100 transition"
            style={{ borderColor: "hsl(45 60% 75% / 0.4)" }}
          />
          {/* glass orb */}
          <span
            className="relative grid place-items-center w-12 h-12 md:w-14 md:h-14 rounded-full backdrop-blur-md border transition-all duration-500 group-hover:shadow-[0_0_28px_hsl(45_80%_65%/0.7)]"
            style={{
              background:
                "radial-gradient(circle at 30% 25%, hsl(45 60% 85% / 0.25), hsl(232 60% 14% / 0.85))",
              borderColor: "hsl(45 60% 75% / 0.35)",
            }}
          >
            <Icon
              className="w-5 h-5 md:w-6 md:h-6"
              style={{ color: "hsl(45 80% 80%)" }}
            />
          </span>

          {/* notification dot */}
          {node.badge && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1.5 rounded-full grid place-items-center text-[10px] font-semibold"
              style={{
                background:
                  "linear-gradient(135deg, hsl(45 85% 65%), hsl(38 75% 50%))",
                color: "hsl(232 60% 10%)",
                boxShadow: "0 0 12px hsl(45 85% 60% / 0.7)",
              }}
            >
              {node.badge}
            </span>
          )}
        </div>
      </div>

      {/* tooltip */}
      <div
        className={`absolute ${tooltipPos} pointer-events-none opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300`}
      >
        <p className="font-serif text-base leading-none text-[hsl(45_30%_94%)]">
          {node.label}
        </p>
        <p
          className="mt-1 text-[10px] uppercase tracking-[0.25em]"
          style={{ color: "hsl(45 55% 75%)" }}
        >
          {node.whisper}
        </p>
      </div>
    </motion.a>
  );
};

export default Home;
