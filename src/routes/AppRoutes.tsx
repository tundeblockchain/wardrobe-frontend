import { Route, Routes } from "react-router-dom";
import { HomePage } from "../pages/HomePage";
import { PrivacyPolicyPage } from "../pages/PrivacyPolicyPage";
import { TermsOfServicePage } from "../pages/TermsOfServicePage";
import { appPaths } from "./paths";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path={appPaths.home} element={<HomePage />} />
      <Route path={appPaths.terms} element={<TermsOfServicePage />} />
      <Route path={appPaths.privacy} element={<PrivacyPolicyPage />} />
    </Routes>
  );
};
