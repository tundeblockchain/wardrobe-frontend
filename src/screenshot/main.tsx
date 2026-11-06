import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "../theme/fonts";
import { AuthProvider } from "../auth/AuthProvider";
import {
  createEmptyResourceApi,
  createMockResourceApi,
} from "../api/mockResourceApi";
import {
  createEmptyWishlistApi,
  createMockWishlistApi,
} from "../api/wishlistApi";
import { DashboardLayout } from "../components/dashboard/DashboardLayout";
import { AppHomePage } from "../pages/app/AppHomePage";
import { appPaths } from "../routes/paths";
import { THEME_PREFERENCE_STORAGE_KEY } from "../theme/themePreference";
import { BeforeHomePage } from "./BeforeHomePage";

const params = new URLSearchParams(window.location.search);
const phase = params.get("phase") === "before" ? "before" : "after";
const wishes = params.get("wishes") === "empty" ? "empty" : "populated";
const wardrobes = params.get("wardrobes") === "empty" ? "empty" : "populated";
const theme = params.get("theme") === "dark" ? "dark" : "light";

window.localStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, theme);

const resourceApi =
  wardrobes === "empty" ? createEmptyResourceApi() : createMockResourceApi();
const wishlistApi =
  wishes === "empty" ? createEmptyWishlistApi() : createMockWishlistApi();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element with id 'root' was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider
      initialState={{
        user: { id: "user-1", email: "user@example.com" },
        loading: false,
      }}
    >
      <MemoryRouter initialEntries={[appPaths.app]}>
        <Routes>
          <Route path={appPaths.app} element={<DashboardLayout />}>
            <Route
              index
              element={
                phase === "before" ? (
                  <BeforeHomePage emptyWardrobes={wardrobes === "empty"} />
                ) : (
                  <AppHomePage
                    resourceApi={resourceApi}
                    wishlistApi={wishlistApi}
                  />
                )
              }
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  </StrictMode>,
);
