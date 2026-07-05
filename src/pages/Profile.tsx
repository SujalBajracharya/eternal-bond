import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  Pencil,
  Check,
  X,
  Loader2,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Languages,
  Ruler,
  Cake,
  Users2,
  BadgeCheck,
  ShieldCheck,
  Sparkles,
  Mail,
  Phone,
  LogOut,
  Upload,
  Plus,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import InterestsPicker from "@/components/profile/InterestsPicker";

/* ---------------------------------------------------------------------
   DESIGN SYSTEM NOTES (kept here for future maintainers)
   Palette:  ivory #FBF7F0 (bg) · ink #2A2420 (text) ·
             maroon #7A1F2B (primary / seal) · gold #C9A15A (verified, hairlines) ·
             rose-mist #F1E4DE (soft fills)
   Type:     font-serif for names/headers, font-sans for body,
             uppercase + tracked for eyebrows/labels (data, not decoration)
   Signature: a gold hairline beneath the name + a maroon "seal" badge
             for verification — a quiet nod to a wax-seal / official stamp,
             appropriate for a trust-led matrimonial product.

   NOTE: `Profile` type and the pretty/ageFromDob/cmToFeet helpers are
   exported so OthersProfilePageView.tsx (the read-only profile viewer,
   used for /profile/:id) can share them without duplicating logic.
--------------------------------------------------------------------- */

export type Profile = {
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
  phone: string | null;
  email: string | null;
  highest_education: string | null;
  income_range: string | null;
  father_occupation: string | null;
  mother_occupation: string | null;
  siblings: string | null;
  family_type: string | null;
  photos: string[];
  kyc_status: string | null;
  profile_completed: boolean;
};

const GENDERS = ["male", "female", "other"];
const MARITAL = ["never_married", "divorced", "widowed", "separated"];
const LOOKING = ["male", "female", "other"];
const EDUCATION = [
  "high_school",
  "diploma",
  "bachelors",
  "masters",
  "doctorate",
  "other",
];
const INCOME = [
  "under_5l",
  "5l_10l",
  "10l_20l",
  "20l_50l",
  "50l_1cr",
  "above_1cr",
  "prefer_not_to_say",
];
const FAMILY = ["nuclear", "joint", "other"];
const RELIGIONS = [
  "Hindu",
  "Buddhist",
  "Islam",
  "Christianity",
  "Kirat",
  "Bon",
  "Jain",
  "Sikh",
  "Other",
];
const MOTHER_TONGUES = [
  "Nepali",
  "Maithili",
  "Bhojpuri",
  "Tharu",
  "Tamang",
  "Newar",
  "Magar",
  "Rai",
  "Limbu",
  "Gurung",
  "Sherpa",
  "Doteli",
  "Urdu",
  "Hindi",
  "English",
];

export const pretty = (v: string | null | undefined) => {
  if (!v) return "—";
  const mapping: Record<string, string> = {
    male: "Man",
    female: "Woman",
    other: "Other",
    never_married: "Never Married",
    divorced: "Divorced",
    widowed: "Widowed",
    separated: "Separated",
    high_school: "High School",
    diploma: "Diploma",
    bachelors: "Bachelor's Degree",
    masters: "Master's Degree",
    doctorate: "Doctorate / PhD",
    under_5l: "Under ₹5 Lakhs",
    "5l_10l": "₹5 Lakhs – ₹10 Lakhs",
    "10l_20l": "₹10 Lakhs – ₹20 Lakhs",
    "20l_50l": "₹20 Lakhs – ₹50 Lakhs",
    "50l_1cr": "₹50 Lakhs – ₹1 Crore",
    above_1cr: "Above ₹1 Crore",
    prefer_not_to_say: "Prefer Not to Say",
    nuclear: "Nuclear Family",
    joint: "Joint Family",
  };
  return (
    mapping[v] || v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
};

export const ageFromDob = (dob: string | null) => {
  if (!dob) return null;
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

export const cmToFeet = (cm: number | null) => {
  if (!cm) return "—";
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn - ft * 12);
  return `${ft}′ ${inch}″`;
};

/* --- Primitive UI pieces, rebuilt with the new design language --- */

const Surface = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={cn(
      "relative rounded-[1.75rem] border border-border bg-popover/80 backdrop-blur-sm",
      "shadow-[0_1px_2px_rgba(42,36,32,0.04),0_12px_32px_-16px_rgba(42,36,32,0.12)]",
      "overflow-hidden",
      className,
    )}
  >
    {children}
  </section>
);

const SectionLabel = ({
  children,
  count,
}: {
  children: React.ReactNode;
  count?: string;
}) => (
  <div className="flex items-baseline justify-between mb-5">
    <h3 className="font-serif text-[15px] tracking-wide text-foreground">
      {children}
    </h3>
    {count && (
      <span className="text-[11px] text-muted-foreground tabular-nums">
        {count}
      </span>
    )}
    {!count && <span className="h-px flex-1 ml-4 bg-border" />}
  </div>
);

const Field = ({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-start gap-3.5 py-3.5 border-b border-muted last:border-b-0">
    <div className="mt-0.5 grid place-items-center w-8 h-8 rounded-lg bg-muted/10 text-primary shrink-0">
      <Icon className="w-[15px] h-[15px]" strokeWidth={1.75} />
    </div>
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium">
        {label}
      </div>
      <div className="text-[14.5px] font-medium text-foreground mt-0.5 truncate">
        {value || "—"}
      </div>
    </div>
  </div>
);

const EditField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
      {label}
    </Label>
    {children}
  </div>
);

const inputCls =
  "rounded-xl border-border bg-card focus-visible:ring-primary/20 focus-visible:border-primary/40 h-10.5";

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [photoVisibility, setPhotoVisibility] = useState<
    Record<string, "visible" | "blurred">
  >({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/signin");
      return;
    }
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) toast.error("Couldn't load your profile");

      const { data: photoRows, error: photoError } = await supabase
        .from("profile_photos_mapping")
        .select("photo_url, visibility")
        .eq("profile_id", user.id);
      if (photoError)
        console.error("Error loading photos mapping:", photoError);

      const photos = (photoRows ?? []).map((r) => r.photo_url);
      const initialVis: Record<string, "visible" | "blurred"> = {};
      (photoRows ?? []).forEach((r) => {
        initialVis[r.photo_url] = r.visibility || "visible";
      });

      const p = (data as any) ?? {
        id: user.id,
        email: user.email,
        full_name: "",
        profile_completed: false,
        kyc_status: "unverified",
      };
      setProfile({ ...p, photos });
      setDraft({ ...p, photos });
      setPhotoVisibility(initialVis);
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

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

  const save = async () => {
    if (!draft || !user) return;
    setSaving(true);
    const {
      photos,
      id,
      email,
      kyc_status,
      profile_completed,
      photo_visibility,
      created_at,
      updated_at,
      ...rest
    } = draft as any;
    const payload = {
      ...rest,
      height_cm: rest.height_cm ? Number(rest.height_cm) : null,
      profile_completed: completion >= 70 ? true : profile_completed,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("profiles")
      .update(payload as any)
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setProfile(draft);
    setEditing(false);
    toast.success("Profile updated");
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("profile-photos")
      .upload(path, file, { upsert: true });
    if (upErr) {
      toast.error(upErr.message);
      setUploadingAvatar(false);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("profile-photos").getPublicUrl(path);
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);
    setUploadingAvatar(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setProfile((p) => (p ? { ...p, avatar_url: publicUrl } : p));
    setDraft((p) => (p ? { ...p, avatar_url: publicUrl } : p));
    toast.success("Avatar photo updated");
  };

  const uploadGalleryPhoto = async (file: File) => {
    if (!user || !profile) return;
    setUploadingPhoto(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/gallery-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("profile-photos")
      .upload(path, file);
    if (upErr) {
      toast.error(upErr.message);
      setUploadingPhoto(false);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("profile-photos").getPublicUrl(path);

    const { error } = await supabase.from("profile_photos_mapping").insert({
      profile_id: user.id,
      photo_url: publicUrl,
      visibility: "visible",
    });
    setUploadingPhoto(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    const next = [...(profile.photos ?? []), publicUrl];
    setProfile({ ...profile, photos: next });
    setDraft((p) => (p ? { ...p, photos: next } : p));
    setPhotoVisibility((prev) => ({ ...prev, [publicUrl]: "visible" }));
    toast.success("Photo added to gallery");
  };

  const removeGalleryPhoto = async (url: string) => {
    if (!user || !profile) return;
    const { error } = await supabase
      .from("profile_photos_mapping")
      .delete()
      .eq("profile_id", user.id)
      .eq("photo_url", url);
    if (error) {
      toast.error(error.message);
      return;
    }

    const marker = "/profile-photos/";
    const idx = url.indexOf(marker);
    if (idx >= 0) {
      const path = url.slice(idx + marker.length);
      await supabase.storage.from("profile-photos").remove([path]);
    }

    const next = profile.photos.filter((p) => p !== url);
    setProfile({ ...profile, photos: next });
    setDraft((p) => (p ? { ...p, photos: next } : p));
    setPhotoVisibility((prev) => {
      const copy = { ...prev };
      delete copy[url];
      return copy;
    });
    toast.success("Photo removed from gallery");
  };

  const togglePhotoVisibility = async (url: string) => {
    if (!user || !profile) return;
    const current = photoVisibility[url] ?? "visible";
    const next: "visible" | "blurred" =
      current === "visible" ? "blurred" : "visible";

    const { error } = await supabase
      .from("profile_photos_mapping")
      .update({ visibility: next })
      .eq("profile_id", user.id)
      .eq("photo_url", url);

    if (error) {
      toast.error(error.message);
      return;
    }

    setPhotoVisibility((prev) => ({ ...prev, [url]: next }));
    toast.success(`Photo is now ${next}`);
  };

  if (authLoading || loading || !profile || !draft) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const age = ageFromDob(profile.date_of_birth);
  const verified = profile.kyc_status === "verified";
  const setF = <K extends keyof Profile>(k: K, v: Profile[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  return (
    <div className="min-h-screen bg-background pb-28 selection:bg-primary/15 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div
        className="absolute -top-40 -left-32 w-[420px] h-[420px] bg-gradient-warm opacity-70 animate-blob blur-2xl pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute top-40 -right-36 w-[360px] h-[360px] bg-gradient-blush opacity-80 animate-blob blur-2xl pointer-events-none"
        style={{ animationDelay: "1.6s" }}
        aria-hidden
      />
      {/* Top bar — quiet, no gradient theatrics */}
      <div className="sticky top-0 z-20 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link
            to="/today"
            className="inline-flex items-center gap-2 text-[13.5px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} /> Back
          </Link>
          <div className="flex items-center gap-2">
            {!editing ? (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-muted-foreground hover:text-primary hover:bg-muted/60"
                >
                  <Link to="/settings">
                    <ShieldCheck
                      className="w-3.5 h-3.5 mr-1.5"
                      strokeWidth={1.75}
                    />{" "}
                    Settings
                  </Link>
                </Button>
                <Button
                  onClick={() => setEditing(true)}
                  size="sm"
                  className="rounded-full bg-primary hover:bg-primary-deep text-primary-foreground border-0 shadow-glow"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.75} />{" "}
                  Edit profile
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => {
                    setDraft(profile);
                    setEditing(false);
                  }}
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-muted-foreground hover:bg-muted/60"
                >
                  <X className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.75} /> Cancel
                </Button>
                <Button
                  onClick={save}
                  disabled={saving}
                  size="sm"
                  className="rounded-full bg-primary hover:bg-primary-deep text-primary-foreground border-0 shadow-glow"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.75} />
                  )}
                  Save changes
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 pt-8">
        {/* Identity card */}
        <Surface className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-7 sm:items-center">
            <div className="relative shrink-0 mx-auto sm:mx-0">
              <div className="w-28 h-28 rounded-full overflow-hidden ring-1 ring-border ring-offset-4 ring-offset-white bg-card grid place-items-center shadow-card">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name ?? "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-serif text-primary">
                    {(profile.full_name ?? "·").trim().charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={() => avatarInput.current?.click()}
                className="absolute -bottom-1 -right-1 grid place-items-center w-9 h-9 rounded-full bg-card border border-border shadow-sm hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors duration-200"
                aria-label="Change photo"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" strokeWidth={1.75} />
                )}
              </button>
              <input
                ref={avatarInput}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) =>
                  e.target.files?.[0] && uploadAvatar(e.target.files[0])
                }
              />
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex items-center gap-2.5 justify-center sm:justify-start flex-wrap">
                {editing ? (
                  <Input
                    value={draft.full_name ?? ""}
                    onChange={(e) => setF("full_name", e.target.value)}
                    placeholder="Your full name"
                    className={cn(
                      inputCls,
                      "text-xl font-serif max-w-sm animate-fade-in-up",
                    )}
                  />
                ) : (
                  <h1 className="text-[28px] leading-tight font-serif text-foreground animate-fade-in-up">
                    {profile.full_name || "Your name"}
                  </h1>
                )}
                {verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-[0.08em] pl-1.5 pr-2.5 py-1">
                    <BadgeCheck className="w-3 h-3" strokeWidth={2} /> Verified
                  </span>
                )}
              </div>
              {/* gold hairline signature mark */}
              <div className="mt-2 h-px w-16 bg-accent mx-auto sm:mx-0" />

              <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13.5px] text-muted-foreground justify-center sm:justify-start">
                {age && <span>{age} yrs</span>}
                {profile.profession && (
                  <>
                    <span className="text-muted-foreground/60">·</span>
                    <span>{profile.profession}</span>
                  </>
                )}
                {profile.location && (
                  <>
                    <span className="text-muted-foreground/60">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" strokeWidth={1.75} />
                      {profile.location}
                    </span>
                  </>
                )}
              </div>

              <div className="mt-5 max-w-xs mx-auto sm:mx-0 animate-fade-in-up">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5 uppercase tracking-[0.1em]">
                  <span>Profile strength</span>
                  <span className="tabular-nums">{completion}%</span>
                </div>
                <Progress
                  value={completion}
                  className="h-1 bg-muted [&>div]:bg-primary"
                />
              </div>
            </div>
          </div>
        </Surface>

        {/* Tabs */}
        <Tabs defaultValue="about" className="mt-6">
          <TabsList className="bg-transparent border-b border-border rounded-none p-0 h-auto w-full justify-start gap-6 flex-wrap">
            {[
              ["about", "About"],
              ["background", "Background"],
              ["family", "Family"],
              ["interests", "Interests"],
              ["photos", "Photos"],
              ["account", "Account"],
            ].map(([v, label]) => (
              <TabsTrigger
                key={v}
                value={v}
                className="rounded-none px-0 py-3 bg-transparent text-[13.5px] font-medium text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary transition-colors"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ABOUT */}
          <TabsContent value="about" className="mt-6 space-y-5">
            <Surface className="p-6">
              <SectionLabel>Bio</SectionLabel>
              {editing ? (
                <Textarea
                  value={draft.bio ?? ""}
                  onChange={(e) => setF("bio", e.target.value)}
                  rows={5}
                  placeholder="A few honest sentences about who you are and what matters to you."
                  className={cn(inputCls, "h-auto leading-relaxed")}
                />
              ) : (
                <p className="text-[14.5px] text-foreground leading-relaxed whitespace-pre-wrap">
                  {profile.bio || (
                    <span className="text-muted-foreground italic">
                      No bio yet — share a few words about yourself.
                    </span>
                  )}
                </p>
              )}
            </Surface>

            <Surface className="p-6">
              <SectionLabel>Personal details</SectionLabel>
              {editing ? (
                <div className="grid sm:grid-cols-2 gap-5">
                  <EditField label="Date of birth">
                    <Input
                      type="date"
                      value={draft.date_of_birth ?? ""}
                      onChange={(e) => setF("date_of_birth", e.target.value)}
                      className={inputCls}
                    />
                  </EditField>
                  <EditField label="Gender">
                    <Select
                      value={draft.gender ?? ""}
                      onValueChange={(v) => setF("gender", v)}
                    >
                      <SelectTrigger className={inputCls}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDERS.map((g) => (
                          <SelectItem key={g} value={g}>
                            {pretty(g)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </EditField>
                  <EditField label="Location">
                    <Input
                      value={draft.location ?? ""}
                      onChange={(e) => setF("location", e.target.value)}
                      placeholder="City, Country"
                      className={inputCls}
                    />
                  </EditField>
                  <EditField
                    label={`Height (cm)${draft.height_cm ? ` · ${cmToFeet(draft.height_cm)}` : ""}`}
                  >
                    <Input
                      type="number"
                      value={draft.height_cm ?? ""}
                      onChange={(e) =>
                        setF(
                          "height_cm",
                          e.target.value
                            ? Number(e.target.value)
                            : (null as any),
                        )
                      }
                      className={inputCls}
                    />
                  </EditField>
                  <EditField label="Marital status">
                    <Select
                      value={draft.marital_status ?? ""}
                      onValueChange={(v) => setF("marital_status", v)}
                    >
                      <SelectTrigger className={inputCls}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {MARITAL.map((g) => (
                          <SelectItem key={g} value={g}>
                            {pretty(g)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </EditField>
                  <EditField label="Looking for">
                    <Select
                      value={draft.looking_for ?? ""}
                      onValueChange={(v) => setF("looking_for", v)}
                    >
                      <SelectTrigger className={inputCls}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {LOOKING.map((g) => (
                          <SelectItem key={g} value={g}>
                            {pretty(g)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </EditField>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-x-8">
                  <div>
                    <Field
                      icon={Cake}
                      label="Age"
                      value={age ? `${age} years` : "—"}
                    />
                    <Field
                      icon={Ruler}
                      label="Height"
                      value={cmToFeet(profile.height_cm)}
                    />
                    <Field
                      icon={MapPin}
                      label="Location"
                      value={profile.location}
                    />
                  </div>
                  <div>
                    <Field
                      icon={Heart}
                      label="Marital status"
                      value={pretty(profile.marital_status)}
                    />
                    <Field
                      icon={Sparkles}
                      label="Looking for"
                      value={pretty(profile.looking_for)}
                    />
                    <Field
                      icon={Users2}
                      label="Gender"
                      value={pretty(profile.gender)}
                    />
                  </div>
                </div>
              )}
            </Surface>
          </TabsContent>

          {/* BACKGROUND */}
          <TabsContent value="background" className="mt-6 space-y-5">
            <Surface className="p-6">
              <SectionLabel>Education & career</SectionLabel>
              {editing ? (
                <div className="grid sm:grid-cols-2 gap-5">
                  <EditField label="Highest education">
                    <Select
                      value={draft.highest_education ?? ""}
                      onValueChange={(v) => setF("highest_education", v)}
                    >
                      <SelectTrigger className={inputCls}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {EDUCATION.map((g) => (
                          <SelectItem key={g} value={g}>
                            {pretty(g)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </EditField>
                  <EditField label="Profession">
                    <Input
                      value={draft.profession ?? ""}
                      onChange={(e) => setF("profession", e.target.value)}
                      className={inputCls}
                    />
                  </EditField>
                  <EditField label="Income range">
                    <Select
                      value={draft.income_range ?? ""}
                      onValueChange={(v) => setF("income_range", v)}
                    >
                      <SelectTrigger className={inputCls}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {INCOME.map((g) => (
                          <SelectItem key={g} value={g}>
                            {pretty(g)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </EditField>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-x-8">
                  <div>
                    <Field
                      icon={GraduationCap}
                      label="Education"
                      value={pretty(profile.highest_education)}
                    />
                    <Field
                      icon={Briefcase}
                      label="Profession"
                      value={profile.profession}
                    />
                  </div>
                  <div>
                    <Field
                      icon={Sparkles}
                      label="Income range"
                      value={pretty(profile.income_range)}
                    />
                  </div>
                </div>
              )}
            </Surface>

            <Surface className="p-6">
              <SectionLabel>Faith & language</SectionLabel>
              {editing ? (
                <div className="grid sm:grid-cols-2 gap-5">
                  <EditField label="Religion">
                    <Select
                      value={draft.religion ?? ""}
                      onValueChange={(v) => setF("religion", v)}
                    >
                      <SelectTrigger className={inputCls}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELIGIONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </EditField>
                  <EditField label="Mother tongue">
                    <Select
                      value={draft.mother_tongue ?? ""}
                      onValueChange={(v) => setF("mother_tongue", v)}
                    >
                      <SelectTrigger className={inputCls}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOTHER_TONGUES.map((mt) => (
                          <SelectItem key={mt} value={mt}>
                            {mt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </EditField>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-x-8">
                  <div>
                    <Field
                      icon={Sparkles}
                      label="Religion"
                      value={profile.religion}
                    />
                  </div>
                  <div>
                    <Field
                      icon={Languages}
                      label="Mother tongue"
                      value={profile.mother_tongue}
                    />
                  </div>
                </div>
              )}
            </Surface>
          </TabsContent>

          {/* FAMILY */}
          <TabsContent value="family" className="mt-6 space-y-5">
            <Surface className="p-6">
              <SectionLabel>Family</SectionLabel>
              {editing ? (
                <div className="grid sm:grid-cols-2 gap-5">
                  <EditField label="Family type">
                    <Select
                      value={draft.family_type ?? ""}
                      onValueChange={(v) => setF("family_type", v)}
                    >
                      <SelectTrigger className={inputCls}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {FAMILY.map((g) => (
                          <SelectItem key={g} value={g}>
                            {pretty(g)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </EditField>
                  <EditField label="Siblings">
                    <Input
                      value={draft.siblings ?? ""}
                      onChange={(e) => setF("siblings", e.target.value)}
                      placeholder="e.g. 1 brother, 1 sister"
                      className={inputCls}
                    />
                  </EditField>
                  <EditField label="Father's occupation">
                    <Input
                      value={draft.father_occupation ?? ""}
                      onChange={(e) =>
                        setF("father_occupation", e.target.value)
                      }
                      className={inputCls}
                    />
                  </EditField>
                  <EditField label="Mother's occupation">
                    <Input
                      value={draft.mother_occupation ?? ""}
                      onChange={(e) =>
                        setF("mother_occupation", e.target.value)
                      }
                      className={inputCls}
                    />
                  </EditField>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-x-8">
                  <div>
                    <Field
                      icon={Users2}
                      label="Family type"
                      value={pretty(profile.family_type)}
                    />
                    <Field
                      icon={Users2}
                      label="Siblings"
                      value={profile.siblings}
                    />
                  </div>
                  <div>
                    <Field
                      icon={Briefcase}
                      label="Father's occupation"
                      value={profile.father_occupation}
                    />
                    <Field
                      icon={Briefcase}
                      label="Mother's occupation"
                      value={profile.mother_occupation}
                    />
                  </div>
                </div>
              )}
            </Surface>
          </TabsContent>

          {/* INTERESTS */}
          <TabsContent value="interests" className="mt-6">
            <Surface className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-serif text-[15px] text-foreground">
                    Interests &amp; passions
                  </h3>
                  <p className="text-[12.5px] text-muted-foreground mt-1 max-w-sm">
                    Used for match recommendations, compatibility scoring, and
                    search. The more you add, the better your matches.
                  </p>
                </div>
              </div>
              <InterestsPicker profileId={profile.id} />
            </Surface>
          </TabsContent>

          {/* PHOTOS */}
          <TabsContent value="photos" className="mt-6">
            <Surface className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-serif text-[15px] text-foreground">
                    Gallery & privacy
                  </h3>
                  <p className="text-[12.5px] text-muted-foreground mt-1">
                    {profile.photos.length} of 6 photos added · blurred photos
                    are hidden until you accept a match
                  </p>
                </div>
                <Button
                  onClick={() => photoInput.current?.click()}
                  disabled={uploadingPhoto || profile.photos.length >= 6}
                  size="sm"
                  className="rounded-full bg-primary hover:bg-primary-deep text-primary-foreground border-0 shrink-0"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.75} />
                  )}
                  Add photo
                </Button>
                <input
                  ref={photoInput}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) =>
                    e.target.files?.[0] && uploadGalleryPhoto(e.target.files[0])
                  }
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {profile.photos.map((url, i) => {
                  const vis = photoVisibility[url] ?? "visible";
                  const isBlurred = vis === "blurred";
                  return (
                    <div
                      key={url}
                      className="relative group aspect-[3/4] rounded-2xl overflow-hidden bg-muted/10 border border-border transform transition-all duration-500 hover:scale-[1.02]"
                    >
                      <img
                        src={url}
                        alt=""
                        className={cn(
                          "absolute inset-0 w-full h-full object-cover transition-all duration-500",
                          isBlurred && "blur-md scale-105",
                        )}
                      />

                      {isBlurred && (
                        <div className="absolute inset-0 bg-foreground/10 flex items-center justify-center pointer-events-none">
                          <span className="px-2.5 py-1 rounded-full bg-card/95 text-foreground text-[10px] font-semibold tracking-wide uppercase shadow-sm flex items-center gap-1">
                            <EyeOff className="w-3 h-3 text-muted-foreground" />{" "}
                            Hidden
                          </span>
                        </div>
                      )}

                      <button
                        onClick={() => removeGalleryPhoto(url)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-card/95 hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm flex items-center justify-center z-10 opacity-0 group-hover:opacity-100"
                        aria-label="Remove photo"
                      >
                        <Trash2 className="w-3 h-3" strokeWidth={1.75} />
                      </button>

                      {i === 0 && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-accent text-primary-foreground text-[9px] font-bold tracking-wide z-10">
                          MAIN
                        </span>
                      )}

                      <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                        <button
                          type="button"
                          onClick={() => togglePhotoVisibility(url)}
                          className={cn(
                            "w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10.5px] font-semibold uppercase tracking-wide transition-colors duration-200",
                            !isBlurred
                              ? "bg-card text-foreground"
                              : "bg-card/15 text-card-foreground border border-white/30 hover:bg-white/25",
                          )}
                        >
                          {isBlurred ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                          {isBlurred ? "Blurred" : "Visible"}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {profile.photos.length === 0 && (
                  <button
                    onClick={() => photoInput.current?.click()}
                    className="col-span-full aspect-[3/1] rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-muted/50 transition-colors grid place-items-center text-muted-foreground"
                  >
                    <div className="text-center">
                      <Upload
                        className="w-5 h-5 mx-auto mb-2"
                        strokeWidth={1.5}
                      />
                      <div className="text-[13px] font-medium">
                        Add your first photo
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </Surface>
          </TabsContent>

          {/* ACCOUNT */}
          <TabsContent value="account" className="mt-6 space-y-5">
            <Surface className="p-6">
              <SectionLabel>Contact</SectionLabel>
              {editing ? (
                <div className="grid sm:grid-cols-2 gap-5">
                  <EditField label="Email">
                    <Input
                      value={draft.email ?? ""}
                      disabled
                      className={cn(
                        inputCls,
                        "bg-muted/60 cursor-not-allowed text-muted-foreground",
                      )}
                    />
                  </EditField>
                  <EditField label="Phone">
                    <Input
                      value={draft.phone ?? ""}
                      onChange={(e) => setF("phone", e.target.value)}
                      placeholder="+977 ..."
                      className={inputCls}
                    />
                  </EditField>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-x-8">
                  <div>
                    <Field icon={Mail} label="Email" value={profile.email} />
                  </div>
                  <div>
                    <Field icon={Phone} label="Phone" value={profile.phone} />
                  </div>
                </div>
              )}
            </Surface>

            <Surface className="p-6">
              <SectionLabel>Verification</SectionLabel>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3.5">
                  <div
                    className={cn(
                      "grid place-items-center w-11 h-11 rounded-full shrink-0",
                      profile.kyc_status === "verified" &&
                        "bg-primary/10 text-primary",
                      profile.kyc_status === "pending" &&
                        "bg-accent/15 text-accent-foreground",
                      profile.kyc_status === "rejected" &&
                        "bg-rose-500/10 text-rose-600",
                      (!profile.kyc_status ||
                        profile.kyc_status === "unverified") &&
                        "bg-muted/10 text-muted-foreground",
                    )}
                  >
                    <BadgeCheck
                      className="w-[18px] h-[18px]"
                      strokeWidth={1.75}
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-[14px] text-foreground">
                      {profile.kyc_status === "verified" && "Verified profile"}
                      {profile.kyc_status === "pending" &&
                        "Verification pending"}
                      {profile.kyc_status === "rejected" &&
                        "Verification rejected"}
                      {(!profile.kyc_status ||
                        profile.kyc_status === "unverified") &&
                        "Get verified"}
                    </div>
                    <div className="text-[12.5px] text-muted-foreground mt-0.5">
                      {profile.kyc_status === "verified" &&
                        "Your identity has been confirmed."}
                      {profile.kyc_status === "pending" &&
                        "We're reviewing your ID documents — usually within 24 hours."}
                      {profile.kyc_status === "rejected" &&
                        "We couldn't confirm your details. Check your settings and try again."}
                      {(!profile.kyc_status ||
                        profile.kyc_status === "unverified") &&
                        "Verified profiles get more interest from matches."}
                    </div>
                  </div>
                </div>
                {profile.kyc_status !== "verified" && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full border-border text-primary hover:bg-muted/20 shrink-0"
                  >
                    <Link to="/settings">
                      {profile.kyc_status === "rejected"
                        ? "Retry"
                        : profile.kyc_status === "pending"
                          ? "Check status"
                          : "Start verification"}
                    </Link>
                  </Button>
                )}
              </div>
            </Surface>

            <Surface className="p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-semibold text-[14px] text-foreground">
                    Sign out
                  </h3>
                  <p className="text-[12.5px] text-muted-foreground mt-0.5">
                    You'll need to sign in again to access your matches.
                  </p>
                </div>
                <Button
                  onClick={async () => {
                    await signOut();
                    navigate("/signin");
                  }}
                  variant="outline"
                  size="sm"
                  className="rounded-full border-border text-muted-foreground hover:bg-muted/20"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.75} />{" "}
                  Sign out
                </Button>
              </div>
            </Surface>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
