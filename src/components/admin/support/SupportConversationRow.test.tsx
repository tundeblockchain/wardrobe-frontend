import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SupportConversationSummary } from "../../../api/adminSupport";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { SupportConversationRow } from "./SupportConversationRow";

const baseConversation = (): SupportConversationSummary => ({
  conversationId: "conv_1",
  status: "open",
  type: "bug",
  email: "user@example.com",
  platform: "ios",
  uid: "user-1",
  createdAt: "2026-11-24T10:00:00.000Z",
  lastMessageAt: "2026-11-24T11:00:00.000Z",
  lastMessagePreview: "The upload failed",
  lastMessageAuthor: "user",
  lastEmailStatus: null,
});

describe("SupportConversationRow", () => {
  it("renders a muted placeholder when the last message preview is empty", () => {
    renderWithProviders(
      <SupportConversationRow
        conversation={{ ...baseConversation(), lastMessagePreview: "" }}
        selected={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("No preview")).toBeInTheDocument();
    expect(screen.queryByText(/Customer:/)).not.toBeInTheDocument();
  });
});
