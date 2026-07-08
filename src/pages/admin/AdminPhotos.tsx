import { useEffect, useState } from "react";
import { Loader2, Check, X, EyeOff, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAdminAction } from "@/lib/admin-audit";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Row = {
  id: string;
  user_id: string;
  photo_url: string;
  flag: string | null;
  decision: "pending" | "approved" | "rejected" | "blurred";
  created_at: string;
};

const AdminPhotos = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<
    "pending" | "approved" | "rejected" | "blurred"
  >("pending");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("photo_moderation")
      .select("id, user_id, photo_url, flag, decision, created_at")
      .eq("decision", tab as never)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [tab]);

  const decide = async (id: string, decision: Row["decision"]) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;

    const { user_id, photo_url } = row;

    try {
      // 1. Update the moderation status in photo_moderation
      const { error } = await supabase
        .from("photo_moderation")
        .update({
          decision: decision as never,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;

      // 2. Sync changes with the active profile photos/mappings
      if (decision === "approved") {
        await supabase
          .from("profile_photos_mapping")
          .update({ visibility: "visible" })
          .eq("profile_id", user_id)
          .eq("photo_url", photo_url);
      } else if (decision === "blurred") {
        await supabase
          .from("profile_photos_mapping")
          .update({ visibility: "blurred" })
          .eq("profile_id", user_id)
          .eq("photo_url", photo_url);
      } else if (decision === "rejected") {
        // Delete from mapping
        await supabase
          .from("profile_photos_mapping")
          .delete()
          .eq("profile_id", user_id)
          .eq("photo_url", photo_url);

        // If it's the profile's main avatar, clear it
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user_id)
          .maybeSingle();

        if (profile && profile.avatar_url === photo_url) {
          await supabase
            .from("profiles")
            .update({ avatar_url: null })
            .eq("id", user_id);
        }
      }

      await logAdminAction(`photo_${decision}`, "photo_moderation", id);
      toast.success(`Photo ${decision}`);
      load();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to complete operation");
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase
      .from("photo_moderation")
      .delete()
      .eq("id", id);
    if (error) return toast.error(error.message);
    await logAdminAction("photo_removed", "photo_moderation", id);
    load();
  };

  return (
    <AdminLayout title="Photo Moderation">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as typeof tab)}
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="blurred">Blurred</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="p-12 grid place-items-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          No {tab} photos.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-3 space-y-3">
                <div className="aspect-square rounded-md overflow-hidden bg-muted">
                  <img
                    src={r.photo_url}
                    alt="Uploaded"
                    className={`w-full h-full object-cover ${r.decision === "blurred" ? "blur-md" : ""}`}
                  />
                </div>
                <div className="flex items-center justify-between">
                  {r.flag ? (
                    <Badge variant="destructive">{r.flag}</Badge>
                  ) : (
                    <Badge variant="outline">no flag</Badge>
                  )}
                  <Badge variant="secondary">{r.decision}</Badge>
                </div>
                <div className="flex gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => decide(r.id, "approved")}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Approve Photo</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => decide(r.id, "rejected")}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Reject Photo</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => decide(r.id, "blurred")}
                        >
                          <EyeOff className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Blur Photo</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => remove(r.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Photo</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPhotos;
