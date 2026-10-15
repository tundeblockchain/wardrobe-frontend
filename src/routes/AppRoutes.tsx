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

const WardrobeFormPage = lazy(async () => {
  const module = await import("../pages/app/WardrobeFormPage");
  return { default: module.WardrobeFormPage };
});

const WardrobeDetailPage = lazy(async () => {
  const module = await import("../pages/app/WardrobeDetailPage");
  return { default: module.WardrobeDetailPage };
});

const RecommendationsPage = lazy(async () => {
  const module = await import("../pages/app/RecommendationsPage");
  return { default: module.RecommendationsPage };
});

const RecommendationDetailPage = lazy(async () => {
  const module = await import("../pages/app/RecommendationDetailPage");
  return { default: module.RecommendationDetailPage };
});

const ItemFormPage = lazy(async () => {
  const module = await import("../pages/app/ItemFormPage");
  return { default: module.ItemFormPage };
});

const ItemDetailPage = lazy(async () => {
  const module = await import("../pages/app/ItemDetailPage");
  return { default: module.ItemDetailPage };
});

const OutfitsPage = lazy(async () => {
  const module = await import("../pages/app/OutfitsPage");
  return { default: module.OutfitsPage };
});

const OutfitFormPage = lazy(async () => {
  const module = await import("../pages/app/OutfitFormPage");
  return { default: module.OutfitFormPage };
});

const VirtualProfilesPage = lazy(async () => {
  const module = await import("../pages/app/VirtualProfilesPage");
  return { default: module.VirtualProfilesPage };
});

const VirtualProfileFormPage = lazy(async () => {
  const module = await import("../pages/app/VirtualProfileFormPage");
  return { default: module.VirtualProfileFormPage };
});

const VirtualTryOnPage = lazy(async () => {
  const module = await import("../pages/app/VirtualTryOnPage");
  return { default: module.VirtualTryOnPage };
});

const SettingsPage = lazy(async () => {
  const module = await import("../pages/app/SettingsPage");
  return { default: module.SettingsPage };
});

const PlanPage = lazy(async () => {
  const module = await import("../pages/app/PlanPage");
  return { default: module.PlanPage };
});

const BillingSuccessPage = lazy(async () => {
  const module = await import("../pages/app/BillingSuccessPage");
  return { default: module.BillingSuccessPage };
});

const BillingCancelPage = lazy(async () => {
  const module = await import("../pages/app/BillingCancelPage");
  return { default: module.BillingCancelPage };
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
        <Route
          path="wardrobes/new"
          element={<WardrobeFormPage mode="create" />}
        />
        <Route
          path="wardrobes/:id/edit"
          element={<WardrobeFormPage mode="edit" />}
        />
        <Route
          path="wardrobes/:id/items/new"
          element={<ItemFormPage mode="create" />}
        />
        <Route
          path="wardrobes/:id/recommendations/detail"
          element={<RecommendationDetailPage />}
        />
        <Route
          path="wardrobes/:id/recommendations"
          element={<RecommendationsPage />}
        />
        <Route path="wardrobes/:id" element={<WardrobeDetailPage />} />
        <Route path="items/:id/edit" element={<ItemFormPage mode="edit" />} />
        <Route path="items/:id" element={<ItemDetailPage />} />
        <Route path="outfits" element={<OutfitsPage />} />
        <Route path="outfits/new" element={<OutfitFormPage mode="create" />} />
        <Route
          path="outfits/:id/edit"
          element={<OutfitFormPage mode="edit" />}
        />
        <Route path="virtual-profiles" element={<VirtualProfilesPage />} />
        <Route
          path="virtual-profiles/new"
          element={<VirtualProfileFormPage mode="create" />}
        />
        <Route
          path="virtual-profiles/:id/edit"
          element={<VirtualProfileFormPage mode="edit" />}
        />
        <Route path="virtual-try-on" element={<VirtualTryOnPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="plan" element={<PlanPage />} />
        <Route path="billing/success" element={<BillingSuccessPage />} />
        <Route path="billing/cancel" element={<BillingCancelPage />} />
        <Route path="*" element={<AppHomePage />} />
      </Route>
    </Routes>
  );
};
