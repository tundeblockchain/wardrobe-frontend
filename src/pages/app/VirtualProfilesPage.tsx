import { Navigate } from "react-router-dom";
import { appPaths } from "../../routes/paths";

export const VirtualProfilesPage = () => {
  return <Navigate to={appPaths.appVirtualTryOn} replace />;
};
