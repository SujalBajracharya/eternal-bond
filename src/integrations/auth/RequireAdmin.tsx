import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";

const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/signin" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <div className="max-w-md text-center space-y-3">
          <ShieldAlert className="w-12 h-12 mx-auto text-destructive" />
          <h1 className="text-2xl font-semibold">Admin access required</h1>
          <p className="text-muted-foreground">
            You don't have permission to view this area.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

export default RequireAdmin;
