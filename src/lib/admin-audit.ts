import { supabase } from "@/integrations/supabase/client";

/**
 * Logs an administrative action to the audit logs.
 *
 * @param action - The name of the action performed (e.g. "kyc_approve")
 * @param targetType - The type of resource targeted (e.g. "profile")
 * @param targetId - The ID of the target resource (if applicable)
 * @param metadata - Extra information to log
 */
export const logAdminAction = async (
  action: string,
  targetType: string | null,
  targetId: string | null,
  metadata: Record<string, any> = {}
) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("Could not log admin action: No authenticated admin user found.");
      return;
    }

    const { error } = await supabase.from("admin_audit_logs").insert({
      admin_id: user.id,
      action,
      target_type: targetType,
      target_id: targetId,
      metadata,
    });

    if (error) {
      console.error("Error inserting admin audit log:", error);
    }
  } catch (err) {
    console.error("Failed to log admin action:", err);
  }
};
