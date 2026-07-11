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
import { Loader2, MessageSquareWarning } from "lucide-react";

interface ReportMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The text or attachment URL of the message being reported */
  messageContent: string;
  /** The database ID of the message being reported */
  messageId: string;
  /** The user ID of the message sender being reported */
  reportedUserId: string;
  onSuccess?: () => void;
}

const REPORT_REASONS = [
  { value: "harassment", label: "Harassment or Bullying" },
  { value: "inappropriate_content", label: "Inappropriate or Offensive Content" },
  { value: "threats", label: "Threats or Violence" },
  { value: "spam", label: "Spam or Scam" },
  { value: "sexual_content", label: "Unwanted Sexual Content" },
  { value: "hate_speech", label: "Hate Speech or Discrimination" },
  { value: "impersonation", label: "Impersonation" },
  { value: "other", label: "Other" },
];

export default function ReportMessageDialog({
  open,
  onOpenChange,
  messageContent,
  messageId,
  reportedUserId,
  onSuccess,
}: ReportMessageDialogProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to report messages.");
      return;
    }

    if (!reason) {
      toast.error("Please select a reason for reporting.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Prevent duplicate reports from the same user for the same message.
      const { data: existingReport, error: checkError } = await supabase
        .from("user_reports")
        .select("id")
        .eq("reporter_id", user.id)
        .eq("reported_user_id", reportedUserId)
        .contains("evidence_urls", [`msg:${messageId}`])
        .maybeSingle();

      if (checkError) {
        throw new Error(`Failed to check existing reports: ${checkError.message}`);
      }

      if (existingReport) {
        toast.info("You have already reported this message.");
        onOpenChange(false);
        return;
      }

      // 2. Save the report to user_reports.
      // We use a "msg:" prefix in evidence_urls to distinguish message reports
      // from photo reports, and store the full message content in details.
      const fullDetails = [
        `[Reported Message]: "${messageContent}"`,
        details.trim() ? `[Additional Context]: ${details.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n\n");

      const { error: insertReportError } = await supabase
        .from("user_reports")
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          reason,
          details: fullDetails,
          evidence_urls: [`msg:${messageId}`],
          priority: "medium",
          status: "open",
        });

      if (insertReportError) {
        throw insertReportError;
      }

      toast.success("Message has been reported successfully.");
      setReason("");
      setDetails("");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Error reporting message:", err);
      toast.error(err.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Truncate long messages for the preview
  const preview =
    messageContent.length > 120
      ? messageContent.slice(0, 120) + "…"
      : messageContent;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareWarning className="h-5 w-5 text-destructive" />
            Report Message
          </DialogTitle>
          <DialogDescription>
            Help us keep EternalBond safe. Please select a reason for reporting
            this message.
          </DialogDescription>
        </DialogHeader>

        {/* Message preview */}
        <div className="rounded-xl bg-muted/60 border border-border/50 px-3.5 py-2.5 text-sm text-foreground/80 italic leading-relaxed">
          "{preview}"
        </div>

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
            <label className="text-sm font-medium">
              Additional details (optional)
            </label>
            <Textarea
              placeholder="Provide more context about why this message is inappropriate…"
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
