import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AppShell } from "../layout/AppShell";
import { ContactPage } from "../pages/ContactPage";
import { HomePage } from "../pages/HomePage";
import { PrivacyPolicyPage } from "../pages/PrivacyPolicyPage";
import { SharePreviewPage } from "../pages/SharePreviewPage";
import { TermsOfServicePage } from "../pages/TermsOfServicePage";
import { appPaths } from "./paths";
import { RouteFallback } from "./RouteFallback";

const LoginPage = lazy(async () => {
  const module = await import("../pages/LoginPage");
  return { default: module.LoginPage };
});

const AppArea = lazy(async () => {
  const module = await import("../pages/app/AppArea");
  return { default: module.AppArea };
});

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path={appPaths.home} element={<HomePage />} />
        <Route path={appPaths.terms} element={<TermsOfServicePage />} />
        <Route path={appPaths.privacy} element={<PrivacyPolicyPage />} />
        <Route path={appPaths.contact} element={<ContactPage />} />
        <Route path={appPaths.share} element={<SharePreviewPage />} />
        <Route
          path={appPaths.login}
          element={
            <Suspense fallback={<RouteFallback />}>
              <LoginPage />
            </Suspense>
          }
        />
      </Route>
      <Route
        path={`${appPaths.app}/*`}
        element={
          <Suspense fallback={<RouteFallback />}>
            <AppArea />
          </Suspense>
        }
      />
    </Routes>
  );
};
