import { Navigate } from "react-router-dom";
import { getAppSettingsPlanPath } from "../../routes/paths";

export const PlanPage = () => {
  return <Navigate to={getAppSettingsPlanPath()} replace />;
};
