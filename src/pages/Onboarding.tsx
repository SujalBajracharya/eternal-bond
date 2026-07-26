import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  Heart,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  Sparkles,
  LogOut,
  ShieldCheck,
  Star,
  ImagePlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import ProfileChecklist, {
  ChecklistItem,
} from "@/components/onboarding/ProfileChecklist";
import PhotoUploader from "@/components/onboarding/PhotoUploader";
import PhotoPrivacy from "@/components/onboarding/PhotoPrivacy";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type Gender = "male" | "female" | "other";
type LookingFor = Gender;
type Marital = "never_married" | "divorced" | "widowed" | "separated";
type Education =
  | "high_school"
  | "diploma"
  | "bachelors"
  | "masters"
  | "doctorate"
  | "other";
type Income =
  | "under_5l"
  | "5l_10l"
  | "10l_20l"
  | "20l_50l"
  | "50l_1cr"
  | "above_1cr"
  | "prefer_not_to_say";
type FamilyType = "joint" | "nuclear" | "other";
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

interface FormState {
  full_name: string;
  gender: Gender | "";
  date_of_birth: string;
  location: string;
  profession: string;
  height: string;
  religion: string;
  mother_tongue: string;
  marital_status: Marital | "";
  looking_for: LookingFor | "";
  bio: string;
  // New fields
  highest_education: Education | "";
  income_range: Income | "";
  father_occupation: string;
  mother_occupation: string;
  siblings: string;
  family_type: FamilyType | "";
  photos: string[];
  social_instagram: string;
  social_linkedin: string;
  social_website: string;
  kundali_name: string;
  citizenship_front_url: string;
  citizenship_back_url: string;
}

const initial: FormState = {
  full_name: "",
  gender: "",
  date_of_birth: "",
  location: "",
  profession: "",
  height: "",
  religion: "",
  mother_tongue: "",
  marital_status: "",
  looking_for: "",
  bio: "",
  highest_education: "",
  income_range: "",
  father_occupation: "",
  mother_occupation: "",
  siblings: "",
  family_type: "",
  photos: [],
  social_instagram: "",
  social_linkedin: "",
  social_website: "",
  kundali_name: "",
  citizenship_front_url: "",
  citizenship_back_url: "",
};

const stepSchemas = [
  // Step 1 — basics
  z.object({
    full_name: z.string().trim().min(2, "Please enter your name").max(100),
    gender: z.enum(["male", "female", "other"], {
      errorMap: () => ({ message: "Select a gender" }),
    }),
    date_of_birth: z
      .string()
      .min(1, "Date of birth is required")
      .refine((d) => {
        const dob = new Date(d);
        if (isNaN(dob.getTime())) return false;
        const age =
          (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        return age >= 18 && age <= 100;
      }, "You must be at least 18 years old"),
    location: z.string().trim().min(2, "Where do you live?").max(120),
  }),
  // Step 2 — background
  z.object({
    profession: z.string().trim().min(2, "Tell us your profession").max(120),
    height: z
      .string()
      .refine(
        (v) => v === "" || /^([3-7])'(\d{1,2})$/.test(v),
        "Use format like 5'8, 5'10",
      ),
    religion: z.string().trim().max(60).optional().or(z.literal("")),
    mother_tongue: z.string().trim().max(60).optional().or(z.literal("")),
    marital_status: z.enum(
      ["never_married", "divorced", "widowed", "separated"],
      { errorMap: () => ({ message: "Select your marital status" }) },
    ),
  }),
  // Step 3 — preferences & story
  z.object({
    looking_for: z.enum(["male", "female", "other"], {
      errorMap: () => ({ message: "Select who you're seeking" }),
    }),
    bio: z
      .string()
      .trim()
      .min(20, "Share at least a sentence or two (20 chars)")
      .max(800, "Keep it under 800 characters"),
  }),
  // Step 4 — family & extras (all optional but tracked in checklist)
  z.object({}).passthrough(),
];

const steps = [
  {
    chapter: "Hello",
    prompt: "What should we call you?",
    sub: "The first thread of your story — a name, a hometown, a birthday.",
  },
  {
    chapter: "Your world",
    prompt: "Tell us about your everyday.",
    sub: "What you do, where you've been, what shapes your days.",
  },
  {
    chapter: "Your heart",
    prompt: "Who are you looking for?",
    sub: "Speak in your own voice — it's how someone will recognise you.",
  },
  {
    chapter: "Your circle",
    prompt: "A few finishing touches.",
    sub: "Photos, family, verification — the warmth that makes a profile feel real.",
  },
];

const Onboarding = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [kycStatus, setKycStatus] = useState<
    "unverified" | "pending" | "verified" | "rejected"
  >("unverified");
  const [photoVisibility, setPhotoVisibility] = useState<
    Record<string, "visible" | "blurred">
  >({});
  const [openReligion, setOpenReligion] = useState(false);
  const [openMT, setOpenMT] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/signin", { replace: true });
      return;
    }
    const isEmailUser = !!user.email && !user.phone;
    if (isEmailUser && !user.email_confirmed_at && !user.confirmed_at) {
      navigate("/verify-email", { replace: true });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      // Fetch photos from the separate mapping table
      const { data: photoRows } = await supabase
        .from("profile_photos_mapping")
        .select("photo_url, visibility")
        .eq("profile_id", user.id);
      const photoUrls = (photoRows ?? []).map((r) => r.photo_url);
      const initialVisibility: Record<string, "visible" | "blurred"> = {};
      (photoRows ?? []).forEach((r) => {
        initialVisibility[r.photo_url] = r.visibility || "visible";
      });
      setPhotoVisibility(initialVisibility);

      if (data) {
        const links = (data.social_links as Record<string, string>) ?? {};
        setForm({
          full_name: data.full_name ?? "",
          gender: (data.gender as Gender) ?? "",
          date_of_birth: data.date_of_birth ?? "",
          location: data.location ?? "",
          profession: data.profession ?? "",
          height: data.height_cm
            ? (() => {
                const totalInches = data.height_cm / 2.54;
                let feet = Math.floor(totalInches / 12);
                let inches = Math.round(totalInches % 12);
                if (inches === 12) {
                  feet += 1;
                  inches = 0;
                }
                return `${feet}'${inches}`;
              })()
            : "",
          religion: data.religion ?? "",
          mother_tongue: data.mother_tongue ?? "",
          marital_status: (data.marital_status as Marital) ?? "",
          looking_for: (data.looking_for as LookingFor) ?? "",
          bio: data.bio ?? "",
          highest_education: (data.highest_education as Education) ?? "",
          income_range: (data.income_range as Income) ?? "",
          father_occupation: data.father_occupation ?? "",
          mother_occupation: data.mother_occupation ?? "",
          siblings: data.siblings ?? "",
          family_type: (data.family_type as FamilyType) ?? "",
          photos: photoUrls,
          social_instagram: links.instagram ?? "",
          social_linkedin: links.linkedin ?? "",
          social_website: links.website ?? "",
          kundali_name: data.kundali_name ?? "",
          citizenship_front_url: data.citizenship_front_url ?? "",
          citizenship_back_url: data.citizenship_back_url ?? "",
        });
        setKycStatus((data.kyc_status as typeof kycStatus) ?? "unverified");
      } else {
        // No profile yet — still populate photos if any exist
        if (photoUrls.length > 0) {
          setForm((f) => ({ ...f, photos: photoUrls }));
        }
      }
      setHydrating(false);
    })();
  }, [user, authLoading, navigate]);

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Build the live checklist from current form state
  const checklist: ChecklistItem[] = useMemo(
    () => [
      {
        key: "name",
        label: "Full name",
        done: form.full_name.trim().length >= 2,
        required: true,
      },
      {
        key: "gender",
        label: "Gender & date of birth",
        done: !!form.gender && !!form.date_of_birth,
        required: true,
      },
      {
        key: "location",
        label: "Location",
        done: form.location.trim().length >= 2,
        required: true,
      },
      {
        key: "profession",
        label: "Profession",
        done: form.profession.trim().length >= 2,
        required: true,
      },
      {
        key: "marital",
        label: "Marital status",
        done: !!form.marital_status,
        required: true,
      },
      {
        key: "seeking",
        label: "Looking for",
        done: !!form.looking_for,
        required: true,
      },
      {
        key: "bio",
        label: "Your story (bio)",
        done: form.bio.trim().length >= 20,
        required: true,
      },
      {
        key: "education",
        label: "Highest education",
        done: !!form.highest_education,
        hint: "Helps refine matches",
      },
      {
        key: "income",
        label: "Income range",
        done: !!form.income_range,
        hint: "Optional but builds trust",
      },
      {
        key: "father",
        label: "Father's occupation",
        done: form.father_occupation.trim().length > 0,
      },
      {
        key: "mother",
        label: "Mother's occupation",
        done: form.mother_occupation.trim().length > 0,
      },
      {
        key: "siblings",
        label: "Siblings",
        done: form.siblings.trim().length > 0,
      },
      {
        key: "family_type",
        label: "Family type (joint / nuclear)",
        done: !!form.family_type,
      },
      {
        key: "photos",
        label: "Add 3–5 photos",
        done: form.photos.length >= 3,
        hint:
          form.photos.length === 0
            ? "Profiles with photos get 8× more interest"
            : `${form.photos.length}/3 minimum`,
      },
      {
        key: "socials",
        label: "Add social links",
        done: !!(
          form.social_instagram ||
          form.social_linkedin ||
          form.social_website
        ),
      },
      {
        key: "kundali",
        label: "Kundali name / details",
        done: form.kundali_name.trim().length > 0,
      },
      {
        key: "kyc",
        label: "KYC verification",
        done: kycStatus === "verified",
        hint: "Get a verified badge",
      },
    ],
    [form, kycStatus],
  );

  const validateCurrent = () => {
    const result = stepSchemas[step].safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrent()) return;
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const persist = async (
    markComplete: boolean,
    kycStatusOverride?: typeof kycStatus,
  ) => {
    if (!user) return false;

    console.log("🚀 PERSIST STARTED");

    if (markComplete && !validateCurrent()) return false;

    if (markComplete) {
      const missingRequired = checklist.filter((c) => c.required && !c.done);
      if (missingRequired.length > 0) {
        toast.error(`Please complete: ${missingRequired[0].label}`);
        return false;
      }
    }

    setSaving(true);

    const social_links: Record<string, string> = {};
    if (form.social_instagram.trim())
      social_links.instagram = form.social_instagram.trim();
    if (form.social_linkedin.trim())
      social_links.linkedin = form.social_linkedin.trim();
    if (form.social_website.trim())
      social_links.website = form.social_website.trim();

    const payload = {
      id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      full_name: form.full_name.trim(),
      gender: (form.gender || null) as Gender | null,
      date_of_birth: form.date_of_birth || null,
      location: form.location.trim() || null,
      profession: form.profession.trim() || null,

      height_cm: form.height
        ? (() => {
            const match = form.height.match(/^(\d)'(\d{1,2})$/);
            if (!match) return null;
            const ft = parseInt(match[1]);
            const inch = parseInt(match[2]);
            return Math.round(ft * 30.48 + inch * 2.54);
          })()
        : null,

      religion: form.religion.trim() || null,
      mother_tongue: form.mother_tongue.trim() || null,
      marital_status: (form.marital_status || null) as Marital | null,
      looking_for: (form.looking_for || null) as LookingFor | null,

      bio: form.bio.trim() || null,

      highest_education: (form.highest_education || null) as Education | null,
      income_range: (form.income_range || null) as Income | null,

      father_occupation: form.father_occupation.trim() || null,
      mother_occupation: form.mother_occupation.trim() || null,
      siblings: form.siblings.trim() || null,
      family_type: (form.family_type || null) as FamilyType | null,

      social_links,

      kundali_name: form.kundali_name.trim() || null,
      citizenship_front_url: form.citizenship_front_url || null,
      citizenship_back_url: form.citizenship_back_url || null,

      email: user.email ?? null,
      phone: user.phone ?? null,

      ...(markComplete ? { profile_completed: true } : {}),
    };

    // =========================
    // 🔥 DEBUG BLOCK (IMPORTANT)
    // =========================

    console.log("📦 FINAL PAYLOAD:");
    console.log(JSON.stringify(payload, null, 2));

    console.log("📏 STRING LENGTH CHECK:");
    Object.entries(payload).forEach(([key, value]) => {
      if (typeof value === "string") {
        console.log(`${key}: ${value.length}`);
      }
    });

    console.log("🚨 FIELDS > 255 CHARS:");
    Object.entries(payload).forEach(([key, value]) => {
      if (typeof value === "string" && value.length > 255) {
        console.error(`❌ TOO LONG -> ${key}: ${value.length}`);
      }
    });

    // =========================
    // SUPABASE INSERT
    // =========================

    // const { error } = await supabase
    //   .from("profiles")
    //   .update({
    //     kyc_status: "pending",
    //     updated_at: new Date().toISOString(),
    //   })
    //   .eq("id", user.id);

    // if (error) {
    //   console.error("❌ SUPABASE ERROR:", error);
    //   setSaving(false);
    //   toast.error(error.message);
    //   return false;
    // }
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,

        // REQUIRED FIELDS (must exist in DB)
        full_name: form.full_name.trim(),
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        location: form.location.trim() || null,
        profession: form.profession.trim() || null,

        height_cm: form.height
          ? (() => {
              const match = form.height.match(/^(\d)'(\d{1,2})$/);
              if (!match) return null;
              const ft = parseInt(match[1]);
              const inch = parseInt(match[2]);
              return Math.round(ft * 30.48 + inch * 2.54);
            })()
          : null,

        religion: form.religion.trim() || null,
        mother_tongue: form.mother_tongue.trim() || null,
        marital_status: form.marital_status || null,
        looking_for: form.looking_for || null,
        bio: form.bio.trim() || null,

        highest_education: form.highest_education || null,
        income_range: form.income_range || null,

        father_occupation: form.father_occupation.trim() || null,
        mother_occupation: form.mother_occupation.trim() || null,
        siblings: form.siblings.trim() || null,
        family_type: form.family_type || null,

        social_links,

        kundali_name: form.kundali_name.trim() || null,
        citizenship_front_url: form.citizenship_front_url || null,
        citizenship_back_url: form.citizenship_back_url || null,

        email: user.email ?? null,
        phone: user.phone ?? null,

        // 🔥 CRITICAL FIXES
        kyc_status: kycStatusOverride ?? kycStatus ?? "unverified",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),

        ...(markComplete ? { profile_completed: true } : {}),
        photo_visibility: "everyone",
        profile_visibility: "everyone",
      },
      { onConflict: "id" },
    );

    if (error) {
      console.error("❌ SUPABASE ERROR:", error);
      toast.error(error.message);
      setSaving(false);
      return false;
    }

    // =========================
    // PHOTO SYNC
    // =========================

    try {
      await supabase
        .from("profile_photos_mapping")
        .delete()
        .eq("profile_id", user.id);

      if (form.photos.length > 0) {
        const photoRows = form.photos.map((url) => ({
          profile_id: user.id,
          photo_url: url,
          visibility: photoVisibility[url] ?? "visible",
        }));

        const { error: photoError } = await supabase
          .from("profile_photos_mapping")
          .insert(photoRows);

        if (photoError) {
          console.error("❌ PHOTO ERROR:", photoError);
          toast.error(`Photos: ${photoError.message}`);
          setSaving(false);
          return false;
        }
      }
    } catch (err) {
      console.error("❌ PHOTO SYNC FAILED:", err);
    }

    setSaving(false);
    return true;
  };

  const handleSubmit = async () => {
    const ok = await persist(true);
    if (!ok) return;
    toast.success("Welcome to EternalBond ✨");
    navigate("/", { replace: true });
  };

  const handleSaveDraft = async () => {
    const ok = await persist(false);
    if (ok) toast.success("Progress saved");
  };

  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);

  const handleDocumentUpload = async (file: File, side: "front" | "back") => {
    if (!user) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG or WebP images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5 MB");
      return;
    }

    if (side === "front") setUploadingFront(true);
    else setUploadingBack(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/kyc-${side}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("profile-photos")
        .upload(path, file, { upsert: false, contentType: file.type });

      if (error) {
        toast.error(`Upload failed: ${error.message}`);
        return;
      }

      const { data } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(path);
      set(
        side === "front" ? "citizenship_front_url" : "citizenship_back_url",
        data.publicUrl,
      );
      toast.success(
        `${side === "front" ? "Front" : "Back"} image uploaded successfully!`,
      );
    } catch (err: any) {
      toast.error(`Upload error: ${err.message}`);
    } finally {
      if (side === "front") setUploadingFront(false);
      else setUploadingBack(false);
    }
  };

  const handleStartKyc = async () => {
    if (kycStatus === "verified" || kycStatus === "pending") return;
    if (!user) return;
    if (!form.citizenship_front_url || !form.citizenship_back_url) {
      toast.error(
        "Please upload both front and back images of your citizenship.",
      );
      return;
    }
    setKycStatus("pending");
    const ok = await persist(false, "pending");
    if (!ok) {
      setKycStatus("unverified");
      return;
    }
    toast.success("KYC submitted — we'll review within 24 hours");
  };

  if (authLoading || hydrating) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-40 w-[32rem] h-[32rem] rounded-full bg-gradient-sunset opacity-30 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[36rem] h-[36rem] rounded-full bg-gradient-plum opacity-20 blur-3xl animate-blob [animation-delay:3s]" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 sm:px-10 py-6">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-gradient-sunset text-primary-foreground shadow-soft">
              <Heart className="w-4 h-4 fill-current" />
            </span>
            <span className="font-serif text-xl font-semibold">
              Eternal<span className="text-primary">Bond</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Save progress
            </button>
            <button
              onClick={async () => {
                await signOut();
                navigate("/signin");
              }}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Save & exit
            </button>
          </div>
        </header>

        <div className="flex-1 px-4 sm:px-8 pb-12">
          <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-6 lg:gap-8 items-start">
            {/* Wizard column */}
            <div>
              {/* Stepper */}
              <div className="mb-8">
                <ol className="flex items-center gap-2 sm:gap-3">
                  {steps.map((s, i) => {
                    const active = i === step;
                    const done = i < step;
                    return (
                      <li
                        key={s.chapter}
                        className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 last:flex-none"
                      >
                        <button
                          type="button"
                          onClick={() => i < step && setStep(i)}
                          disabled={i > step}
                          className={`grid place-items-center shrink-0 w-9 h-9 rounded-full text-xs font-semibold border transition-all duration-500 ${
                            done
                              ? "bg-gradient-sunset text-primary-foreground border-transparent shadow-soft"
                              : active
                                ? "bg-card text-primary border-primary scale-110 shadow-soft animate-pop-in"
                                : "bg-card text-muted-foreground border-border"
                          }`}
                          aria-label={`Step ${i + 1}: ${s.chapter}`}
                        >
                          {done ? (
                            <Check className="w-4 h-4" strokeWidth={3} />
                          ) : (
                            i + 1
                          )}
                        </button>
                        <div className="hidden md:flex flex-col min-w-0">
                          <span
                            className={`text-[10px] uppercase tracking-[0.15em] transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
                          >
                            Chapter {i + 1}
                          </span>
                          <span
                            className={`text-xs font-medium truncate transition-colors ${active || done ? "text-foreground" : "text-muted-foreground"}`}
                          >
                            {s.chapter}
                          </span>
                        </div>
                        {i < steps.length - 1 && (
                          <div className="flex-1 h-0.5 rounded-full bg-secondary/60 overflow-hidden min-w-4">
                            <div
                              className="h-full bg-gradient-sunset transition-all duration-700 ease-out"
                              style={{ width: i < step ? "100%" : "0%" }}
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
                <div className="mt-4 h-1 rounded-full bg-secondary/60 overflow-hidden">
                  <div
                    className="h-full bg-gradient-sunset transition-all duration-700 ease-out relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,hsl(0_0%_100%/0.5),transparent)] bg-[length:200%_100%] animate-shimmer" />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-card/85 backdrop-blur-xl border border-border/60 shadow-soft p-7 sm:p-10 relative overflow-hidden">
                <header
                  key={`h-${step}`}
                  className="mb-7 animate-slide-in-right"
                >
                  <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-primary font-semibold mb-2">
                    <Sparkles className="w-3 h-3" />
                    {steps[step].chapter}
                  </span>
                  <h1 className="font-serif text-3xl sm:text-4xl tracking-tight leading-tight">
                    {steps[step].prompt}
                  </h1>
                  <p className="text-muted-foreground text-sm mt-2 max-w-md">
                    {steps[step].sub}
                  </p>
                </header>

                <div key={`s-${step}`} className="animate-fade-in-up">
                  {step === 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="full_name">Full name</Label>
                        <Input
                          id="full_name"
                          value={form.full_name}
                          onChange={(e) => set("full_name", e.target.value)}
                          placeholder="Aanya Sharma"
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>I am</Label>
                        <Select
                          value={form.gender}
                          onValueChange={(v) => set("gender", v as Gender)}
                        >
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="female">Woman</SelectItem>
                            <SelectItem value="male">Man</SelectItem>
                            <SelectItem value="other">Non-binary</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="dob">Date of birth</Label>
                        <Input
                          id="dob"
                          type="date"
                          value={form.date_of_birth}
                          onChange={(e) => set("date_of_birth", e.target.value)}
                          className="h-11 rounded-xl"
                          max={new Date().toISOString().slice(0, 10)}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="location">Where you call home</Label>
                        <Input
                          id="location"
                          value={form.location}
                          onChange={(e) => set("location", e.target.value)}
                          placeholder="Bengaluru, India"
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="profession">Profession</Label>
                        <Input
                          id="profession"
                          value={form.profession}
                          onChange={(e) => set("profession", e.target.value)}
                          placeholder="Product Designer"
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="height">Height (feet & inches)</Label>
                        <Input
                          id="height"
                          value={form.height}
                          onChange={(e) => set("height", e.target.value)}
                          placeholder={`5'8`}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Marital status</Label>
                        <Select
                          value={form.marital_status}
                          onValueChange={(v) =>
                            set("marital_status", v as Marital)
                          }
                        >
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="never_married">
                              Never married
                            </SelectItem>
                            <SelectItem value="divorced">Divorced</SelectItem>
                            <SelectItem value="widowed">Widowed</SelectItem>
                            <SelectItem value="separated">Separated</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="religion">Religion (optional)</Label>
                        <Popover
                          open={openReligion}
                          onOpenChange={setOpenReligion}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between h-11 rounded-xl"
                            >
                              {form.religion || "Select religion"}
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent className="p-0">
                            <Command>
                              <CommandInput placeholder="Search religion..." />
                              <CommandList>
                                <CommandEmpty>No result found</CommandEmpty>
                                <CommandGroup>
                                  {RELIGIONS.map((r) => (
                                    <CommandItem
                                      key={r}
                                      onSelect={() => {
                                        set("religion", r);
                                        setOpenReligion(false);
                                      }}
                                    >
                                      {r}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="mt">Mother tongue (optional)</Label>
                        <Popover open={openMT} onOpenChange={setOpenMT}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between h-11 rounded-xl"
                            >
                              {form.mother_tongue || "Select mother tongue"}
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent className="p-0">
                            <Command>
                              <CommandInput placeholder="Search language..." />
                              <CommandList>
                                <CommandEmpty>No result found</CommandEmpty>
                                <CommandGroup>
                                  {MOTHER_TONGUES.map((m) => (
                                    <CommandItem
                                      key={m}
                                      onSelect={() => {
                                        set("mother_tongue", m);
                                        setOpenMT(false);
                                      }}
                                    >
                                      {m}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label>I'm seeking a</Label>
                        <Select
                          value={form.looking_for}
                          onValueChange={(v) =>
                            set("looking_for", v as LookingFor)
                          }
                        >
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="female">Woman</SelectItem>
                            <SelectItem value="male">Man</SelectItem>
                            <SelectItem value="other">Non-binary</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="bio">Your story</Label>
                        <Textarea
                          id="bio"
                          value={form.bio}
                          onChange={(e) => set("bio", e.target.value)}
                          placeholder="Share what makes your heart beat — your passions, your dreams, the rhythm of your days..."
                          className="min-h-36 rounded-xl resize-none"
                          maxLength={800}
                        />
                        <div className="flex justify-end">
                          <span className="text-xs text-muted-foreground">
                            {form.bio.length}/800
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && user && (
                    <div className="space-y-7">
                      {/* Photos */}
                      <section>
                        <div className="flex items-baseline justify-between mb-3">
                          <Label className="text-base">Photos</Label>
                          <span className="text-xs text-muted-foreground">
                            3–5 recommended
                          </span>
                        </div>
                        <PhotoUploader
                          userId={user.id}
                          photos={form.photos}
                          onChange={(p) => set("photos", p)}
                        />
                      </section>

                      {/* Photo privacy & visibility */}
                      {form.photos.length > 0 && (
                        <section className="space-y-3">
                          <div className="flex items-baseline justify-between">
                            <Label className="text-base">Photo privacy</Label>
                            <span className="text-xs text-muted-foreground">
                              You're in control
                            </span>
                          </div>
                          <PhotoPrivacy
                            photos={form.photos}
                            value={photoVisibility}
                            onChange={setPhotoVisibility}
                          />
                        </section>
                      )}

                      {/* Education & Income */}
                      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Highest education</Label>
                          <Select
                            value={form.highest_education}
                            onValueChange={(v) =>
                              set("highest_education", v as Education)
                            }
                          >
                            <SelectTrigger className="h-11 rounded-xl">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high_school">
                                High school
                              </SelectItem>
                              <SelectItem value="diploma">Diploma</SelectItem>
                              <SelectItem value="bachelors">
                                Bachelor's
                              </SelectItem>
                              <SelectItem value="masters">Master's</SelectItem>
                              <SelectItem value="doctorate">
                                Doctorate
                              </SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Annual income range</Label>
                          <Select
                            value={form.income_range}
                            onValueChange={(v) =>
                              set("income_range", v as Income)
                            }
                          >
                            <SelectTrigger className="h-11 rounded-xl">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="under_5l">
                                Under ₹5L
                              </SelectItem>
                              <SelectItem value="5l_10l">₹5L – ₹10L</SelectItem>
                              <SelectItem value="10l_20l">
                                ₹10L – ₹20L
                              </SelectItem>
                              <SelectItem value="20l_50l">
                                ₹20L – ₹50L
                              </SelectItem>
                              <SelectItem value="50l_1cr">
                                ₹50L – ₹1Cr
                              </SelectItem>
                              <SelectItem value="above_1cr">
                                Above ₹1Cr
                              </SelectItem>
                              <SelectItem value="prefer_not_to_say">
                                Prefer not to say
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </section>

                      {/* Family */}
                      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="father">Father's occupation</Label>
                          <Input
                            id="father"
                            value={form.father_occupation}
                            onChange={(e) =>
                              set("father_occupation", e.target.value)
                            }
                            placeholder="Engineer, Retired..."
                            className="h-11 rounded-xl"
                            maxLength={120}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="mother">Mother's occupation</Label>
                          <Input
                            id="mother"
                            value={form.mother_occupation}
                            onChange={(e) =>
                              set("mother_occupation", e.target.value)
                            }
                            placeholder="Teacher, Homemaker..."
                            className="h-11 rounded-xl"
                            maxLength={120}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="siblings">Siblings</Label>
                          <Input
                            id="siblings"
                            value={form.siblings}
                            onChange={(e) => set("siblings", e.target.value)}
                            placeholder="1 elder sister, married"
                            className="h-11 rounded-xl"
                            maxLength={200}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Family type</Label>
                          <Select
                            value={form.family_type}
                            onValueChange={(v) =>
                              set("family_type", v as FamilyType)
                            }
                          >
                            <SelectTrigger className="h-11 rounded-xl">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nuclear">Nuclear</SelectItem>
                              <SelectItem value="joint">Joint</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </section>

                      {/* Socials */}
                      <section className="space-y-3">
                        <Label className="text-base">
                          Social links (optional)
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Input
                            value={form.social_instagram}
                            onChange={(e) =>
                              set("social_instagram", e.target.value)
                            }
                            placeholder="instagram.com/you"
                            className="h-11 rounded-xl"
                            maxLength={200}
                          />
                          <Input
                            value={form.social_linkedin}
                            onChange={(e) =>
                              set("social_linkedin", e.target.value)
                            }
                            placeholder="linkedin.com/in/you"
                            className="h-11 rounded-xl"
                            maxLength={200}
                          />
                          <Input
                            value={form.social_website}
                            onChange={(e) =>
                              set("social_website", e.target.value)
                            }
                            placeholder="yourwebsite.com"
                            className="h-11 rounded-xl"
                            maxLength={200}
                          />
                        </div>
                      </section>

                      {/* Kundali */}
                      <section className="space-y-1.5">
                        <Label htmlFor="kundali">
                          Kundali / horoscope name
                        </Label>
                        <Input
                          id="kundali"
                          value={form.kundali_name}
                          onChange={(e) => set("kundali_name", e.target.value)}
                          placeholder="Birth star, rashi, or chart name"
                          className="h-11 rounded-xl"
                          maxLength={200}
                        />
                        <p className="text-xs text-muted-foreground">
                          You can upload your kundali document later from
                          settings.
                        </p>
                      </section>

                      {/* KYC */}
                      <section className="rounded-2xl border border-border/60 bg-secondary/40 p-5 flex items-start gap-4">
                        <div className="grid place-items-center w-10 h-10 rounded-full bg-gradient-sunset text-primary-foreground shrink-0 shadow-soft">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-serif text-lg">
                              KYC verification
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                kycStatus === "verified"
                                  ? "bg-primary text-primary-foreground"
                                  : kycStatus === "pending"
                                    ? "bg-accent text-accent-foreground"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {kycStatus.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Verified profiles get a trust badge and 3× more
                            matches.
                          </p>
                          <p className="text-xs text-muted-foreground/85 mt-1.5 italic">
                            Note: If verified, your profile will receive a
                            verified tick badge.
                          </p>

                          {/* Citizenship Front & Back upload fields */}
                          {(kycStatus === "unverified" ||
                            kycStatus === "rejected") && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 mb-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  Citizenship Front
                                </Label>
                                {form.citizenship_front_url ? (
                                  <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-secondary/20 group">
                                    <img
                                      src={form.citizenship_front_url}
                                      alt="Citizenship Front"
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        set("citizenship_front_url", "")
                                      }
                                      className="absolute top-1.5 right-1.5 grid place-items-center w-6 h-6 rounded-full bg-background/90 text-foreground shadow-soft hover:bg-destructive hover:text-destructive-foreground transition-all"
                                      title="Remove front image"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <label className="flex flex-col items-center justify-center aspect-video rounded-xl border border-dashed border-border/80 hover:border-primary/50 bg-secondary/20 hover:bg-secondary/30 transition-all cursor-pointer">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file)
                                          handleDocumentUpload(file, "front");
                                      }}
                                      disabled={uploadingFront}
                                    />
                                    {uploadingFront ? (
                                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    ) : (
                                      <ImagePlus className="w-5 h-5 text-muted-foreground mb-1" />
                                    )}
                                    <span className="text-[11px] font-medium text-muted-foreground mt-1">
                                      {uploadingFront
                                        ? "Uploading..."
                                        : "Upload Front Image"}
                                    </span>
                                  </label>
                                )}
                              </div>

                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  Citizenship Back
                                </Label>
                                {form.citizenship_back_url ? (
                                  <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-secondary/20 group">
                                    <img
                                      src={form.citizenship_back_url}
                                      alt="Citizenship Back"
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        set("citizenship_back_url", "")
                                      }
                                      className="absolute top-1.5 right-1.5 grid place-items-center w-6 h-6 rounded-full bg-background/90 text-foreground shadow-soft hover:bg-destructive hover:text-destructive-foreground transition-all"
                                      title="Remove back image"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <label className="flex flex-col items-center justify-center aspect-video rounded-xl border border-dashed border-border/80 hover:border-primary/50 bg-secondary/20 hover:bg-secondary/30 transition-all cursor-pointer">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file)
                                          handleDocumentUpload(file, "back");
                                      }}
                                      disabled={uploadingBack}
                                    />
                                    {uploadingBack ? (
                                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    ) : (
                                      <ImagePlus className="w-5 h-5 text-muted-foreground mb-1" />
                                    )}
                                    <span className="text-[11px] font-medium text-muted-foreground mt-1">
                                      {uploadingBack
                                        ? "Uploading..."
                                        : "Upload Back Image"}
                                    </span>
                                  </label>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Previews in pending / verified states */}
                          {(kycStatus === "pending" ||
                            kycStatus === "verified") &&
                            (form.citizenship_front_url ||
                              form.citizenship_back_url) && (
                              <div className="grid grid-cols-2 gap-4 mt-4 mb-3 opacity-90">
                                {form.citizenship_front_url && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold font-sans">
                                      Front Document
                                    </span>
                                    <div className="aspect-video rounded-xl overflow-hidden border border-border bg-secondary/20">
                                      <img
                                        src={form.citizenship_front_url}
                                        alt="Front Document"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  </div>
                                )}
                                {form.citizenship_back_url && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold font-sans">
                                      Back Document
                                    </span>
                                    <div className="aspect-video rounded-xl overflow-hidden border border-border bg-secondary/20">
                                      <img
                                        src={form.citizenship_back_url}
                                        alt="Back Document"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-3 rounded-full"
                            onClick={handleStartKyc}
                            disabled={
                              kycStatus === "verified" ||
                              kycStatus === "pending"
                            }
                          >
                            <Star className="w-3.5 h-3.5" />
                            {kycStatus === "verified"
                              ? "Verified"
                              : kycStatus === "pending"
                                ? "Under review"
                                : "Start verification"}
                          </Button>
                        </div>
                      </section>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-border/60">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep((s) => Math.max(s - 1, 0))}
                    disabled={step === 0 || saving}
                    className="rounded-full transition-all hover:-translate-x-0.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>

                  {(() => {
                    const isLast = step === steps.length - 1;
                    const onClick = isLast ? handleSubmit : handleNext;
                    return (
                      <Button
                        type="button"
                        onClick={onClick}
                        disabled={saving}
                        className={`group relative h-12 rounded-full bg-gradient-sunset text-primary-foreground hover:shadow-glow shadow-soft font-semibold overflow-hidden transition-all duration-500 ease-out ${
                          isLast ? "px-8" : "px-7"
                        } ${saving ? "w-12 px-0" : ""}`}
                      >
                        <span
                          className={`flex items-center gap-2 transition-all duration-300 ${
                            saving ? "opacity-0 scale-75" : "opacity-100"
                          }`}
                        >
                          {isLast ? (
                            <>
                              <Check className="w-4 h-4" />
                              Begin my story
                            </>
                          ) : (
                            <>
                              {step === 0
                                ? "Nice to meet you"
                                : step === 1
                                  ? "Keep going"
                                  : "Almost there"}
                              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                            </>
                          )}
                        </span>
                        {saving && (
                          <Loader2 className="w-5 h-5 animate-spin absolute inset-0 m-auto" />
                        )}
                        <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,hsl(0_0%_100%/0.35)_50%,transparent_70%)] bg-[length:200%_100%] opacity-0 group-hover:opacity-100 group-hover:animate-shimmer pointer-events-none" />
                      </Button>
                    );
                  })()}
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-5">
                Your information stays private and is only used for matchmaking.
              </p>
            </div>

            {/* Checklist sidebar */}
            <ProfileChecklist
              items={checklist}
              className="lg:sticky lg:top-6"
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Onboarding;
