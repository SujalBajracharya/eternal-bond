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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import NavbarAuthenticated from "@/components/userSide/NavbarAuthenticated";
import ScrollToTopButton from "@/components/ui/ScrollToTopButton";

type Node = {
  to: string;
  label: string;
  whisper: string;
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  angle: number;
  badge?: number;
  badgeLabel?: string;
};

// ─── Static node definitions (angle is auto-computed below) ──────────────────
const BASE_NODES: Omit<Node, "angle">[] = [
  {
    to: "/today",
    label: "Today",
    whisper: "Hand-picked introductions",
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
  const { user, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [zoomTo, setZoomTo] = useState<{
    x: number;
    y: number;
    href: string;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState(240);
  const [profile, setProfile] = useState<any>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  // ─── Parallax (3-layer: far · mid · near) ────────────────────────────────
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 40, damping: 14 });
  const py = useSpring(my, { stiffness: 40, damping: 14 });
  const parallaxX = useTransform(px, (v) => v * 18);
  const parallaxY = useTransform(py, (v) => v * 18);
  const farX = useTransform(px, (v) => v * 8);
  const farY = useTransform(py, (v) => v * 8);
  const midX = useTransform(px, (v) => v * 13);
  const midY = useTransform(py, (v) => v * 13);

  useEffect(() => {
    document.title = "Your constellation — EternalBond";
  }, []);

  // ─── Responsive radius ────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setRadius(w < 480 ? 130 : w < 768 ? 170 : w < 1100 ? 220 : 260);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ─── Fetch user profile ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        if (error) console.error("Error fetching profile:", error);
        else if (data) setProfile(data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, [user]);

  // ─── Fetch unread notification count ─────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fetchUnread = async () => {
      try {
        const [
          { data: ann, error: e1 },
          { data: reads, error: e2 },
          { data: prof, error: e3 },
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
          supabase.from("user_roles").select("role").eq("user_id", user.id),
        ]);

        if (e1 || e2 || e3 || e4 || cancelled) return;

        const userGender = prof?.gender;
        const userCreatedAt = prof?.created_at
          ? new Date(prof.created_at)
          : new Date(user.created_at);
        const userRoles = (roles ?? []).map((r: { role: string }) => r.role);
        const isPremium =
          userRoles.includes("premium") ||
          userRoles.includes("admin") ||
          userRoles.includes("moderator");
        const isNewUser =
          Date.now() - userCreatedAt.getTime() < 7 * 24 * 60 * 60 * 1000;

        const filtered = (
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
        const unreadCount = filtered.filter((n) => !readIds.has(n.id)).length;
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

  const handlePointerMove = (e: React.PointerEvent) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };

  // ─── Derived user data ────────────────────────────────────────────────────
  const name = useMemo(() => {
    const candidate =
      profile?.full_name ||
      user?.fullName ||
      (user?.email ? user.email.split("@")[0] : "") ||
      "Traveller";
    return candidate.charAt(0).toUpperCase() + candidate.slice(1).split(" ")[0];
  }, [profile, user]);

  const initials = useMemo(() => name.slice(0, 1).toUpperCase(), [name]);
  const avatar = profile?.avatar_url;
  const verified = profile?.kyc_status === "verified";

  // Dynamic profile completion score
  const completion = useMemo(() => {
    if (!profile) return 0;
    const fields = [
      profile.full_name,
      profile.gender,
      profile.date_of_birth,
      profile.location,
      profile.bio,
      profile.profession,
      profile.religion,
      profile.mother_tongue,
      profile.height_cm,
      profile.marital_status,
      profile.looking_for,
      profile.avatar_url,
      profile.highest_education,
      profile.family_type,
    ];
    const filled = fields.filter(
      (v) => v !== null && v !== undefined && v !== "",
    ).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  // ─── Nodes — auto-spaced angles, notifications badge wired to live count ─
  const nodes = useMemo<Node[]>(() => {
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

  // ─── Stars (3-layer depth field) ─────────────────────────────────────────
  const stars = useMemo(
    () =>
      Array.from({ length: 130 }).map(() => {
        const r = Math.random();
        const layer = r > 0.78 ? "near" : r > 0.42 ? "mid" : "far";
        return {
          top: Math.random() * 100,
          left: Math.random() * 100,
          size:
            layer === "near"
              ? Math.random() * 2 + 1.4
              : layer === "mid"
                ? Math.random() * 1.6 + 0.9
                : Math.random() * 1.2 + 0.5,
          delay: Math.random() * 7,
          dur: 3.5 + Math.random() * 5,
          layer,
        };
      }),
    [],
  );

  const particles = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3.5 + 2,
        dur: 16 + Math.random() * 14,
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

  // Precompute node coordinates
  const nodeCoords = useMemo(
    () =>
      nodes.map((n) => {
        const rad = (n.angle * Math.PI) / 180;
        return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
      }),
    [nodes, radius],
  );

  return (
    <>
      <NavbarAuthenticated />
      <main
        ref={containerRef}
        onPointerMove={handlePointerMove}
        className="relative min-h-screen overflow-hidden text-foreground bg-background grain selection:bg-primary/10"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, hsl(14 90% 97%) 0%, hsl(36 70% 97%) 50%, hsl(36 60% 94%) 100%)",
        }}
      >
        {/* Aurora wash */}
        <motion.div
          aria-hidden
          style={{ x: farX, y: farY }}
          className="pointer-events-none absolute inset-0"
        >
          <div
            className="absolute -top-32 left-1/4 w-[42rem] h-[42rem] rounded-full opacity-35 blur-[120px]"
            style={{
              background:
                "radial-gradient(circle, hsl(6 90% 70% / 0.22), transparent 60%)",
            }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-[36rem] h-[36rem] rounded-full opacity-25 blur-[120px]"
            style={{
              background:
                "radial-gradient(circle, hsl(38 88% 65% / 0.18), transparent 60%)",
            }}
          />
          <div
            className="absolute top-1/3 right-10 w-[20rem] h-[20rem] rounded-full opacity-20 blur-[100px]"
            style={{
              background:
                "radial-gradient(circle, hsl(320 40% 50% / 0.08), transparent 60%)",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[28rem] rounded-full opacity-[0.12] blur-[140px]"
            style={{
              background:
                "radial-gradient(ellipse, hsl(6 86% 64% / 0.3), transparent 65%)",
            }}
          />
        </motion.div>

        {/* Vignette */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 46%, transparent 35%, hsl(36 60% 94% / 0.0) 55%, hsl(30 40% 88% / 0.35) 100%)",
          }}
        />

        {/* Stars — far layer */}
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
                className="absolute rounded-full bg-primary/15"
                style={{
                  top: `${s.top}%`,
                  left: `${s.left}%`,
                  width: s.size,
                  height: s.size,
                  opacity: 0.55,
                  animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
                }}
              />
            ))}
        </motion.div>

        {/* Stars — mid layer */}
        <motion.div
          aria-hidden
          style={{ x: midX, y: midY }}
          className="pointer-events-none absolute inset-0"
        >
          {stars
            .filter((s) => s.layer === "mid")
            .map((s, i) => (
              <span
                key={`m${i}`}
                className="absolute rounded-full bg-primary/25"
                style={{
                  top: `${s.top}%`,
                  left: `${s.left}%`,
                  width: s.size,
                  height: s.size,
                  opacity: 0.6,
                  boxShadow: "0 0 4px hsl(6 86% 64% / 0.3)",
                  animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
                }}
              />
            ))}
        </motion.div>

        {/* Stars — near layer */}
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
                className="absolute rounded-full bg-accent/35"
                style={{
                  top: `${s.top}%`,
                  left: `${s.left}%`,
                  width: s.size * 1.3,
                  height: s.size * 1.3,
                  boxShadow: "0 0 6px hsl(38 88% 60% / 0.45)",
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
                  "radial-gradient(circle, hsl(6 86% 64% / 0.25), transparent 70%)",
                animation: `drift ${p.dur}s ease-in-out ${p.delay}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Welcome title */}
        <div
          id="top"
          className="relative z-10 container max-w-6xl pt-8 md:pt-10 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Your relationship universe
          </p>
          <h1 className="mt-3 font-serif text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-foreground">
            Your journey toward a{" "}
            <em className="not-italic text-primary">meaningful</em> relationship
            <br className="hidden md:block" /> begins here,{" "}
            <span className="italic">{name}</span>.
          </h1>
        </div>

        {/* Constellation section */}
        <section className="relative z-10 mx-auto mt-6 md:mt-4 grid place-items-center">
          <div
            className="relative"
            style={{
              width: radius * 2 + 280,
              height: radius * 2 + 280,
              maxWidth: "100vw",
            }}
          >
            {/* Faint dashed orbit ring */}
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border pointer-events-none"
              style={{
                width: radius * 2,
                height: radius * 2,
                borderColor: "hsl(6 86% 64% / 0.08)",
                borderStyle: "dashed",
              }}
            />

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
                    stopColor="hsl(6 86% 64%)"
                    stopOpacity="0.03"
                  />
                  <stop
                    offset="50%"
                    stopColor="hsl(38 88% 60%)"
                    stopOpacity="0.45"
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(6 86% 64%)"
                    stopOpacity="0.03"
                  />
                </linearGradient>
                <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(38 88% 60%)"
                    stopOpacity="0.3"
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(6 86% 64%)"
                    stopOpacity="0.12"
                  />
                </linearGradient>
              </defs>

              {/* Spokes: hub → each star */}
              {nodeCoords.map((p, i) => (
                <motion.line
                  key={`spoke-${nodes[i].to}-${nodes[i].label}`}
                  x1={0}
                  y1={0}
                  x2={p.x}
                  y2={p.y}
                  stroke="url(#lineGrad)"
                  strokeWidth={1.5}
                  strokeDasharray="3 5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    duration: 1.2,
                    delay: 0.4 + i * 0.12,
                    ease: "easeOut",
                  }}
                  style={{
                    filter: "drop-shadow(0 0 3px hsl(38 88% 60% / 0.25))",
                  }}
                />
              ))}

              {/* Perimeter: neighboring star → star edges */}
              {nodeCoords.map((p, i) => {
                const next = nodeCoords[(i + 1) % nodeCoords.length];
                return (
                  <motion.line
                    key={`ring-${nodes[i].to}-${nodes[i].label}-edge`}
                    x1={p.x}
                    y1={p.y}
                    x2={next.x}
                    y2={next.y}
                    stroke="url(#ringGrad)"
                    strokeWidth={1}
                    strokeDasharray="2 7"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.7 }}
                    transition={{
                      duration: 1.4,
                      delay: 1.1 + i * 0.1,
                      ease: "easeOut",
                    }}
                  />
                );
              })}

              {/* Traveling pulse dots along spokes */}
              {nodeCoords.map((p, i) => (
                <motion.circle
                  key={`pulse-${nodes[i].to}-${nodes[i].label}`}
                  r={2.2}
                  fill="hsl(38 88% 62%)"
                  style={{
                    filter: "drop-shadow(0 0 4px hsl(38 88% 60% / 0.6))",
                  }}
                  initial={{ opacity: 0 }}
                  animate={{
                    cx: [p.x, 0, p.x],
                    cy: [p.y, 0, p.y],
                    opacity: [0, 0.9, 0],
                  }}
                  transition={{
                    duration: 5 + (i % 3),
                    delay: 2 + i * 0.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </svg>

            {/* Center profile hub */}
            <CenterHub
              name={name}
              initials={initials}
              avatar={avatar}
              verified={verified}
              completion={completion}
              onOpenProfile={(e) => triggerZoom(e, "/profile")}
            />

            {/* Node stars */}
            {nodes.map((n, i) => {
              const { x, y } = nodeCoords[i];
              const tooltipSide =
                x < -40 ? "right" : x > 40 ? "left" : "bottom";
              return (
                <StarNode
                  key={n.to + n.label}
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

        <p className="relative z-10 text-center mt-2 md:mt-4 pb-16 text-[11px] uppercase tracking-[0.32em] text-muted-foreground/80 font-medium">
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
                    "radial-gradient(circle, hsl(38 88% 60%) 0%, hsl(6 86% 64% / 0.8) 30%, hsl(36 60% 97%) 70%)",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <ScrollToTopButton />
      </main>
    </>
  );
};

// ─── CenterHub ────────────────────────────────────────────────────────────────
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
  const size = 176;
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
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 group"
      style={{ width: size, height: size }}
      aria-label="Open your profile"
    >
      {/* Slowly rotating stardust halo */}
      <span
        aria-hidden
        className="absolute -inset-5 rounded-full pointer-events-none"
        style={{ animation: "hub-rotate 40s linear infinite" }}
      >
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          const rr = size / 2 + 18;
          return (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                top: `calc(50% + ${Math.sin(a) * rr}px)`,
                left: `calc(50% + ${Math.cos(a) * rr}px)`,
                width: i % 3 === 0 ? 3 : 1.6,
                height: i % 3 === 0 ? 3 : 1.6,
                background: "hsl(38 88% 62%)",
                opacity: 0.55,
                boxShadow: "0 0 5px hsl(38 88% 60% / 0.5)",
              }}
            />
          );
        })}
      </span>

      {/* Outer aura pulse */}
      <span
        className="absolute inset-0 rounded-full"
        style={{ animation: "hub-pulse 4.5s ease-in-out infinite" }}
      />

      {/* Completion ring */}
      <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(6 86% 64% / 0.08)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(6 86% 64%)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - dash }}
          transition={{ duration: 1.6, delay: 0.6, ease: "easeOut" }}
          style={{ filter: "drop-shadow(0 0 6px hsl(6 86% 64% / 0.45))" }}
        />
      </svg>

      {/* Glass disc */}
      <span
        className="absolute inset-3 rounded-full backdrop-blur-xl border overflow-hidden grid place-items-center"
        style={{
          background:
            "radial-gradient(circle at 30% 25%, hsl(0 0% 100% / 0.85), hsl(14 80% 92% / 0.9))",
          borderColor: "hsl(6 86% 64% / 0.2)",
        }}
      >
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span
            className="font-serif text-4xl"
            style={{ color: "hsl(6 86% 60%)" }}
          >
            {initials}
          </span>
        )}
      </span>

      {/* Verified seal */}
      {verified && (
        <span
          className="absolute -bottom-1 right-3 grid place-items-center w-7 h-7 rounded-full"
          style={{
            background:
              "linear-gradient(135deg, hsl(6 90% 70%), hsl(38 88% 65%))",
            boxShadow: "0 0 12px hsl(6 90% 70% / 0.4)",
          }}
        >
          <BadgeCheck className="w-4 h-4 text-white" />
        </span>
      )}

      {/* Caption */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-5 text-center whitespace-nowrap">
        <p className="font-serif text-lg leading-none text-foreground">
          {name}
        </p>
        <p
          className="mt-1.5 text-[10px] uppercase tracking-[0.25em] font-medium"
          style={{ color: "hsl(6 86% 60%)" }}
        >
          {completion}% complete · your light grows
        </p>
      </div>
    </motion.button>
  );
};

// ─── StarNode ─────────────────────────────────────────────────────────────────
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
          {/* Halo */}
          <span
            className="absolute inset-0 rounded-full transition-all duration-500 group-hover:scale-125 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, hsl(6 86% 64% / 0.12) 0%, hsl(38 88% 60% / 0.03) 50%, transparent 70%)",
              filter: "blur(8px)",
            }}
          />
          {/* Outer notification ring */}
          <span
            className="absolute inset-2 rounded-full border opacity-70 group-hover:opacity-100 transition duration-300"
            style={{
              borderColor: node.badge
                ? "hsl(6 86% 64% / 0.35)"
                : "hsl(6 86% 64% / 0.15)",
              animation: node.badge
                ? "badge-pulse 2.6s ease-in-out infinite"
                : undefined,
            }}
          />
          {/* Glass orb */}
          <span
            className="relative grid place-items-center w-12 h-12 md:w-14 md:h-14 rounded-full backdrop-blur-md border transition-all duration-500 group-hover:shadow-[0_0_24px_hsl(6_86%_64%/0.25)] group-hover:border-primary/40"
            style={{
              background:
                "radial-gradient(circle at 30% 25%, hsl(0 0% 100% / 0.95), hsl(14 80% 92% / 0.9))",
              borderColor: "hsl(6 86% 64% / 0.2)",
            }}
          >
            <Icon
              className="w-5 h-5 md:w-6 md:h-6"
              style={{ color: "hsl(6 86% 60%)" }}
            />
          </span>

          {/* Notification badge */}
          {node.badge ? (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1.5 rounded-full grid place-items-center text-[10px] font-bold border border-white/60"
              style={{
                background:
                  "linear-gradient(135deg, hsl(6 90% 70%), hsl(38 88% 65%))",
                color: "white",
                boxShadow:
                  "0 2px 8px hsl(6 85% 60% / 0.35), 0 0 10px hsl(38 88% 60% / 0.4)",
              }}
            >
              {node.badge}
            </span>
          ) : null}
        </div>
      </div>

      {/* Tooltip */}
      <div
        className={`absolute ${tooltipPos} pointer-events-none opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-30 whitespace-nowrap`}
      >
        <p className="font-serif text-[15px] leading-none text-foreground">
          {node.label}
        </p>
        <p className="mt-1 text-[9.5px] uppercase tracking-[0.25em] font-medium text-muted-foreground">
          {node.whisper}
        </p>
      </div>
    </motion.a>
  );
};

export default Home;
