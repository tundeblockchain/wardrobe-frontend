import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MOCK_BILLING_PLANS } from "../../api/billingPlans";
import {
  createAiTryOnOffResourceApi,
  createEmptyResourceApi,
  createEntitlementAiRequiredResourceApi,
  createErrorResourceApi,
  createMockResourceApi,
  createOtherAiOffResourceApi,
} from "../../api/mockResourceApi";
import { dashboardCopy } from "../../content/dashboardCopy";
import { getUpgradePriceLabel } from "../../content/upgradePriceLabel";
import {
  DASHBOARD_PAPER_TEST_ID,
  DashboardPaper,
} from "../../components/dashboard/DashboardPaper";
import { FORM_CARD_TEST_ID } from "../../components/dashboard/FormCard";
import { HORIZONTAL_RESOURCE_CARD_LIST_TEST_ID } from "../../components/dashboard/HorizontalResourceCardList";
import {
  expectActionButtonNotFullWidth,
  expectInsideNarrowContent,
} from "../../test/dashboardNarrowContentTest";
import {
  expectFormInsideSharedCard,
  expectSharedFormCardAbsent,
} from "../../test/formCardTest";
import { appPaths, getAppVirtualTryOnPath } from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import { VIRTUAL_TRY_ON_RESULT_TEST_ID } from "./VirtualTryOnResultCard";
import { VirtualTryOnPage } from "./VirtualTryOnPage";

const renderPage = (
  resourceApi: ReturnType<typeof createMockResourceApi>,
  options: {
    route?: string;
    routeState?: unknown;
    pollIntervalMs?: number;
    fetchPlans?: () => Promise<{ plans: typeof MOCK_BILLING_PLANS }>;
  } = {},
) => {
  return renderWithProviders(
    <VirtualTryOnPage
      resourceApi={resourceApi}
      pollIntervalMs={options.pollIntervalMs}
      fetchPlans={options.fetchPlans}
    />,
    {
      auth: { user: { id: "user-1" } },
      route: options.route ?? appPaths.appVirtualTryOn,
      routeState: options.routeState,
    },
  );
};

const renderedItem = {
  itemId: "item_navytee01",
  wardrobeId: "wd_weekend01",
  name: "Navy tee",
  category: "TOP" as const,
  processingStatus: "READY" as const,
  createdAt: "2026-09-03T18:40:00.000Z",
  updatedAt: "2026-10-13T12:00:00.000Z",
  render: {
    status: "READY" as const,
    aiProfileId: "aip_personal01",
    imageUrl: "/screenshots/try-on-started.jpg",
  },
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

const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

describe("VirtualTryOnPage", () => {
  afterEach(() => {
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  });

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
    const result = await screen.findByRole("region", {
      name: "Virtual Try On result",
    });
    expect(result).toHaveAttribute("data-testid", VIRTUAL_TRY_ON_RESULT_TEST_ID);
    expect(
      within(result).getByRole("img", { name: "Virtual Try On render 1" }),
    ).toHaveAttribute("src", "/screenshots/try-on-started.jpg");
    expect(
      screen.queryByRole("status", { name: "Creating your try-on…" }),
    ).not.toBeInTheDocument();
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
      render: {
        status: "READY" as const,
        aiProfileId: "aip_personal01",
        imageUrl: "/screenshots/try-on-outfit.jpg",
      },
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
    const result = await screen.findByRole("region", {
      name: "Virtual Try On result",
    });
    expect(
      within(result).getByRole("img", { name: "Virtual Try On render 1" }),
    ).toHaveAttribute("src", "/screenshots/try-on-outfit.jpg");
    expect(
      screen.queryByRole("status", { name: "Creating your try-on…" }),
    ).not.toBeInTheDocument();
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

    expectInsideNarrowContent(
      await screen.findByRole("heading", {
        name: "Virtual Try On is a Premium feature",
      }),
    );
    expectActionButtonNotFullWidth(
      screen.getByRole("button", {
        name: "Upgrade to Premium for Virtual Try On",
      }),
    );
    expectActionButtonNotFullWidth(
      screen.getByRole("link", {
        name: dashboardCopy.billing.comparePlansAriaLabel,
      }),
    );
    expect(
      screen.queryByRole("button", { name: "Start Virtual Try On" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the Premium lock in the shared wrapper with content-sized Upgrade and Compare plans", async () => {
    renderPage(createAiTryOnOffResourceApi(), {
      fetchPlans: async () => ({ plans: MOCK_BILLING_PLANS }),
    });

    const pricedAriaLabel = getUpgradePriceLabel({
      actionLabel: dashboardCopy.upgrade.premium.actionAriaLabel,
      plans: MOCK_BILLING_PLANS,
      tier: "premium",
      interval: "monthly",
    });
    const pricedActionLabel = getUpgradePriceLabel({
      actionLabel: dashboardCopy.upgrade.premium.actionLabel,
      plans: MOCK_BILLING_PLANS,
      tier: "premium",
      interval: "monthly",
    });

    expectInsideNarrowContent(
      await screen.findByRole("heading", {
        name: "Virtual Try On is a Premium feature",
      }),
    );
    const upgrade = screen.getByRole("button", { name: pricedAriaLabel });
    expect(upgrade).toHaveTextContent(pricedActionLabel);
    expectActionButtonNotFullWidth(upgrade);
    expectActionButtonNotFullWidth(
      screen.getByRole("link", {
        name: dashboardCopy.billing.comparePlansAriaLabel,
      }),
    );
  });

  it("shows the live Premium price on the Virtual Try On lock card", async () => {
    renderPage(createAiTryOnOffResourceApi(), {
      fetchPlans: async () => ({ plans: MOCK_BILLING_PLANS }),
    });

    const pricedAriaLabel = getUpgradePriceLabel({
      actionLabel: dashboardCopy.upgrade.premium.actionAriaLabel,
      plans: MOCK_BILLING_PLANS,
      tier: "premium",
      interval: "monthly",
    });

    expect(
      await screen.findByRole("heading", {
        name: "Virtual Try On is a Premium feature",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: pricedAriaLabel }),
    ).toHaveTextContent(
      getUpgradePriceLabel({
        actionLabel: dashboardCopy.upgrade.premium.actionLabel,
        plans: MOCK_BILLING_PLANS,
        tier: "premium",
        interval: "monthly",
      }),
    );
  });

  it("maps 403 ENTITLEMENT_AI_REQUIRED to a Premium upgrade prompt", async () => {
    renderPage(createEntitlementAiRequiredResourceApi());

    expectInsideNarrowContent(
      await screen.findByRole("heading", {
        name: "Virtual Try On is a Premium feature",
      }),
    );
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

  it("hides profile and item photos while creating a try-on", async () => {
    const user = userEvent.setup();
    const renderItem = vi.fn(() => new Promise<typeof renderedItem>(() => undefined));
    renderPage(createMockResourceApi({ renderItem }));

    await user.click(await screen.findByRole("checkbox", { name: "Navy tee" }));
    await user.click(screen.getByRole("button", { name: "Weekday look" }));
    expect(screen.getByRole("img", { name: "Navy tee" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Weekday look" })).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Start Virtual Try On" }),
    );

    expect(
      await screen.findByRole("status", { name: "Creating your try-on…" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Navy tee" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Weekday look" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Virtual Try On render 1" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "Navy tee" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: "Virtual Profile" }),
    ).not.toBeInTheDocument();
  });

  it("scrolls the result card to the top when the render is ready", async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    renderPage(createMockResourceApi({ renderItem: vi.fn().mockResolvedValue(renderedItem) }));

    await user.click(await screen.findByRole("checkbox", { name: "Navy tee" }));
    await user.click(screen.getByRole("button", { name: "Weekday look" }));
    await user.click(
      screen.getByRole("button", { name: "Start Virtual Try On" }),
    );

    const result = await screen.findByRole("region", {
      name: "Virtual Try On result",
    });
    expect(result).toHaveAttribute("data-testid", VIRTUAL_TRY_ON_RESULT_TEST_ID);
    expect(
      within(result).getByRole("img", { name: "Virtual Try On render 1" }),
    ).toHaveAttribute("src", "/screenshots/try-on-started.jpg");
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("opens in Clothing items mode with an item from the Items screen preselected", async () => {
    renderPage(createMockResourceApi(), {
      route: getAppVirtualTryOnPath({
        itemId: "item_navytee01",
        wardrobeId: "wd_weekend01",
      }),
    });

    expect(
      await screen.findByRole("radio", { name: "Clothing items" }),
    ).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Navy tee" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("button", { name: "Weekday look" })).toBeEnabled();
  });

  it("opens with an outfit from the Outfits screen preselected", async () => {
    renderPage(createMockResourceApi(), {
      route: getAppVirtualTryOnPath({
        outfitId: "outfit_brunch01",
        wardrobeId: "wd_weekend01",
      }),
    });

    expect(await screen.findByRole("radio", { name: "Saved outfit" })).toBeChecked();
    expect(
      screen.getByRole("button", { name: "Sunday brunch" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("radio", { name: "Clothing items" }),
    ).not.toBeChecked();
  });

  it("polls the existing render endpoint until the image is ready", async () => {
    const user = userEvent.setup();
    const pendingItem = {
      ...renderedItem,
      processingStatus: "READY" as const,
      renderImageUrls: undefined,
      renderHistory: undefined,
      render: {
        status: "PENDING" as const,
        aiProfileId: "aip_personal01",
      },
    };
    const getItemRender = vi
      .fn()
      .mockResolvedValueOnce({
        status: "PROCESSING",
        aiProfileId: "aip_personal01",
      })
      .mockResolvedValueOnce({
        status: "READY",
        aiProfileId: "aip_personal01",
        imageUrl: "/screenshots/try-on-started.jpg",
      });
    renderPage(
      createMockResourceApi({
        renderItem: vi.fn().mockResolvedValue(pendingItem),
        getItemRender,
      }),
      { pollIntervalMs: 0 },
    );

    await user.click(await screen.findByRole("checkbox", { name: "Navy tee" }));
    await user.click(screen.getByRole("button", { name: "Weekday look" }));
    await user.click(
      screen.getByRole("button", { name: "Start Virtual Try On" }),
    );

    expect(
      await screen.findByRole("img", { name: "Virtual Try On render 1" }),
    ).toHaveAttribute("src", "/screenshots/try-on-started.jpg");
    expect(getItemRender).toHaveBeenCalledWith("wd_weekend01", "item_navytee01");
  });

  it("keeps polling when GET /render is READY without imageUrl", async () => {
    const user = userEvent.setup();
    const pendingItem = {
      ...renderedItem,
      renderImageUrls: undefined,
      renderHistory: undefined,
      render: {
        status: "PENDING" as const,
        aiProfileId: "aip_personal01",
      },
    };
    const getItemRender = vi
      .fn()
      .mockResolvedValueOnce({
        status: "READY",
        aiProfileId: "aip_personal01",
      })
      .mockResolvedValueOnce({
        status: "READY",
        aiProfileId: "aip_personal01",
        imageUrl: "/screenshots/try-on-started.jpg",
      });
    renderPage(
      createMockResourceApi({
        renderItem: vi.fn().mockResolvedValue(pendingItem),
        getItemRender,
      }),
      { pollIntervalMs: 0 },
    );

    await user.click(await screen.findByRole("checkbox", { name: "Navy tee" }));
    await user.click(screen.getByRole("button", { name: "Weekday look" }));
    await user.click(
      screen.getByRole("button", { name: "Start Virtual Try On" }),
    );

    expect(
      await screen.findByRole("img", { name: "Virtual Try On render 1" }),
    ).toHaveAttribute("src", "/screenshots/try-on-started.jpg");
    expect(getItemRender).toHaveBeenCalledTimes(2);
  });
});

