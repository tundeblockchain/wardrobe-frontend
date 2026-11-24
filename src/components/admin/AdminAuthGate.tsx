import type { PropsWithChildren } from "react";
import { useAdminAuth } from "../../admin/useAdminAuth";
import { supportCopy } from "../../admin/supportCopy";
import { RouteFallback } from "../../routes/RouteFallback";
import { AdminNotAuthorisedState } from "./AdminNotAuthorisedState";
import { AdminNotConfiguredState } from "./AdminNotConfiguredState";
import { AdminSignInScreen } from "./AdminSignInScreen";

export const AdminAuthGate = ({ children }: PropsWithChildren) => {
  const { gate } = useAdminAuth();

  if (gate === "unconfigured") {
    return <AdminNotConfiguredState />;
  }

  if (gate === "loading") {
    return <RouteFallback label={supportCopy.checkingAccess} />;
  }

  if (gate === "signed_out") {
    return <AdminSignInScreen />;
  }

  if (gate === "not_authorised") {
    return <AdminNotAuthorisedState />;
  }

  return children;
};
