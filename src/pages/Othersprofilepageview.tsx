import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  BadgeCheck,
  Briefcase,
  GraduationCap,
  Heart,
  Languages,
  Ruler,
  Cake,
  Users2,
  Landmark,
  Sparkles,
  Globe,
  CalendarHeart,
  Music2,
  Instagram,
  Linkedin,
  Loader2,
  UserX,
  Camera,
  Zap,
  Compass,
  MessageSquare,
  BookOpen,
  Coffee,
  Crown,
  Sparkle,
  Flag,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { pretty, ageFromDob, cmToFeet } from "@/pages/Profile";
import { useAuth } from "@/hooks/use-auth";
import ReportPhotoDialog from "@/components/ReportPhotoDialog";
import NavbarAuthenticated from "@/components/userSide/NavbarAuthenticated";
import ScrollToTopButton from "@/components/ui/ScrollToTopButton";

/* -----------------------------------------------------------------------
   Types
   --------------------------------------------------------------------- */

interface ProfileData {
  id: string;
  full_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  location: string | null;
  bio: string | null;
  profession: string | null;
  religion: string | null;
  mother_tongue: string | null;
  height_cm: number | null;
  marital_status: string | null;
  looking_for: string | null;
  avatar_url: string | null;
  highest_education: string | null;
  income_range: string | null;
  father_occupation: string | null;
  mother_occupation: string | null;
  siblings: string | null;
  family_type: string | null;
  kyc_status: string | null;
  social_links: Record<string, string> | null;
  personality: string | null;
  love_language: string | null;
  social_energy: string | null;
  marriage_intention: string | null;
  open_to_relocate: boolean | null;
  spotify_track: string | null;
  kundali_name: string | null;
  kundali_url: string | null;
}

/* -----------------------------------------------------------------------
   Design-system primitives
   --------------------------------------------------------------------- */

const CardWrapper = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "rounded-[24px] border border-border/80 bg-card/90 backdrop-blur-sm p-6 sm:p-8 shadow-sm transition-all duration-300 hover:shadow-md",
      className,
    )}
  >
    {children}
  </div>
);

const SectionTitle = ({
  icon: Icon,
  title,
  className,
}: {
  icon: any;
  title: string;
  className?: string;
}) => (
  <div className={cn("flex items-center gap-3 mb-6", className)}>
    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
      <Icon className="w-5 h-5" strokeWidth={2} />
    </div>
    <h3 className="font-serif text-xl font-semibold text-foreground tracking-tight">
      {title}
    </h3>
  </div>
);

const DetailField = ({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "flex flex-col py-3 border-b border-border/40 last:border-b-0",
      className,
    )}
  >
    <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium">
      {label}
    </span>
    <span className="text-[14.5px] font-semibold text-foreground mt-1">
      {value || "—"}
    </span>
  </div>
);

const InlineField = ({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "flex items-center justify-between py-3 border-b border-border/40 last:border-b-0",
      className,
    )}
  >
    <span className="text-[13px] text-muted-foreground font-medium">
      {label}
    </span>
    <span className="text-[14px] font-semibold text-foreground text-right">
      {value || "—"}
    </span>
  </div>
);

type TabKey = "detailed" | "photos";

export default function OthersProfilePageView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("detailed");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [reportPhotoUrl, setReportPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (profileError || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData as ProfileData);

      const { data: photoRows } = await supabase
        .from("profile_photos_mapping")
        .select("photo_url, visibility")
        .eq("profile_id", id);

      setPhotos(
        (photoRows ?? [])
          .filter((r) => r.visibility === "visible")
          .map((r) => r.photo_url)
          .filter(Boolean) as string[],
      );

      const { data: interestRows } = await supabase
        .from("profile_interests")
        .select("interest")
        .eq("profile_id", id);

      setInterests((interestRows ?? []).map((r) => r.interest).filter(Boolean));

      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-6 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted grid place-items-center">
            <UserX
              className="w-7 h-7 text-muted-foreground"
              strokeWidth={1.5}
            />
          </div>
          <h1 className="font-serif text-2xl text-foreground">
            Profile not found
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            This profile doesn't exist or may have been removed.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 mt-4 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
        </div>
      </div>
    );
  }

  const age = ageFromDob(profile.date_of_birth);
  const verified = profile.kyc_status === "verified";
  const socialLinks =
    typeof profile.social_links === "object" ? profile.social_links : {};

  // Compatibility score calculation based on profile data availability
  const calculateCompatibility = () => {
    let score = 60;
    if (profile.bio) score += 10;
    if (profile.highest_education) score += 10;
    if (profile.location) score += 5;
    if (profile.spotify_track) score += 5;
    if (interests.length >= 3) score += 10;
    return score;
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] pb-24 selection:bg-primary/15 relative overflow-hidden">
      {/* Banner matching image background */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden bg-cover bg-center bg-[url('https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200')]">
        <div className="absolute inset-0 bg-black/35" />
        <NavbarAuthenticated />
        <div className="absolute bottom-4 right-4 md:right-8 z-10">
          <button className="bg-[#b30843] hover:bg-[#910635] text-white font-medium text-xs md:text-sm px-6 py-2.5 rounded-full shadow-lg flex items-center gap-2 transition-all">
            <Sparkles className="w-4 h-4" /> POST A QUESTION/POLL
          </button>
        </div>
      </div>

      {/* Grid container matching the layout in image */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Overlapping sidebar card & side panels */}
        <div className="lg:col-span-4 space-y-6">
          {/* Identity/Profile magenta/rose card */}
          <div className="rounded-[24px] bg-gradient-to-b from-[#b30843] to-[#80032e] text-white p-6 text-center shadow-lg relative overflow-hidden">
            {/* Absolute decorative star */}
            <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

            {/* Avatar circle with border and upload camera icon */}
            <div className="relative mx-auto w-28 h-28 rounded-full border-[3px] border-white/80 overflow-hidden bg-white/20 shadow-md">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name ?? "Profile"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-serif text-white grid place-items-center h-full">
                  {(profile.full_name ?? "·").trim().charAt(0).toUpperCase()}
                </span>
              )}
              {profile.avatar_url && user?.id !== profile.id && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReportPhotoUrl(profile.avatar_url);
                  }}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-rose-500 hover:text-rose-400 p-1.5 rounded-full border border-white/20 transition-all z-10"
                  title="Report Avatar Photo"
                >
                  <Flag className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                </button>
              )}
              <div className="absolute bottom-1 right-1 bg-black/40 text-white p-1 rounded-full border border-white/20">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Name, Location, and Verification badge */}
            <h2 className="font-serif text-2xl font-bold mt-4 tracking-tight">
              {profile.full_name || "Anonymous"}
            </h2>
            <div className="flex items-center justify-center gap-1.5 text-white/80 text-sm mt-1">
              <MapPin className="w-4 h-4 text-white/60" />
              <span>{profile.location || "India"}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 bg-white/15 text-white text-[11px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full mt-3.5 border border-white/10">
              <BadgeCheck className="w-3.5 h-3.5 text-yellow-300" />
              {verified ? "Verified Member" : "Verification Pending"}
            </div>

            <div className="my-5 border-t border-white/15" />

            {/* Score box */}
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-semibold">
                COMPATIBILITY SCORE
              </span>
              <div className="text-4xl font-serif font-black mt-1">
                {calculateCompatibility()}
                <span className="text-xs font-sans text-white/70 font-normal ml-2">
                  +11 this week
                </span>
              </div>
            </div>

            <div className="my-5 border-t border-white/15" />

            {/* Custom Badges list */}
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-semibold block mb-4">
                BADGES
              </span>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Coffee className="w-4 h-4 text-yellow-300" />
                  </div>
                  <span className="text-[9.5px] uppercase tracking-wider mt-2 font-bold text-white/90">
                    COOKS
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Sparkle className="w-4 h-4 text-yellow-300" />
                  </div>
                  <span className="text-[9.5px] uppercase tracking-wider mt-2 font-bold text-white/90">
                    MISS SPICE
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Crown className="w-4 h-4 text-yellow-300" />
                  </div>
                  <span className="text-[9.5px] uppercase tracking-wider mt-2 font-bold text-white/90">
                    GIRL BOSS
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Heart className="w-4 h-4 text-yellow-300" />
                  </div>
                  <span className="text-[9.5px] uppercase tracking-wider mt-2 font-bold text-white/90">
                    STYLE SPA
                  </span>
                </div>
              </div>
            </div>

            <button className="w-full bg-[#80032e] hover:bg-[#600222] text-white text-xs uppercase tracking-widest font-bold py-3.5 rounded-xl transition-all duration-300 mt-6 flex items-center justify-center gap-2">
              View profile as... <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>

          {/* Social Profiles Card */}
          <CardWrapper className="p-5">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-4">
              SOCIAL PROFILES
            </h4>
            <div className="flex gap-3">
              {socialLinks?.instagram ? (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 text-pink-600 hover:bg-pink-200 transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                  <Instagram className="h-5 w-5" />
                </span>
              )}
              {socialLinks?.linkedin ? (
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                  <Linkedin className="h-5 w-5" />
                </span>
              )}
            </div>
          </CardWrapper>

          {/* Interests Card */}
          <CardWrapper className="p-5">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-4">
              INTERESTS
            </h4>
            {interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full bg-primary/5 text-primary text-xs font-semibold px-3 py-1 border border-primary/10"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                No interests selected.
              </span>
            )}
          </CardWrapper>

          {/* Spotify Favorite Track Card */}
          {profile.spotify_track &&
            (() => {
              const trackId = profile.spotify_track.split(":")[2];

              return (
                <CardWrapper className="p-5 bg-gradient-to-r from-emerald-50/60 to-teal-50/60 border-emerald-100">
                  <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-800 mb-3 flex items-center gap-1.5">
                    <Music2 className="w-3.5 h-3.5 text-emerald-600" />
                    FAVORITE TRACK
                  </h4>
                  <iframe
                    src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator`}
                    width="100%"
                    height="152"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="rounded-xl"
                  />
                </CardWrapper>
              );
            })()}
        </div>

        {/* Right Column: Tabbed Detailed Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tabs bar */}
          <div className="flex gap-8 border-b border-border/80">
            <button
              onClick={() => setActiveTab("detailed")}
              className={cn(
                "relative pb-4 text-sm font-serif font-bold transition-all",
                activeTab === "detailed"
                  ? "text-[#b30843]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Detailed Profile
              {activeTab === "detailed" && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-[#b30843]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("photos")}
              className={cn(
                "relative pb-4 text-sm font-serif font-bold transition-all",
                activeTab === "photos"
                  ? "text-[#b30843]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Photos
              {activeTab === "photos" && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-[#b30843]" />
              )}
            </button>
          </div>

          {activeTab === "detailed" && (
            <div className="space-y-6">
              {/* About Me Section Card */}
              <CardWrapper>
                <SectionTitle icon={Heart} title="About Me" />
                <p className="text-[14.5px] text-foreground leading-relaxed whitespace-pre-wrap">
                  {profile.bio || "No bio shared yet."}
                </p>

                {/* Stats Grid under About Me */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-border/40">
                  <DetailField label="GENDER" value={pretty(profile.gender)} />
                  <DetailField
                    label="DATE OF BIRTH"
                    value={
                      profile.date_of_birth
                        ? new Date(profile.date_of_birth).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )
                        : "—"
                    }
                  />
                  <DetailField
                    label="HEIGHT"
                    value={cmToFeet(profile.height_cm)}
                  />
                  <DetailField
                    label="MARITAL STATUS"
                    value={pretty(profile.marital_status)}
                  />
                </div>
              </CardWrapper>

              {/* Professional & Education Section Card */}
              <CardWrapper>
                <SectionTitle
                  icon={Briefcase}
                  title="Professional & Education"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <DetailField
                    label="HIGHEST EDUCATION"
                    value={pretty(profile.highest_education)}
                  />
                  <DetailField label="PROFESSION" value={profile.profession} />
                  <DetailField
                    label="INCOME RANGE"
                    value={pretty(profile.income_range)}
                  />
                </div>
              </CardWrapper>

              {/* Two Column Grid for Family & Religion */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Family Details Card */}
                <CardWrapper>
                  <SectionTitle icon={Users2} title="Family Details" />
                  <div className="space-y-1">
                    <InlineField
                      label="Family Type"
                      value={pretty(profile.family_type)}
                    />
                    <InlineField
                      label="Father's Occupation"
                      value={profile.father_occupation}
                    />
                    <InlineField
                      label="Mother's Occupation"
                      value={profile.mother_occupation}
                    />
                    <InlineField label="Siblings" value={profile.siblings} />
                  </div>
                </CardWrapper>

                {/* Religion & Cultural Card */}
                <CardWrapper>
                  <SectionTitle icon={Landmark} title="Religion & Cultural" />
                  <div className="space-y-1">
                    <InlineField label="Religion" value={profile.religion} />
                    <InlineField
                      label="Mother Tongue"
                      value={profile.mother_tongue}
                    />
                    <div className="flex items-center justify-between py-3">
                      <span className="text-[13px] text-muted-foreground font-medium">
                        Kundali Details
                      </span>
                      <span className="text-[14px] font-semibold text-primary">
                        {profile.kundali_url ? (
                          <a
                            href={profile.kundali_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-dotted underline-offset-2 flex items-center gap-1"
                          >
                            View
                          </a>
                        ) : (
                          profile.kundali_name || "—"
                        )}
                      </span>
                    </div>
                  </div>
                </CardWrapper>
              </div>

              {/* Lifestyle & Personality Card */}
              <CardWrapper>
                <SectionTitle icon={Compass} title="Lifestyle & Personality" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <DetailField
                    label="PERSONALITY"
                    value={profile.personality}
                  />
                  <DetailField
                    label="LOVE LANGUAGE"
                    value={profile.love_language}
                  />
                  <DetailField
                    label="SOCIAL ENERGY"
                    value={profile.social_energy}
                  />
                  <DetailField
                    label="MARRIAGE INTENTION"
                    value={profile.marriage_intention}
                  />
                  <DetailField
                    label="OPEN TO RELOCATE"
                    value={
                      profile.open_to_relocate === null
                        ? "—"
                        : profile.open_to_relocate
                          ? "Yes, worldwide"
                          : "No"
                    }
                  />
                </div>
              </CardWrapper>
            </div>
          )}

          {activeTab === "photos" && (
            /* Gallery Photos Card at the bottom */
            <CardWrapper>
              <SectionTitle icon={Camera} title={`Photos (${photos.length})`} />
              {photos.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted grid place-items-center">
                    <Camera
                      className="w-5 h-5 text-muted-foreground"
                      strokeWidth={1.5}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No photos shared yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {photos.map((url, i) => (
                    <div
                      key={i}
                      className="relative group aspect-square rounded-2xl overflow-hidden border border-border"
                    >
                      <button
                        onClick={() => setLightboxSrc(url)}
                        className="w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <img
                          src={url}
                          alt={`Photo ${i + 1}`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </button>
                      {user?.id !== profile.id && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReportPhotoUrl(url);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-rose-500 hover:text-rose-400 border border-white/20 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                          title="Report Photo"
                        >
                          <Flag className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardWrapper>
          )}
        </div>
      </main>

      {/* Lightbox for viewing gallery photos */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <img
            src={lightboxSrc}
            alt="Full size photo"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxSrc(null)}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 text-white grid place-items-center hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}

      {/* Photo reporting modal */}
      {profile && (
        <ReportPhotoDialog
          open={!!reportPhotoUrl}
          onOpenChange={(open) => !open && setReportPhotoUrl(null)}
          photoUrl={reportPhotoUrl || ""}
          reportedUserId={profile.id}
        />
      )}
      <ScrollToTopButton />
    </div>
  );
}