import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import {
  HORIZONTAL_RESOURCE_CARD_LIST_TEST_ID,
  HORIZONTAL_RESOURCE_CARD_WIDTH_PX,
  HorizontalResourceCardItem,
  HorizontalResourceCardList,
} from "./HorizontalResourceCardList";

describe("HorizontalResourceCardList", () => {
  it("lays picture cards in a horizontal scrolling row", () => {
    renderWithProviders(
      <HorizontalResourceCardList label="Clothing items">
        <HorizontalResourceCardItem>One</HorizontalResourceCardItem>
        <HorizontalResourceCardItem>Two</HorizontalResourceCardItem>
        <HorizontalResourceCardItem>Three</HorizontalResourceCardItem>
      </HorizontalResourceCardList>,
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
    expect(list.children).toHaveLength(3);
    expect(list.children[0]).toHaveStyle({
      minWidth: `${HORIZONTAL_RESOURCE_CARD_WIDTH_PX}px`,
    });
  });
});
