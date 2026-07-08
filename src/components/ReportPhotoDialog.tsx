import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ReportPhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoUrl: string;
  reportedUserId: string;
  onSuccess?: () => void;
}

const REPORT_REASONS = [
  { value: "inappropriate_content", label: "Inappropriate Content / Nudity" },
  { value: "harassment", label: "Harassment or Bullying" },
  { value: "spam", label: "Spam or Commercial Activity" },
  { value: "fake_profile", label: "Fake Profile / Impersonation" },
  { value: "underage", label: "Underage User" },
  { value: "other", label: "Other" },
];

export default function ReportPhotoDialog({
  open,
  onOpenChange,
  photoUrl,
  reportedUserId,
  onSuccess,
}: ReportPhotoDialogProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to report photos.");
      return;
    }

    if (!reason) {
      toast.error("Please select a reason for reporting.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Prevent duplicate reports from the same user for the same photo.
      const { data: existingReport, error: checkError } = await supabase
        .from("user_reports")
        .select("id")
        .eq("reporter_id", user.id)
        .eq("reported_user_id", reportedUserId)
        .contains("evidence_urls", [photoUrl])
        .maybeSingle();

      if (checkError) {
        throw new Error(`Failed to check existing reports: ${checkError.message}`);
      }

      if (existingReport) {
        toast.info("You have already reported this photo.");
        onOpenChange(false);
        return;
      }

      // 2. Save the report to user_reports.
      const { error: insertReportError } = await supabase
        .from("user_reports")
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          reason,
          details: details.trim() || null,
          evidence_urls: [photoUrl],
          priority: "medium",
          status: "open",
        });

      if (insertReportError) {
        throw insertReportError;
      }

      // 3. Save / update the photo to photo_moderation.
      const { data: existingMod, error: modCheckError } = await supabase
        .from("photo_moderation")
        .select("id, flag")
        .eq("photo_url", photoUrl)
        .eq("decision", "pending")
        .maybeSingle();

      if (!modCheckError) {
        if (!existingMod) {
          await supabase.from("photo_moderation").insert({
            user_id: reportedUserId,
            photo_url: photoUrl,
            flag: reason,
            decision: "pending",
          });
        } else {
          // If already in queue, append the reason to flag if not already there
          const currentFlag = existingMod.flag || "";
          if (!currentFlag.includes(reason)) {
            const newFlag = currentFlag ? `${currentFlag}, ${reason}` : reason;
            await supabase
              .from("photo_moderation")
              .update({ flag: newFlag })
              .eq("id", existingMod.id);
          }
        }
      }

      toast.success("Photo has been reported successfully.");
      setReason("");
      setDetails("");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Error reporting photo:", err);
      toast.error(err.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Photo</DialogTitle>
          <DialogDescription>
            Help us keep EternalBond safe. Please select a reason for reporting this photo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for reporting</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Additional details (optional)</label>
            <Textarea
              placeholder="Provide more context..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
