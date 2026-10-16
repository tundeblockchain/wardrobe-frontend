import { CssBaseline, ThemeProvider } from "@mui/material";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import {
  DASHBOARD_PAPER_DARK_EMPHASIS_SHADOW,
  DASHBOARD_PAPER_DARK_SHADOW,
  DASHBOARD_PAPER_LIGHT_EMPHASIS_SHADOW,
  DASHBOARD_PAPER_LIGHT_SHADOW,
} from "../dashboard/DashboardPaper";
import { createDashboardTheme } from "../../theme/createDashboardTheme";
import {
  PRICING_PLAN_CARD_TEST_ID,
  PricingPlanCard,
} from "./PricingPlanCard";

const renderCard = ({
  isCurrent = false,
  mode = "light",
}: {
  isCurrent?: boolean;
  mode?: "light" | "dark";
} = {}) => {
  const theme = createDashboardTheme(mode);

  return render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MemoryRouter>
        <PricingPlanCard
          name="Basic"
          headingId="pricing-basic-heading"
          priceLabel="£5.00"
          features={[
            { label: "Unlimited wardrobes", included: true },
            { label: "Virtual Try On", included: false },
          ]}
          isCurrent={isCurrent}
          currentPlanLabel="Current plan"
          currentPlanAriaLabel="Current plan"
        />
      </MemoryRouter>
    </ThemeProvider>,
  );
};

describe("PricingPlanCard", () => {
  it("uses a visible paper shadow and a stronger one for the current plan", () => {
    const { unmount } = renderCard();
    const card = screen.getByTestId(PRICING_PLAN_CARD_TEST_ID);

    expect(card).toHaveStyle({
      boxShadow: DASHBOARD_PAPER_LIGHT_SHADOW,
    });
    expect(card).not.toHaveAttribute("aria-current");
    expect(
      screen.queryByLabelText("Current plan"),
    ).not.toBeInTheDocument();
    unmount();

    renderCard({ isCurrent: true });
    const currentCard = screen.getByTestId(PRICING_PLAN_CARD_TEST_ID);
    expect(currentCard).toHaveAttribute("aria-current", "true");
    expect(currentCard).toHaveStyle({
      boxShadow: DASHBOARD_PAPER_LIGHT_EMPHASIS_SHADOW,
    });
    expect(screen.getByLabelText("Current plan")).toBeInTheDocument();
  });

  it("uses the shared dark paper shadows", () => {
    const { unmount } = renderCard({ mode: "dark" });
    expect(screen.getByTestId(PRICING_PLAN_CARD_TEST_ID)).toHaveStyle({
      boxShadow: DASHBOARD_PAPER_DARK_SHADOW,
    });
    unmount();

    renderCard({ mode: "dark", isCurrent: true });
    expect(screen.getByTestId(PRICING_PLAN_CARD_TEST_ID)).toHaveStyle({
      boxShadow: DASHBOARD_PAPER_DARK_EMPHASIS_SHADOW,
    });
  });
});
