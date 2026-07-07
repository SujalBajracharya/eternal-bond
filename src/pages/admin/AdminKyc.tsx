import { useEffect, useState } from "react";
import {
  Loader2,
  ShieldCheck,
  ShieldX,
  ExternalLink,
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileSignature,
  Briefcase,
  GraduationCap,
  Sparkles,
  Info,
  DollarSign,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAdminAction } from "@/lib/admin-audit";

type Row = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  location: string | null;
  bio: string | null;
  profession: string | null;
  highest_education: string | null;
  income_range: string | null;
  religion: string | null;
  citizenship_front_url: string | null;
  citizenship_back_url: string | null;
  kundali_name: string | null;
  kundali_url: string | null;
  kyc_status: string;
  created_at: string;
};

const AdminKyc = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "pending" | "verified" | "rejected" | "unverified"
  >("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>(
    {},
  );

  // Rejection state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Filter counts
  const [counts, setCounts] = useState({
    pending: 0,
    verified: 0,
    rejected: 0,
    unverified: 0,
  });

  const loadCounts = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("kyc_status");

      if (!error && data) {
        const countsMap = {
          pending: 0,
          verified: 0,
          rejected: 0,
          unverified: 0,
        };
        data.forEach((item) => {
          const status = item.kyc_status as keyof typeof countsMap;
          if (countsMap[status] !== undefined) {
            countsMap[status]++;
          }
        });
        setCounts(countsMap);
      }
    } catch (err) {
      console.error("Failed to load KYC filter counts:", err);
    }
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, phone, gender, date_of_birth, location, bio, profession, highest_education, income_range, religion, citizenship_front_url, citizenship_back_url, kundali_name, kundali_url, kyc_status, created_at",
      )
      .eq("kyc_status", filter as never)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setRows([]);
    } else {
      const typedData = (data as Row[]) ?? [];
      setRows(typedData);

      // If viewing rejected users, fetch the latest rejection reason from audit logs
      if (filter === "rejected" && typedData.length > 0) {
        const ids = typedData.map((r) => r.id);
        const { data: logs } = await supabase
          .from("admin_audit_logs")
          .select("target_id, metadata")
          .eq("action", "kyc_rejected")
          .in("target_id", ids)
          .order("created_at", { ascending: false });

        if (logs) {
          const reasons: Record<string, string> = {};
          logs.forEach((l) => {
            if (
              l.target_id &&
              !reasons[l.target_id] &&
              l.metadata &&
              typeof l.metadata === "object"
            ) {
              reasons[l.target_id] =
                (l.metadata as any).reason || "No reason specified";
            }
          });
          setRejectReasons(reasons);
        }
      }
    }
    await loadCounts();
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const decide = async (
    id: string,
    status: "verified" | "rejected",
    reason?: string,
  ) => {
    const { error } = await supabase
      .from("profiles")
      .update({ kyc_status: status as never })
      .eq("id", id);

    if (error) return toast.error(error.message);

    if (status === "verified") {
      await logAdminAction("kyc_verified", "profile", id);
    } else {
      await logAdminAction("kyc_rejected", "profile", id, { reason });
    }

    toast.success(
      `KYC request ${status === "verified" ? "approved" : "rejected"} successfully.`,
    );
    setRejectingId(null);
    setRejectReason("");
    load();
  };

  const filteredRows = rows.filter((r) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      (r.full_name?.toLowerCase().includes(term) ?? false) ||
      (r.email?.toLowerCase().includes(term) ?? false) ||
      (r.location?.toLowerCase().includes(term) ?? false)
    );
  });

  return (
    <AdminLayout title="KYC Review">
      {/* Search and Filters Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        {/* Tabs with counters */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-muted/60 rounded-2xl border border-border/40 w-fit">
          {(["pending", "verified", "rejected", "unverified"] as const).map(
            (f) => {
              const count = counts[f];
              const isActive = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 uppercase tracking-wide ${
                    isActive
                      ? "bg-card text-primary shadow-sm border border-border/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{f}</span>
                  <span
                    className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-background text-muted-foreground border border-border/50"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            },
          )}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10 rounded-xl"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main requests grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Fetching KYC submissions...
          </p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="p-16 text-center border border-dashed rounded-3xl bg-card/50">
          <div className="mx-auto w-12 h-12 rounded-full bg-secondary/80 flex items-center justify-center text-primary mb-3">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-semibold mb-1">
            No requests found
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? `No requests match "${searchQuery}" under ${filter}.`
              : `There are currently no verification requests marked as ${filter}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRows.map((r) => (
            <Card
              key={r.id}
              className="overflow-hidden border border-border/50 shadow-soft hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6 lg:p-8 space-y-6">
                {/* Top Section / User Identity Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-gradient-warm flex items-center justify-center text-sm font-bold text-primary border border-primary/10">
                      {r.full_name?.slice(0, 2).toUpperCase() || "EB"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground">
                          {r.full_name || "Unnamed User"}
                        </h3>
                        <Badge
                          variant={
                            r.kyc_status === "verified"
                              ? "default"
                              : r.kyc_status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                          className="capitalize text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full"
                        >
                          {r.kyc_status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Joined: {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Quick Action buttons for pending state */}
                  {filter === "pending" && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm rounded-xl px-4"
                        onClick={() => decide(r.id, "verified")}
                      >
                        <ShieldCheck className="w-4 h-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-1.5 rounded-xl px-4"
                        onClick={() => setRejectingId(r.id)}
                      >
                        <ShieldX className="w-4 h-4" /> Reject
                      </Button>
                    </div>
                  )}
                </div>

                {/* Grid Layout: User details vs Submitted documents */}
                <div className="grid gap-6 lg:grid-cols-5">
                  {/* Left Column: User details (3 cols) */}
                  <div className="lg:col-span-3 space-y-5">
                    {/* Bio */}
                    {r.bio && (
                      <div className="space-y-1.5 bg-muted/30 p-3.5 rounded-2xl border border-border/30">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />{" "}
                          About User
                        </span>
                        <p className="text-xs text-foreground/80 leading-relaxed italic">
                          "{r.bio}"
                        </p>
                      </div>
                    )}

                    {/* Contact & Personal info */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-3.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Personal Info
                        </h4>
                        <ul className="space-y-2.5 text-xs">
                          <li className="flex items-center gap-2.5">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-foreground">
                              {r.email || "No email"}
                            </span>
                          </li>
                          <li className="flex items-center gap-2.5">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-foreground">
                              {r.phone || "No phone"}
                            </span>
                          </li>
                          <li className="flex items-center gap-2.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-foreground capitalize">
                              {r.gender || "Unspecified gender"}
                            </span>
                          </li>
                        </ul>
                      </div>

                      <div className="space-y-3.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Background Details
                        </h4>
                        <ul className="space-y-2.5 text-xs">
                          <li className="flex items-center gap-2.5">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-foreground">
                              {r.date_of_birth
                                ? `${new Date(r.date_of_birth).toLocaleDateString()} (${
                                    new Date().getFullYear() -
                                    new Date(r.date_of_birth).getFullYear()
                                  } years)`
                                : "No date of birth"}
                            </span>
                          </li>
                          <li className="flex items-center gap-2.5">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-foreground">
                              {r.location || "No location set"}
                            </span>
                          </li>
                          <li className="flex items-center gap-2.5">
                            <Sparkles className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-foreground">
                              {r.religion || "Religion unspecified"}
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Professional & Matchmaking details */}
                    <div className="space-y-3.5 pt-1 border-t border-border/30">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Professional Profile
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="flex items-center gap-2 p-2.5 bg-muted/40 rounded-xl border border-border/20 text-xs">
                          <Briefcase className="w-4 h-4 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground">
                              Profession
                            </p>
                            <p className="font-semibold text-foreground truncate">
                              {r.profession || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2.5 bg-muted/40 rounded-xl border border-border/20 text-xs">
                          <GraduationCap className="w-4 h-4 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground">
                              Education
                            </p>
                            <p className="font-semibold text-foreground truncate capitalize">
                              {r.highest_education?.replace("_", " ") || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2.5 bg-muted/40 rounded-xl border border-border/20 text-xs">
                          <DollarSign className="w-4 h-4 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground">
                              Annual Income
                            </p>
                            <p className="font-semibold text-foreground truncate uppercase">
                              {r.income_range?.replace("_", " ") || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Display Rejection Reason if viewing rejected tab */}
                    {filter === "rejected" && rejectReasons[r.id] && (
                      <div className="p-3.5 bg-destructive/5 rounded-2xl border border-destructive/20 text-xs">
                        <span className="font-bold text-destructive flex items-center gap-1.5 mb-1">
                          <ShieldX className="w-3.5 h-3.5" /> Rejection Comment:
                        </span>
                        <p className="text-foreground/90 font-medium italic">
                          "{rejectReasons[r.id]}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Submitted documents (2 cols) */}
                  <div className="lg:col-span-2 space-y-5 lg:pl-6 lg:border-l border-border/30">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Verification Materials
                    </h4>

                    {/* Citizenship Cards (Side-by-side or stacked) */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Citizenship Front */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                          Citizenship Front
                        </span>
                        {r.citizenship_front_url ? (
                          <div className="relative group overflow-hidden rounded-xl border border-border/80 bg-muted aspect-[3/2] shadow-sm">
                            <img
                              src={r.citizenship_front_url}
                              alt="Citizenship Front"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <a
                              href={r.citizenship_front_url}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-medium transition-opacity duration-200 gap-1"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>View Image</span>
                            </a>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-xl bg-muted/40 text-muted-foreground text-xs aspect-[3/2]">
                            <span>No Front Image</span>
                          </div>
                        )}
                      </div>

                      {/* Citizenship Back */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                          Citizenship Back
                        </span>
                        {r.citizenship_back_url ? (
                          <div className="relative group overflow-hidden rounded-xl border border-border/80 bg-muted aspect-[3/2] shadow-sm">
                            <img
                              src={r.citizenship_back_url}
                              alt="Citizenship Back"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <a
                              href={r.citizenship_back_url}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-medium transition-opacity duration-200 gap-1"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>View Image</span>
                            </a>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-xl bg-muted/40 text-muted-foreground text-xs aspect-[3/2]">
                            <span>No Back Image</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Kundali Document */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Kundali / Astro Document
                      </span>
                      {r.kundali_url ? (
                        <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card shadow-sm">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                              <FileSignature className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">
                                {r.kundali_name || "Kundali Astro Doc"}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                PDF / Image Document
                              </p>
                            </div>
                          </div>
                          <a
                            href={r.kundali_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center p-1.5 text-muted-foreground hover:text-primary transition-colors border border-border/60 rounded-lg hover:bg-secondary/40"
                            title="View Document"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <div className="p-3 border border-dashed rounded-xl bg-muted/30 text-center text-xs text-muted-foreground">
                          No Kundali document submitted.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rejection Dialog Modal */}
      <Dialog
        open={rejectingId !== null}
        onOpenChange={(open) => !open && setRejectingId(null)}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Reject Verification Request
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide a clear, detailed reason for rejecting this user's
              verification. This comment will be stored in the admin audit
              history logs.
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Rejection Reason / Comment
            </label>
            <Textarea
              placeholder="e.g. Citizenship images are blurry; please re-upload clear photos with readable numbers."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-24 text-xs rounded-xl"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setRejectingId(null);
                setRejectReason("");
              }}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="rounded-xl text-xs"
              onClick={() => {
                if (!rejectReason.trim()) {
                  toast.error("Please enter a rejection reason.");
                  return;
                }
                if (rejectingId) {
                  decide(rejectingId, "rejected", rejectReason);
                }
              }}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminKyc;
