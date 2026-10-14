import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createErrorResourceApi,
  createMockResourceApi,
} from "../../api/mockResourceApi";
import { renderWithProviders } from "../../test/renderWithProviders";
import { InboxPage } from "./InboxPage";

const renderInbox = (
  resourceApi: ReturnType<typeof createMockResourceApi>,
) => {
  return renderWithProviders(<InboxPage resourceApi={resourceApi} />, {
    auth: { user: { id: "user-1" } },
  });
};

describe("InboxPage", () => {
  it("lists job events from GET /me/events", async () => {
    renderInbox(createMockResourceApi());

    expect(
      await screen.findByRole("heading", { level: 1, name: "Inbox" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Virtual Try On is ready")).toBeInTheDocument();
    expect(
      screen.getByText("Sunday brunch render finished."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("1 unread")).toBeInTheDocument();
  });

  it("shows an empty state when there are no events", async () => {
    renderInbox(
      createMockResourceApi({
        listJobEvents: async () => ({ events: [], unreadCount: 0 }),
      }),
    );

    expect(
      await screen.findByRole("heading", { name: "No inbox messages" }),
    ).toBeInTheDocument();
  });

  it("shows an error state", async () => {
    renderInbox(createErrorResourceApi());

    expect(
      await screen.findByRole("heading", { name: "Couldn't load inbox" }),
    ).toBeInTheDocument();
  });
});
