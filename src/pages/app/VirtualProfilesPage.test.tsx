import { screen } from "@testing-library/react";
import { Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { appPaths } from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import { VirtualProfilesPage } from "./VirtualProfilesPage";
import { VirtualTryOnPage } from "./VirtualTryOnPage";

const RouteLocation = () => {
  const location = useLocation();
  return <div data-testid="route-location">{location.pathname}</div>;
};

describe("VirtualProfilesPage", () => {
  it("redirects the old Virtual Profiles route to Virtual Try On", async () => {
    renderWithProviders(
      <>
        <Routes>
          <Route
            path={appPaths.appVirtualProfiles}
            element={<VirtualProfilesPage />}
          />
          <Route
            path={appPaths.appVirtualTryOn}
            element={<VirtualTryOnPage />}
          />
        </Routes>
        <RouteLocation />
      </>,
      {
        route: appPaths.appVirtualProfiles,
        auth: { user: { id: "user-1" } },
      },
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Virtual Try On" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      appPaths.appVirtualTryOn,
    );
    expect(
      screen.queryByRole("heading", { level: 1, name: "Virtual Profiles" }),
    ).not.toBeInTheDocument();
  });
});
