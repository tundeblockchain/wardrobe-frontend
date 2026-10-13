import { useFirebaseAuthListener } from "../../auth/firebaseSession";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";
import { ProtectedRoute } from "../../routes/ProtectedRoute";

export const AppArea = () => {
  useFirebaseAuthListener();

  return (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  );
};
