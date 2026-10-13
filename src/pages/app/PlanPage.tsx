import { Navigate } from "react-router-dom";
import { appPaths } from "../../routes/paths";

export const PlanPage = () => {
  return <Navigate to={appPaths.appSettings} replace />;
};
