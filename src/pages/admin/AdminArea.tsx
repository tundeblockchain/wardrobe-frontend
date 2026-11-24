import { AdminAuthProvider } from "../../admin/AdminAuthProvider";
import { AdminLayout } from "../../components/admin/AdminLayout";

export const AdminArea = () => {
  return (
    <AdminAuthProvider>
      <AdminLayout />
    </AdminAuthProvider>
  );
};
