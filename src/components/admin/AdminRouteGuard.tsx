import { Navigate } from "react-router-dom";
import { AdminAuthProvider, useAdminAuth } from "@/hooks/useAdminAuth";

const AdminRouteGuardInner = ({ children }: { children: React.ReactNode }) => {
  const { status } = useAdminAuth();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-body text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (status === "unauthorized") {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

const AdminRouteGuard = ({ children }: { children: React.ReactNode }) => (
  <AdminAuthProvider>
    <AdminRouteGuardInner>{children}</AdminRouteGuardInner>
  </AdminAuthProvider>
);

export default AdminRouteGuard;
