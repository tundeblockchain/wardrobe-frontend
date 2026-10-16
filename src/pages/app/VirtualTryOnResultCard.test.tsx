import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FORM_CARD_TEST_ID, FormCard } from "../../components/dashboard/FormCard";
import { DASHBOARD_PAPER_TEST_ID, DashboardPaper } from "../../components/dashboard/DashboardPaper";
import { renderWithProviders } from "../../test/renderWithProviders";
import {
  VIRTUAL_TRY_ON_RESULT_TEST_ID,
  VirtualTryOnResultCard,
} from "./VirtualTryOnResultCard";

describe("VirtualTryOnResultCard", () => {
  it("renders the final image in a shared card and scrolls it into view", () => {
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    const handleCardRef = vi.fn((node: HTMLElement | null) => {
      node?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    renderWithProviders(
      <DashboardPaper>
        <VirtualTryOnResultCard
          imageUrls={["/screenshots/try-on-started.jpg"]}
          resultLabel="Virtual Try On result"
          onCardRef={handleCardRef}
        />
        <FormCard
          title="Virtual Try On"
          submitLabel="Start Virtual Try On"
          onCancel={() => undefined}
          onSubmit={() => undefined}
        >
          <p>Form fields</p>
        </FormCard>
      </DashboardPaper>,
    );

    const paper = screen.getByTestId(DASHBOARD_PAPER_TEST_ID);
    const result = screen.getByRole("region", { name: "Virtual Try On result" });
    expect(result).toHaveAttribute("data-testid", VIRTUAL_TRY_ON_RESULT_TEST_ID);
    expect(paper).toContainElement(result);
    expect(paper).toContainElement(screen.getByTestId(FORM_CARD_TEST_ID));
    expect(
      within(result).getByRole("img", { name: "Virtual Try On render 1" }),
    ).toHaveAttribute("src", "/screenshots/try-on-started.jpg");
    expect(handleCardRef).toHaveBeenCalled();
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });
});
