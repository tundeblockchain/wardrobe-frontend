import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  createAiTryOnOffResourceApi,
  createEmptyResourceApi,
  createEntitlementAiRequiredResourceApi,
  createErrorResourceApi,
  createMockResourceApi,
  createOtherAiOffResourceApi,
} from "../../api/mockResourceApi";
import {
  DASHBOARD_PAPER_TEST_ID,
  DashboardPaper,
} from "../../components/dashboard/DashboardPaper";
import { FORM_CARD_TEST_ID } from "../../components/dashboard/FormCard";
import { HORIZONTAL_RESOURCE_CARD_LIST_TEST_ID } from "../../components/dashboard/HorizontalResourceCardList";
import {
  expectFormInsideSharedCard,
  expectSharedFormCardAbsent,
} from "../../test/formCardTest";
import { appPaths } from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import { VirtualTryOnPage } from "./VirtualTryOnPage";

const renderPage = (
  resourceApi: ReturnType<typeof createMockResourceApi>,
) => {
  return renderWithProviders(<VirtualTryOnPage resourceApi={resourceApi} />, {
    auth: { user: { id: "user-1" } },
  });
};

const renderedItem = {
  itemId: "item_navytee01",
  wardrobeId: "wd_weekend01",
  name: "Navy tee",
  category: "TOP" as const,
  processingStatus: "READY" as const,
  createdAt: "2026-09-03T18:40:00.000Z",
  updatedAt: "2026-10-13T12:00:00.000Z",
  renderImageUrls: ["/screenshots/try-on-started.jpg"],
  renderHistory: [
    {
      imageKey: "users/user-1/renders/rend_new.png",
      createdAt: "2026-10-13T18:00:00.000Z",
      aiProfileId: "aip_personal01",
      imageUrl: "/screenshots/try-on-started.jpg",
    },
  ],
};

const getProfileList = async () => {
  return screen.findByRole("list", { name: "Virtual Profile" });
};

describe("VirtualTryOnPage", () => {
  it("renders a loading state", () => {
    renderPage(
      createMockResourceApi({
        getMe: () => new Promise(() => undefined),
      }),
    );

    expect(
      screen.getByRole("status", { name: "Loading Virtual Try On" }),
    ).toBeInTheDocument();
    expectSharedFormCardAbsent();
  });

  it("does not render the Virtual Try On gallery section", async () => {
    renderPage(createMockResourceApi());

    await expectFormInsideSharedCard("Start Virtual Try On");
    expect(
      screen.queryByRole("region", { name: "Virtual Try On gallery" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Virtual Try On gallery" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "No Virtual Try On renders yet" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Virtual Try On render 1" }),
    ).not.toBeInTheDocument();
  });

  it("spans the Virtual Try On card across the paper content area", async () => {
    renderWithProviders(
      <DashboardPaper>
        <VirtualTryOnPage resourceApi={createMockResourceApi()} />
      </DashboardPaper>,
      { auth: { user: { id: "user-1" } } },
    );

    await expectFormInsideSharedCard("Start Virtual Try On");
    const paper = screen.getByTestId(DASHBOARD_PAPER_TEST_ID);
    const card = screen.getByTestId(FORM_CARD_TEST_ID);
    const form = screen.getByRole("form", { name: "Start Virtual Try On" });
    expect(paper).toContainElement(card);
    expect(card).toContainElement(form);
    expect(card).toHaveStyle({
      width: "100%",
      maxWidth: "none",
      alignSelf: "stretch",
    });
    expect(form).toHaveStyle({
      width: "100%",
    });
    expect(
      screen.getByRole("combobox", { name: "Wardrobe" }).closest(".MuiFormControl-root"),
    ).toHaveClass("MuiFormControl-fullWidth");
  });

  it("puts clothing items before Virtual Profiles in the form", async () => {
    renderPage(createMockResourceApi());

    const itemList = await screen.findByRole("list", { name: "Clothing items" });
    const profileList = await getProfileList();
    expect(itemList).toHaveAttribute(
      "data-testid",
      HORIZONTAL_RESOURCE_CARD_LIST_TEST_ID,
    );
    expect(profileList).toHaveAttribute(
      "data-testid",
      HORIZONTAL_RESOURCE_CARD_LIST_TEST_ID,
    );
    expect(
      itemList.compareDocumentPosition(profileList) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("keeps Virtual Profile cards disabled until clothing items are chosen", async () => {
    const user = userEvent.setup();
    renderPage(createMockResourceApi());

    const ownCard = await screen.findByRole("button", { name: "Weekday look" });
    const presetCard = screen.getByRole("button", { name: "Catalog model" });
    expect(ownCard).toBeDisabled();
    expect(presetCard).toBeDisabled();
    expect(ownCard).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByText("Choose clothing items or an outfit first."),
    ).toBeInTheDocument();

    await user.click(ownCard);

    expect(ownCard).toHaveAttribute("aria-pressed", "false");
    expect(presetCard).toHaveAttribute("aria-pressed", "false");

    await user.click(screen.getByRole("checkbox", { name: "Navy tee" }));

    expect(ownCard).toBeEnabled();
    expect(presetCard).toBeEnabled();
    expect(
      screen.queryByText("Choose clothing items or an outfit first."),
    ).not.toBeInTheDocument();

    await user.click(presetCard);

    expect(ownCard).toHaveAttribute("aria-pressed", "false");
    expect(presetCard).toHaveAttribute("aria-pressed", "true");
  });

  it("requires an outfit before a Virtual Profile can be selected", async () => {
    const user = userEvent.setup();
    renderPage(createMockResourceApi());

    await user.click(await screen.findByLabelText("Saved outfit"));

    const ownCard = screen.getByRole("button", { name: "Weekday look" });
    expect(ownCard).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Sunday brunch" }));

    expect(ownCard).toBeEnabled();
    await user.click(ownCard);
    expect(ownCard).toHaveAttribute("aria-pressed", "true");
  });

  it("renders own and preset Virtual Profile cards as a single-select picker", async () => {
    const user = userEvent.setup();
    renderPage(createMockResourceApi());

    await expectFormInsideSharedCard("Start Virtual Try On");
    await user.click(await screen.findByRole("checkbox", { name: "Navy tee" }));

    const ownCard = screen.getByRole("button", { name: "Weekday look" });
    const presetCard = screen.getByRole("button", { name: "Catalog model" });
    expect(ownCard).toHaveAttribute("aria-pressed", "false");
    expect(presetCard).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Personal")).toBeInTheDocument();
    expect(screen.getByText("Preset")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Weekday look" }),
    ).toHaveAttribute("src", "/screenshots/try-on-blue-mini-390.jpg");
    expect(
      screen.getByRole("img", { name: "Catalog model" }),
    ).toHaveAttribute("src", "/screenshots/try-on-rust-floral-390.jpg");

    await user.click(presetCard);

    expect(ownCard).toHaveAttribute("aria-pressed", "false");
    expect(presetCard).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.queryByRole("combobox", { name: "Virtual Profile" }),
    ).not.toBeInTheDocument();
  });

  it("places Add Virtual Profile inside the Virtual Profile list", async () => {
    renderPage(createMockResourceApi());

    const profileList = await getProfileList();
    const addCard = within(profileList).getByRole("link", {
      name: "Add a Virtual Profile",
    });
    expect(addCard).toHaveAttribute("href", appPaths.appVirtualProfileNew);
    expect(
      within(profileList).getByRole("button", { name: "Weekday look" }),
    ).toBeInTheDocument();
    expect(
      within(profileList).getByRole("button", { name: "Catalog model" }),
    ).toBeInTheDocument();
  });

  it("hides Add Virtual Profile when otherAi is off", async () => {
    renderPage(createOtherAiOffResourceApi());

    expect(
      await screen.findByRole("button", { name: "Weekday look" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Catalog model" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Add a Virtual Profile" }),
    ).not.toBeInTheDocument();
  });

  it("toggles clothing-item cards as a multi-select picker", async () => {
    const user = userEvent.setup();
    renderPage(createMockResourceApi());

    const navyTee = await screen.findByRole("checkbox", { name: "Navy tee" });
    const ivoryMaxi = screen.getByRole("checkbox", { name: "Ivory maxi" });
    expect(navyTee).toHaveAttribute("aria-checked", "false");
    expect(ivoryMaxi).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("img", { name: "Navy tee" })).toBeInTheDocument();

    await user.click(navyTee);
    await user.click(ivoryMaxi);

    expect(navyTee).toHaveAttribute("aria-checked", "true");
    expect(ivoryMaxi).toHaveAttribute("aria-checked", "true");

    await user.click(navyTee);
    expect(navyTee).toHaveAttribute("aria-checked", "false");
    expect(ivoryMaxi).toHaveAttribute("aria-checked", "true");
  });

  it("toggles item cards from the keyboard", async () => {
    const user = userEvent.setup();
    renderPage(createMockResourceApi());

    const navyTee = await screen.findByRole("checkbox", { name: "Navy tee" });
    navyTee.focus();
    await user.keyboard(" ");

    expect(navyTee).toHaveAttribute("aria-checked", "true");
    await user.keyboard("{Enter}");
    expect(navyTee).toHaveAttribute("aria-checked", "false");
  });

  it("renders saved outfits as selectable photo cards", async () => {
    const user = userEvent.setup();
    renderPage(createMockResourceApi());

    await user.click(await screen.findByLabelText("Saved outfit"));

    const outfitCard = await screen.findByRole("button", {
      name: "Sunday brunch",
    });
    expect(outfitCard).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("img", { name: "Sunday brunch" })).toHaveAttribute(
      "src",
      "/screenshots/try-on-ivory-maxi-390.jpg",
    );
    expect(
      screen.queryByRole("combobox", { name: "Outfit" }),
    ).not.toBeInTheDocument();

    await user.click(outfitCard);
    expect(outfitCard).toHaveAttribute("aria-pressed", "true");
  });

  it("sends the same Virtual Try On payload for an own profile", async () => {
    const user = userEvent.setup();
    const renderItem = vi.fn().mockResolvedValue(renderedItem);
    renderPage(createMockResourceApi({ renderItem }));

    await expectFormInsideSharedCard("Start Virtual Try On");
    expect(
      screen.getByRole("heading", { level: 1, name: "Virtual Try On" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Virtual Try On gallery" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Virtual Try On render 1" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Navy tee" }));
    await user.click(screen.getByRole("button", { name: "Weekday look" }));
    await user.click(
      screen.getByRole("button", { name: "Start Virtual Try On" }),
    );

    expect(renderItem).toHaveBeenCalledWith("wd_weekend01", "item_navytee01", {
      aiProfileId: "aip_personal01",
    });
    expect(renderItem).toHaveBeenCalledTimes(1);
    expect(renderItem.mock.calls[0]?.[2]).toEqual({
      aiProfileId: "aip_personal01",
    });
    expect(
      await screen.findByRole("status"),
    ).toHaveTextContent("Virtual Try On is processing.");
    const result = screen.getByRole("region", {
      name: "Virtual Try On result",
    });
    expect(
      within(result).getByRole("img", { name: "Virtual Try On render 1" }),
    ).toHaveAttribute("src", "/screenshots/try-on-started.jpg");
    expect(
      screen.queryByRole("region", { name: "Virtual Try On gallery" }),
    ).not.toBeInTheDocument();
  });

  it("sends the same Virtual Try On payload for a preset profile", async () => {
    const user = userEvent.setup();
    const renderItem = vi.fn().mockResolvedValue({
      ...renderedItem,
      renderHistory: [
        {
          ...renderedItem.renderHistory[0],
          aiProfileId: "aip_model01",
        },
      ],
    });
    renderPage(createMockResourceApi({ renderItem }));

    await user.click(await screen.findByRole("checkbox", { name: "Navy tee" }));
    await user.click(screen.getByRole("button", { name: "Catalog model" }));
    await user.click(
      screen.getByRole("button", { name: "Start Virtual Try On" }),
    );

    expect(renderItem).toHaveBeenCalledWith("wd_weekend01", "item_navytee01", {
      aiProfileId: "aip_model01",
    });
    expect(renderItem.mock.calls[0]?.[2]).toEqual({
      aiProfileId: "aip_model01",
    });
  });

  it("starts a Virtual Try On render for a selected outfit", async () => {
    const user = userEvent.setup();
    const renderOutfit = vi.fn().mockResolvedValue({
      outfitId: "outfit_brunch01",
      wardrobeId: "wd_weekend01",
      name: "Sunday brunch",
      items: [],
      createdAt: "2026-09-20T14:00:00.000Z",
      updatedAt: "2026-10-13T12:00:00.000Z",
      renderImageUrls: ["/screenshots/try-on-outfit.jpg"],
    });
    renderPage(createMockResourceApi({ renderOutfit }));

    await user.click(await screen.findByLabelText("Saved outfit"));
    await user.click(screen.getByRole("button", { name: "Sunday brunch" }));
    await user.click(screen.getByRole("button", { name: "Weekday look" }));
    await user.click(
      screen.getByRole("button", { name: "Start Virtual Try On" }),
    );

    expect(renderOutfit).toHaveBeenCalledWith(
      "wd_weekend01",
      "outfit_brunch01",
      { aiProfileId: "aip_personal01" },
    );
    expect(renderOutfit.mock.calls[0]?.[2]).toEqual({
      aiProfileId: "aip_personal01",
    });
    expect(
      await screen.findByRole("status"),
    ).toHaveTextContent("Virtual Try On is processing.");
    expect(
      screen.getByRole("img", { name: "Virtual Try On render 1" }),
    ).toHaveAttribute("src", "/screenshots/try-on-outfit.jpg");
  });

  it("renders an empty picker when there are no Virtual Profiles", async () => {
    renderPage(createEmptyResourceApi());

    expect(
      await screen.findByRole("link", { name: "Add a Virtual Profile" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Weekday look" }),
    ).not.toBeInTheDocument();
  });

  it("renders an upgrade prompt when /me features.aiTryOn is false", async () => {
    renderPage(createAiTryOnOffResourceApi());

    expect(
      await screen.findByRole("heading", {
        name: "Virtual Try On is a Premium feature",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Upgrade to Premium for Virtual Try On",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Start Virtual Try On" }),
    ).not.toBeInTheDocument();
  });

  it("maps 403 ENTITLEMENT_AI_REQUIRED to a Premium upgrade prompt", async () => {
    renderPage(createEntitlementAiRequiredResourceApi());

    expect(
      await screen.findByRole("heading", {
        name: "Virtual Try On is a Premium feature",
      }),
    ).toBeInTheDocument();
  });

  it("renders an error state", async () => {
    renderPage(createErrorResourceApi());

    expect(
      await screen.findByRole("heading", {
        name: "Couldn't load Virtual Try On",
      }),
    ).toBeInTheDocument();
  });

  it("keeps the Virtual Profile picker keyboard accessible after clothing is chosen", async () => {
    const user = userEvent.setup();
    renderPage(createMockResourceApi());

    await user.click(await screen.findByRole("checkbox", { name: "Navy tee" }));

    const profileGrid = await screen.findByRole("list", {
      name: "Virtual Profile",
    });
    const presetCard = within(profileGrid).getByRole("button", {
      name: "Catalog model",
    });
    presetCard.focus();
    await user.keyboard("{Enter}");

    expect(presetCard).toHaveAttribute("aria-pressed", "true");
    expect(
      within(profileGrid).getByRole("button", { name: "Weekday look" }),
    ).toHaveAttribute("aria-pressed", "false");
  });
});
