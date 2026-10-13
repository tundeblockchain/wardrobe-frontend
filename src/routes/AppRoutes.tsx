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

const AppHomePage = lazy(async () => {
  const module = await import("../pages/app/AppHomePage");
  return { default: module.AppHomePage };
});

const WardrobesPage = lazy(async () => {
  const module = await import("../pages/app/WardrobesPage");
  return { default: module.WardrobesPage };
});

const WardrobeDetailPage = lazy(async () => {
  const module = await import("../pages/app/WardrobeDetailPage");
  return { default: module.WardrobeDetailPage };
});

const ItemDetailPage = lazy(async () => {
  const module = await import("../pages/app/ItemDetailPage");
  return { default: module.ItemDetailPage };
});

const OutfitsPage = lazy(async () => {
  const module = await import("../pages/app/OutfitsPage");
  return { default: module.OutfitsPage };
});

const VirtualProfilesPage = lazy(async () => {
  const module = await import("../pages/app/VirtualProfilesPage");
  return { default: module.VirtualProfilesPage };
});

const PlanPage = lazy(async () => {
  const module = await import("../pages/app/PlanPage");
  return { default: module.PlanPage };
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
        path={appPaths.app}
        element={
          <Suspense fallback={<RouteFallback />}>
            <AppArea />
          </Suspense>
        }
      >
        <Route index element={<AppHomePage />} />
        <Route path="wardrobes" element={<WardrobesPage />} />
        <Route path="wardrobes/:id" element={<WardrobeDetailPage />} />
        <Route path="items/:id" element={<ItemDetailPage />} />
        <Route path="outfits" element={<OutfitsPage />} />
        <Route path="virtual-profiles" element={<VirtualProfilesPage />} />
        <Route path="plan" element={<PlanPage />} />
        <Route path="*" element={<AppHomePage />} />
      </Route>
    </Routes>
  );
};
