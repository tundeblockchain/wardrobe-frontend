import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { getLoginPath } from "./paths";
import { RouteFallback } from "./RouteFallback";

export const ProtectedRoute = ({ children }: PropsWithChildren) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <RouteFallback label="Checking sign-in status" />;
  }

  if (!user) {
    const nextPath = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate to={getLoginPath(nextPath)} state={{ from: location }} replace />
    );
  }

  return children;
};
