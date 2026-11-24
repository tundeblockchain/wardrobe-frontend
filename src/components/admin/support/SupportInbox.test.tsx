import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminAuthProvider } from "../../../admin/AdminAuthProvider";
import { SCREENSHOT_URL_TTL_MS } from "../../../admin/screenshotExpiry";
import type {
  AdminSupportApi,
  SupportConversationDetailResponse,
  SupportConversationSummary,
} from "../../../api/adminSupport";
import { ApiError } from "../../../api/httpClient";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { SupportInbox } from "./SupportInbox";

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const openItem: SupportConversationSummary = {
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
};

const laterItem: SupportConversationSummary = {
  ...openItem,
  conversationId: "conv_2",
  email: "second@example.com",
  lastMessagePreview: "Another question",
  type: "query",
};

const threadDetail = (
  screenshotUrl = "https://cdn.example.com/shot-v1.png",
  emailStatus: "sent" | "failed" | null = null,
): SupportConversationDetailResponse => ({
  conversation: {
    conversationId: "conv_1",
    status: "open",
    type: "bug",
    email: "user@example.com",
    platform: "ios",
    uid: "user-1",
    appVersion: "1.2.3",
    device: "iPhone",
    createdAt: "2026-11-24T10:00:00.000Z",
    lastMessageAt: "2026-11-24T11:00:00.000Z",
  },
  messages: [
    {
      messageId: "msg_user",
      author: "user",
      body: "The upload failed",
      createdAt: "2026-11-24T11:00:00.000Z",
      screenshotUrl,
      emailStatus: null,
    },
    {
      messageId: "msg_admin",
      author: "admin",
      body: "Thanks, we are looking into this.",
      createdAt: "2026-11-24T11:05:00.000Z",
      screenshotUrl: null,
      emailStatus,
    },
  ],
});

const createApi = (): AdminSupportApi => {
  return {
    listConversations: vi.fn(),
    getConversation: vi.fn(),
    reply: vi.fn(),
    close: vi.fn(),
    retryEmail: vi.fn(),
  };
};

const renderInbox = (api: AdminSupportApi, route = "/admin/support") => {
  return renderWithProviders(
    <AdminAuthProvider
      initialState={{
        configured: true,
        loading: false,
        user: { id: "admin-1", email: "ops@example.com" },
        admin: true,
        apiForbidden: false,
      }}
    >
      <Routes>
        <Route path="/admin/support" element={<SupportInbox api={api} />} />
        <Route
          path="/admin/support/:conversationId"
          element={<SupportInbox api={api} />}
        />
      </Routes>
    </AdminAuthProvider>,
    { route },
  );
};

describe("SupportInbox", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("lists open conversations by default and loads more", async () => {
    const user = userEvent.setup();
    const api = createApi();
    vi.mocked(api.listConversations)
      .mockResolvedValueOnce({ items: [openItem], nextCursor: "cursor-2" })
      .mockResolvedValueOnce({ items: [laterItem], nextCursor: null });

    renderInbox(api);

    expect(
      await screen.findByRole("button", {
        name: "Bug from user@example.com",
      }),
    ).toBeInTheDocument();
    expect(api.listConversations).toHaveBeenCalledWith({
      status: "open",
      cursor: undefined,
    });

    await user.click(screen.getByRole("button", { name: "Load more" }));
    expect(
      await screen.findByRole("button", {
        name: "Question from second@example.com",
      }),
    ).toBeInTheDocument();
    expect(api.listConversations).toHaveBeenLastCalledWith({
      status: "open",
      cursor: "cursor-2",
    });
  });

  it("switches the status filter", async () => {
    const user = userEvent.setup();
    const api = createApi();
    vi.mocked(api.listConversations)
      .mockResolvedValueOnce({ items: [openItem], nextCursor: null })
      .mockResolvedValueOnce({
        items: [{ ...openItem, status: "replied", lastMessageAuthor: "admin" }],
        nextCursor: null,
      });

    renderInbox(api);
    await screen.findByRole("button", { name: "Bug from user@example.com" });
    await user.click(screen.getByRole("tab", { name: "Replied" }));

    await waitFor(() => {
      expect(api.listConversations).toHaveBeenLastCalledWith({
        status: "replied",
        cursor: undefined,
      });
    });
  });

  it("opens a thread, sends a failed-email reply as a saved message, retries email, and closes", async () => {
    const user = userEvent.setup();
    const api = createApi();
    vi.mocked(api.listConversations).mockResolvedValue({
      items: [openItem],
      nextCursor: null,
    });
    vi.mocked(api.getConversation)
      .mockResolvedValueOnce(threadDetail(undefined, null))
      .mockResolvedValueOnce(threadDetail(undefined, "failed"))
      .mockResolvedValueOnce(threadDetail(undefined, "sent"))
      .mockResolvedValue({
        ...threadDetail(undefined, "sent"),
        conversation: {
          ...threadDetail().conversation,
          status: "closed",
        },
      });
    vi.mocked(api.reply).mockResolvedValue({
      messageId: "msg_admin",
      emailStatus: "failed",
    });
    vi.mocked(api.retryEmail).mockResolvedValue({
      messageId: "msg_admin",
      emailStatus: "sent",
    });
    vi.mocked(api.close).mockResolvedValue({
      conversationId: "conv_1",
      status: "closed",
    });

    renderInbox(api);
    await user.click(
      await screen.findByRole("button", { name: "Bug from user@example.com" }),
    );

    expect(await screen.findByText("The upload failed")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Bug · user@example.com" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("ios").length).toBeGreaterThan(0);
    expect(screen.getByText("user-1")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Reply"), "Thanks, we are looking into this.");
    await user.click(screen.getByRole("button", { name: "Send reply" }));

    expect(api.reply).toHaveBeenCalledWith(
      "conv_1",
      "Thanks, we are looking into this.",
    );
    expect(await screen.findByLabelText("Email failed")).toBeInTheDocument();
    expect(
      screen.queryByRole("alert", { name: /could not/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry email" }));
    expect(api.retryEmail).toHaveBeenCalledWith("conv_1", "msg_admin");
    expect(await screen.findByLabelText("Email sent")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close this conversation" }));
    await user.click(
      screen.getByRole("button", { name: "Close conversation" }),
    );
    expect(api.close).toHaveBeenCalledWith("conv_1");
  });

  it("refetches the thread before opening a screenshot that is 900s old", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const api = createApi();
    vi.mocked(api.listConversations).mockResolvedValue({
      items: [openItem],
      nextCursor: null,
    });
    vi.mocked(api.getConversation)
      .mockResolvedValueOnce(threadDetail("https://cdn.example.com/shot-v1.png"))
      .mockResolvedValueOnce(threadDetail("https://cdn.example.com/shot-v2.png"));

    renderInbox(api, "/admin/support/conv_1");

    const thumb = await screen.findByRole("button", { name: "Open screenshot" });
    expect(api.getConversation).toHaveBeenCalledTimes(1);

    fireEvent.click(thumb);
    expect(
      await screen.findByRole("dialog", { name: "Screenshot" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("dialog", { name: "Screenshot" })).getByAltText(
        "Conversation screenshot",
      ),
    ).toHaveAttribute("src", "https://cdn.example.com/shot-v1.png");
    expect(api.getConversation).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Close screenshot" }));
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Screenshot" }),
      ).not.toBeInTheDocument();
    });
    vi.advanceTimersByTime(SCREENSHOT_URL_TTL_MS);

    fireEvent.click(screen.getByRole("button", { name: "Open screenshot" }));
    await waitFor(() => {
      expect(api.getConversation).toHaveBeenCalledTimes(2);
    });
    expect(
      within(await screen.findByRole("dialog", { name: "Screenshot" })).getByAltText(
        "Conversation screenshot",
      ),
    ).toHaveAttribute("src", "https://cdn.example.com/shot-v2.png");
  });

  it("disables reply, retry email, and close while their request is in flight", async () => {
    const replyDeferred = createDeferred<{
      messageId: string;
      emailStatus: "failed";
    }>();
    const retryDeferred = createDeferred<{
      messageId: string;
      emailStatus: "sent";
    }>();
    const closeDeferred = createDeferred<{
      conversationId: string;
      status: "closed";
    }>();
    const api = createApi();
    vi.mocked(api.listConversations).mockResolvedValue({
      items: [openItem],
      nextCursor: null,
    });
    vi.mocked(api.getConversation).mockResolvedValue(
      threadDetail(undefined, "failed"),
    );
    vi.mocked(api.reply).mockReturnValue(replyDeferred.promise);
    vi.mocked(api.retryEmail).mockReturnValue(retryDeferred.promise);
    vi.mocked(api.close).mockReturnValue(closeDeferred.promise);

    renderInbox(api, "/admin/support/conv_1");
    await screen.findByText("The upload failed");

    fireEvent.change(screen.getByRole("textbox", { name: "Reply" }), {
      target: { value: "Thanks, we are looking into this." },
    });
    const sendButton = screen.getByRole("button", { name: "Send reply" });
    fireEvent.click(sendButton);
    fireEvent.click(sendButton);
    expect(api.reply).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole("button", { name: "Sending reply…" }),
    ).toBeDisabled();

    replyDeferred.resolve({ messageId: "msg_admin", emailStatus: "failed" });
    const retryButton = await screen.findByRole("button", {
      name: "Retry email",
    });
    fireEvent.click(retryButton);
    fireEvent.click(retryButton);
    expect(api.retryEmail).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole("button", { name: "Retrying email…" }),
    ).toBeDisabled();

    retryDeferred.resolve({ messageId: "msg_admin", emailStatus: "sent" });
    fireEvent.click(
      await screen.findByRole("button", { name: "Close this conversation" }),
    );
    const confirmClose = await screen.findByRole("button", {
      name: "Close conversation",
    });
    fireEvent.click(confirmClose);
    fireEvent.click(confirmClose);
    expect(api.close).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Close conversation" }),
      ).toBeDisabled();
    });
    closeDeferred.resolve({ conversationId: "conv_1", status: "closed" });
    await waitFor(() => {
      expect(api.close).toHaveBeenCalledTimes(1);
    });
  });

  it("keeps the list and shows an inline retry when a cursor page returns 400 or 500", async () => {
    const user = userEvent.setup();
    const api = createApi();
    vi.mocked(api.listConversations)
      .mockResolvedValueOnce({ items: [openItem], nextCursor: "cursor-2" })
      .mockRejectedValueOnce(
        new ApiError({ status: 400, code: "validation", message: "Bad cursor" }),
      )
      .mockRejectedValueOnce(
        new ApiError({ status: 500, code: "internal", message: "Server error" }),
      )
      .mockResolvedValueOnce({ items: [laterItem], nextCursor: null });

    renderInbox(api);

    expect(
      await screen.findByRole("button", {
        name: "Bug from user@example.com",
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Load more" }));
    expect(
      await screen.findByText(
        "Could not load more conversations. Try again in a moment.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bug from user@example.com" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Load more" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByText(
        "Could not load more conversations. Try again in a moment.",
      ),
    ).toBeInTheDocument();
    expect(api.listConversations).toHaveBeenLastCalledWith({
      status: "open",
      cursor: "cursor-2",
    });

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("button", {
        name: "Question from second@example.com",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Could not load more conversations. Try again in a moment.",
      ),
    ).not.toBeInTheDocument();
  });

  it("refetches the thread when a screenshot fails to load", async () => {
    const api = createApi();
    vi.mocked(api.listConversations).mockResolvedValue({
      items: [openItem],
      nextCursor: null,
    });
    vi.mocked(api.getConversation)
      .mockResolvedValueOnce(threadDetail("https://cdn.example.com/shot-v1.png"))
      .mockResolvedValueOnce(threadDetail("https://cdn.example.com/shot-v2.png"));

    renderInbox(api, "/admin/support/conv_1");
    const thumb = await screen.findByRole("button", { name: "Open screenshot" });
    const image = within(thumb).getByAltText("Conversation screenshot");
    fireEvent.error(image);

    await waitFor(() => {
      expect(api.getConversation).toHaveBeenCalledTimes(2);
    });
  });
});
