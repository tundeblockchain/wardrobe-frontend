import { CssBaseline, ThemeProvider } from "@mui/material";
import { render, screen, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockResourceApi } from "../../api/mockResourceApi";
import { VirtualTryOnPage } from "../../pages/app/VirtualTryOnPage";
import { ProtectedRoute } from "../../routes/ProtectedRoute";
import { appPaths } from "../../routes/paths";
import { stubMatchMedia } from "../../test/matchMedia";
import { renderWithProviders } from "../../test/renderWithProviders";
import { createDashboardTheme } from "../../theme/createDashboardTheme";
import { wardrobeDarkPalette } from "../../theme/wardrobeDarkPalette";
import { wardrobePalette } from "../../theme/wardrobePalette";
import { FORM_CARD_TEST_ID, FormCard } from "./FormCard";
import {
  HORIZONTAL_RESOURCE_CARD_LIST_TEST_ID,
  HorizontalResourceCardItem,
  HorizontalResourceCardList,
} from "./HorizontalResourceCardList";
import { DashboardLayout } from "./DashboardLayout";
import {
  DASHBOARD_PAPER_DARK_EMPHASIS_SHADOW,
  DASHBOARD_PAPER_DARK_SHADOW,
  DASHBOARD_PAPER_GUTTER_TEST_ID,
  DASHBOARD_PAPER_LIGHT_EMPHASIS_SHADOW,
  DASHBOARD_PAPER_LIGHT_SHADOW,
  DASHBOARD_PAPER_MAX_WIDTH,
  DASHBOARD_PAPER_TEST_ID,
  DashboardPaper,
  getDashboardPaperBoxShadow,
} from "./DashboardPaper";
import { SIDEBAR_COLLAPSED_STORAGE_KEY } from "./sidebarCollapsed";

const authProviderMocks = vi.hoisted(() => ({
  signInWithGoogle: vi.fn(),
  signInWithApple: vi.fn(),
  signInWithEmail: vi.fn(),
  registerWithEmail: vi.fn(),
  sendPasswordReset: vi.fn(),
  signOutUser: vi.fn(),
  getIdToken: vi.fn(),
}));

vi.mock("../../auth/authProviders", () => authProviderMocks);

const renderSignedInLayout = (
  route: string = appPaths.appWardrobes,
) => {
  return renderWithProviders(
    <Routes>
      <Route
        path={appPaths.app}
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="wardrobes"
          element={
            <p data-testid="wardrobes-screen">Wardrobes screen body</p>
          }
        />
        <Route
          path="virtual-try-on"
          element={
            <VirtualTryOnPage resourceApi={createMockResourceApi()} />
          }
        />
      </Route>
    </Routes>,
    {
      route,
      auth: { user: { id: "user-1", email: "user@example.com" } },
    },
  );
};

describe("DashboardPaper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authProviderMocks.getIdToken.mockResolvedValue("test-id-token");
    window.localStorage.removeItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    stubMatchMedia(false);
  });

  it("uses a stronger shared shadow for the current-plan emphasis", () => {
    expect(getDashboardPaperBoxShadow("light")).toBe(DASHBOARD_PAPER_LIGHT_SHADOW);
    expect(getDashboardPaperBoxShadow("dark")).toBe(DASHBOARD_PAPER_DARK_SHADOW);
    expect(getDashboardPaperBoxShadow("light", true)).toBe(
      DASHBOARD_PAPER_LIGHT_EMPHASIS_SHADOW,
    );
    expect(getDashboardPaperBoxShadow("dark", true)).toBe(
      DASHBOARD_PAPER_DARK_EMPHASIS_SHADOW,
    );
  });

  it("renders a narrower centred paper with a slight shadow", () => {
    renderWithProviders(
      <DashboardPaper>
        <p>Signed-in content</p>
      </DashboardPaper>,
    );

    const paper = screen.getByTestId(DASHBOARD_PAPER_TEST_ID);
    expect(paper).toHaveClass("MuiPaper-root");
    expect(paper).toHaveTextContent("Signed-in content");
    expect(paper).toHaveStyle({
      width: "100%",
      maxWidth: `${DASHBOARD_PAPER_MAX_WIDTH}px`,
      marginLeft: "auto",
      marginRight: "auto",
      backgroundColor: "rgb(255, 252, 253)",
      boxShadow: DASHBOARD_PAPER_LIGHT_SHADOW,
      overflow: "visible",
    });
    expect(wardrobePalette.backgroundPaper).toBe("#FFFCFD");
  });

  it("uses WARDROBE-199 dark paper colour and shadow", () => {
    const theme = createDashboardTheme("dark");

    render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <DashboardPaper>
          <p>Dark content</p>
        </DashboardPaper>
      </ThemeProvider>,
    );

    const paper = screen.getByTestId(DASHBOARD_PAPER_TEST_ID);
    expect(theme.palette.background.paper).toBe(
      wardrobeDarkPalette.backgroundPaper,
    );
    expect(paper).toHaveStyle({
      backgroundColor: "rgb(28, 21, 24)",
      color: "rgb(246, 237, 240)",
      boxShadow: DASHBOARD_PAPER_DARK_SHADOW,
    });
  });

  it("keeps gutters on a mobile-width viewport", () => {
    stubMatchMedia(true);
    renderWithProviders(
      <DashboardPaper>
        <p>Mobile content</p>
      </DashboardPaper>,
    );

    const gutter = screen.getByTestId(DASHBOARD_PAPER_GUTTER_TEST_ID);
    const paper = screen.getByTestId(DASHBOARD_PAPER_TEST_ID);
    expect(gutter).toBeInTheDocument();
    expect(gutter).toHaveStyle({
      minWidth: "0px",
      width: "100%",
    });
    expect(paper).toHaveStyle({
      width: "100%",
      maxWidth: `${DASHBOARD_PAPER_MAX_WIDTH}px`,
      minWidth: "0px",
    });
  });

  it("flattens FormCard so the shell paper is the only card", () => {
    renderWithProviders(
      <DashboardPaper>
        <FormCard
          title="Edit wardrobe"
          onCancel={() => undefined}
          submitLabel="Save changes"
          onSubmit={() => undefined}
        >
          <p>Form fields</p>
        </FormCard>
      </DashboardPaper>,
    );

    const paper = screen.getByTestId(DASHBOARD_PAPER_TEST_ID);
    const formCard = screen.getByTestId(FORM_CARD_TEST_ID);
    expect(paper).toContainElement(formCard);
    expect(formCard).toHaveStyle({
      maxWidth: "none",
      paddingLeft: "0px",
      paddingRight: "0px",
      paddingTop: "0px",
      paddingBottom: "0px",
      borderWidth: "0px",
      backgroundColor: "rgba(0, 0, 0, 0)",
      boxShadow: "none",
    });
  });

  it("lets horizontal picture-card lists keep scrolling inside the paper", () => {
    renderWithProviders(
      <DashboardPaper>
        <FormCard
          title="Virtual Try On"
          onCancel={() => undefined}
          submitLabel="Start Virtual Try On"
          onSubmit={() => undefined}
        >
          <HorizontalResourceCardList label="Clothing items">
            <HorizontalResourceCardItem>One</HorizontalResourceCardItem>
            <HorizontalResourceCardItem>Two</HorizontalResourceCardItem>
            <HorizontalResourceCardItem>Three</HorizontalResourceCardItem>
          </HorizontalResourceCardList>
        </FormCard>
      </DashboardPaper>,
    );

    const list = screen.getByRole("list", { name: "Clothing items" });
    expect(list).toHaveAttribute(
      "data-testid",
      HORIZONTAL_RESOURCE_CARD_LIST_TEST_ID,
    );
    expect(list).toHaveStyle({
      display: "flex",
      flexWrap: "nowrap",
      overflowX: "auto",
      minWidth: "0px",
      width: "100%",
    });
    expect(screen.getByTestId(DASHBOARD_PAPER_TEST_ID)).toHaveStyle({
      overflow: "visible",
      minWidth: "0px",
    });
    expect(screen.getByTestId(FORM_CARD_TEST_ID)).toHaveStyle({
      overflow: "visible",
      minWidth: "0px",
    });
  });

  it("wraps every signed-in screen without changing the sidebar", () => {
    renderSignedInLayout();

    const paper = screen.getByTestId(DASHBOARD_PAPER_TEST_ID);
    const sidebar = screen.getByRole("navigation", { name: "App" });
    expect(screen.getByTestId("dashboard-content")).toContainElement(paper);
    expect(paper).toHaveTextContent("Wardrobes screen body");
    expect(paper).not.toContainElement(sidebar);
    expect(screen.getAllByTestId(DASHBOARD_PAPER_TEST_ID)).toHaveLength(1);
    expect(
      within(sidebar).getByRole("link", { name: "Virtual Try On" }),
    ).toBeInTheDocument();
  });

  it("keeps Virtual Try On picture-card lists scrolling in the shell paper", async () => {
    renderSignedInLayout(appPaths.appVirtualTryOn);

    const paper = await screen.findByTestId(DASHBOARD_PAPER_TEST_ID);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Virtual Try On" }),
    ).toBeInTheDocument();
    expect(
      within(paper).getByRole("heading", { level: 1, name: "Virtual Try On" }),
    ).toBeInTheDocument();

    const itemList = await screen.findByRole("list", { name: "Clothing items" });
    const profileList = screen.getByRole("list", { name: "Virtual Profile" });
    expect(paper).toContainElement(itemList);
    expect(paper).toContainElement(profileList);
    expect(itemList).toHaveStyle({
      display: "flex",
      flexWrap: "nowrap",
      overflowX: "auto",
      minWidth: "0px",
    });
    expect(profileList).toHaveStyle({
      display: "flex",
      overflowX: "auto",
      minWidth: "0px",
    });
    expect(screen.getByTestId(FORM_CARD_TEST_ID)).toHaveStyle({
      paddingLeft: "0px",
      paddingRight: "0px",
      borderWidth: "0px",
      backgroundColor: "rgba(0, 0, 0, 0)",
    });
  });
});
