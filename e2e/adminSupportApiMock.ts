import type { Page } from "@playwright/test";
import { E2E_API_ORIGIN } from "./env";

export const E2E_ADMIN_TOKEN = "e2e-admin-id-token";
export const E2E_ADMIN_USER_ID = "admin-1";
export const E2E_ADMIN_EMAIL = "ops@example.com";

export type AdminSupportMockOptions = {
  listStatus?: Record<string, { items: unknown[]; nextCursor: string | null }>;
  threadById?: Record<string, unknown>;
  replyEmailStatus?: "sent" | "failed";
  retryEmailStatus?: "sent" | "failed" | "not_retryable";
  unauthorized?: boolean;
  forbidden?: boolean;
};

const defaultOpenItems = [
  {
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
  },
];

const defaultRepliedItems = [
  {
    ...defaultOpenItems[0],
    status: "replied",
    lastMessageAuthor: "admin",
    lastMessagePreview: "Thanks, we are looking into this.",
    lastEmailStatus: "sent",
  },
];

const defaultThread = {
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
      screenshotUrl: "https://cdn.pocketcloset.test/shot-v1.png",
      emailStatus: null,
    },
  ],
};

const json = (status: number, body: unknown) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

export const installAdminSupportApiMocks = async (
  page: Page,
  options: AdminSupportMockOptions = {},
): Promise<{ threadGets: () => number }> => {
  let threadGets = 0;
  let screenshotVersion = 1;
  const listStatus = options.listStatus ?? {
    open: { items: defaultOpenItems, nextCursor: "cursor-2" },
    replied: { items: defaultRepliedItems, nextCursor: null },
    closed: { items: [], nextCursor: null },
  };
  const extraOpenItem = {
    conversationId: "conv_2",
    status: "open",
    type: "query",
    email: "second@example.com",
    platform: "web",
    uid: null,
    createdAt: "2026-11-24T09:00:00.000Z",
    lastMessageAt: "2026-11-24T09:30:00.000Z",
    lastMessagePreview: "How do I change a plan?",
    lastMessageAuthor: "user",
    lastEmailStatus: null,
  };

  await page.route("https://cdn.pocketcloset.test/**", async (route) => {
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
      "base64",
    );
    await route.fulfill({
      status: 200,
      contentType: "image/png",
      body: png,
    });
  });

  await page.route(
    (url) =>
      url.origin === E2E_API_ORIGIN &&
      url.pathname.startsWith("/admin/support/"),
    async (route) => {
      if (options.unauthorized) {
        await route.fulfill(json(401, { error: "unauthorized" }));
        return;
      }

      if (options.forbidden) {
        await route.fulfill(json(403, { error: "forbidden" }));
        return;
      }

      const request = route.request();
      const url = new URL(request.url());
      const method = request.method();
      const auth = request.headers().authorization;
      if (auth !== `Bearer ${E2E_ADMIN_TOKEN}`) {
        await route.fulfill(json(401, { error: "unauthorized" }));
        return;
      }

      if (url.pathname === "/admin/support/conversations" && method === "GET") {
        const status = url.searchParams.get("status") ?? "open";
        const cursor = url.searchParams.get("cursor");
        if (status === "open" && cursor === "cursor-2") {
          await route.fulfill(
            json(200, { items: [extraOpenItem], nextCursor: null }),
          );
          return;
        }

        const pageBody = listStatus[status] ?? { items: [], nextCursor: null };
        await route.fulfill(json(200, pageBody));
        return;
      }

      const conversationMatch = url.pathname.match(
        /^\/admin\/support\/conversations\/([^/]+)$/,
      );
      if (conversationMatch && method === "GET") {
        threadGets += 1;
        screenshotVersion += threadGets > 1 ? 1 : 0;
        const conversationId = conversationMatch[1];
        const stored = options.threadById?.[conversationId];
        const body = structuredClone(stored ?? defaultThread) as {
          conversation: { conversationId: string };
          messages: Array<{ screenshotUrl: string | null }>;
        };
        body.conversation.conversationId = conversationId;
        if (body.messages[0]) {
          body.messages[0].screenshotUrl = `https://cdn.pocketcloset.test/shot-v${screenshotVersion}.png`;
        }
        await route.fulfill(json(200, body));
        return;
      }

      const replyMatch = url.pathname.match(
        /^\/admin\/support\/conversations\/([^/]+)\/replies$/,
      );
      if (replyMatch && method === "POST") {
        const emailStatus = options.replyEmailStatus ?? "sent";
        await route.fulfill(
          json(201, { messageId: "msg_admin", emailStatus }),
        );
        const conversationId = replyMatch[1];
        options.threadById = {
          ...options.threadById,
          [conversationId]: {
            conversation: {
              ...defaultThread.conversation,
              conversationId,
              status: "replied",
            },
            messages: [
              ...defaultThread.messages,
              {
                messageId: "msg_admin",
                author: "admin",
                body: "Thanks, we are looking into this.",
                createdAt: "2026-11-24T11:10:00.000Z",
                screenshotUrl: null,
                emailStatus,
              },
            ],
          },
        };
        return;
      }

      const closeMatch = url.pathname.match(
        /^\/admin\/support\/conversations\/([^/]+)\/close$/,
      );
      if (closeMatch && method === "POST") {
        const conversationId = closeMatch[1];
        await route.fulfill(
          json(200, { conversationId, status: "closed" }),
        );
        const current =
          options.threadById?.[conversationId] ?? defaultThread;
        options.threadById = {
          ...options.threadById,
          [conversationId]: {
            ...current,
            conversation: {
              ...(current as typeof defaultThread).conversation,
              status: "closed",
            },
          },
        };
        return;
      }

      const retryMatch = url.pathname.match(
        /^\/admin\/support\/conversations\/([^/]+)\/messages\/([^/]+)\/retry-email$/,
      );
      if (retryMatch && method === "POST") {
        if (options.retryEmailStatus === "not_retryable") {
          await route.fulfill(json(409, { error: "not_retryable" }));
          return;
        }

        const emailStatus = options.retryEmailStatus ?? "sent";
        await route.fulfill(
          json(200, { messageId: retryMatch[2], emailStatus }),
        );
        const conversationId = retryMatch[1];
        const current = options.threadById?.[conversationId] as
          | typeof defaultThread
          | undefined;
        if (current) {
          options.threadById = {
            ...options.threadById,
            [conversationId]: {
              ...current,
              messages: current.messages.map((message) =>
                message.messageId === retryMatch[2]
                  ? { ...message, emailStatus }
                  : message,
              ),
            },
          };
        }
        return;
      }

      await route.fulfill(json(404, { error: "not_found" }));
    },
  );

  return {
    threadGets: () => threadGets,
  };
};
