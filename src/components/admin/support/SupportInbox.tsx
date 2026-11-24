import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Stack, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate, useParams } from "react-router-dom";
import { supportCopy } from "../../../admin/supportCopy";
import { useAdminAuth } from "../../../admin/useAdminAuth";
import {
  createAdminSupportApi,
  type SupportConversationDetailResponse,
  type SupportConversationStatus,
  type SupportConversationSummary,
  type AdminSupportApi,
} from "../../../api/adminSupport";
import { isApiError } from "../../../api/httpClient";
import {
  getAdminSupportConversationPath,
  getAdminSupportPath,
} from "../../../routes/paths";
import { SupportConversationList } from "./SupportConversationList";
import { SupportStatusTabs } from "./SupportStatusTabs";
import { SupportThreadView } from "./SupportThreadView";

export type SupportInboxProps = {
  api?: AdminSupportApi;
  nowMs?: number;
};

type ListState = {
  status: SupportConversationStatus;
  items: SupportConversationSummary[];
  nextCursor: string | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error?: string;
  loadMoreError?: string;
};

type ThreadState = {
  conversationId: string;
  detail?: SupportConversationDetailResponse;
  fetchedAtMs: number;
  isLoading: boolean;
  error?: string;
};

const emptyList = (status: SupportConversationStatus): ListState => ({
  status,
  items: [],
  nextCursor: null,
  isLoading: true,
  isLoadingMore: false,
});

export const SupportInbox = ({ api: apiProp, nowMs }: SupportInboxProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const { conversationId: routeConversationId } = useParams<{
    conversationId?: string;
  }>();
  const {
    getIdToken,
    handleUnauthorized,
    handleForbidden,
  } = useAdminAuth();
  const defaultApi = useMemo(
    () =>
      createAdminSupportApi(
        { getIdToken },
        {
          onUnauthorized: handleUnauthorized,
          onForbidden: handleForbidden,
        },
      ),
    [getIdToken, handleForbidden, handleUnauthorized],
  );
  const api = apiProp ?? defaultApi;
  const [list, setList] = useState<ListState>(emptyList("open"));
  const [thread, setThread] = useState<ThreadState | undefined>(undefined);
  const [notice, setNotice] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(
    null,
  );
  const isSendingRef = useRef(false);
  const isClosingRef = useRef(false);
  const retryingMessageIdRef = useRef<string | null>(null);
  const isLoadingMoreRef = useRef(false);

  const selectedId = routeConversationId;

  const loadList = useCallback(
    async (status: SupportConversationStatus, cursor?: string) => {
      if (cursor) {
        isLoadingMoreRef.current = true;
      }

      setList((current) => ({
        ...current,
        status,
        isLoading: !cursor,
        isLoadingMore: Boolean(cursor),
        error: cursor ? current.error : undefined,
        loadMoreError: undefined,
        items: cursor ? current.items : [],
        nextCursor: cursor ? current.nextCursor : null,
      }));

      try {
        const response = await api.listConversations({
          status,
          cursor,
        });
        isLoadingMoreRef.current = false;
        setList((current) => ({
          status,
          items: cursor ? [...current.items, ...response.items] : response.items,
          nextCursor: response.nextCursor,
          isLoading: false,
          isLoadingMore: false,
        }));
      } catch {
        isLoadingMoreRef.current = false;
        setList((current) => {
          if (cursor) {
            return {
              ...current,
              status,
              isLoading: false,
              isLoadingMore: false,
              loadMoreError: supportCopy.loadMoreError,
            };
          }

          return {
            ...current,
            status,
            items: [],
            nextCursor: null,
            isLoading: false,
            isLoadingMore: false,
            error: supportCopy.listErrorDescription,
            loadMoreError: undefined,
          };
        });
      }
    },
    [api],
  );

  const loadThread = useCallback(
    async (
      conversationId: string,
      options?: { keepVisible?: boolean },
    ) => {
      if (!options?.keepVisible) {
        setThread({
          conversationId,
          isLoading: true,
          fetchedAtMs: Date.now(),
        });
        setNotice("");
      }

      try {
        const detail = await api.getConversation(conversationId);
        const fetchedAtMs = Date.now();
        setThread({
          conversationId,
          detail,
          fetchedAtMs,
          isLoading: false,
        });
        return { detail, fetchedAtMs };
      } catch (error) {
        if (options?.keepVisible) {
          return undefined;
        }

        setThread({
          conversationId,
          isLoading: false,
          fetchedAtMs: Date.now(),
          error: isApiError(error)
            ? supportCopy.threadErrorDescription
            : supportCopy.threadErrorDescription,
        });
        return undefined;
      }
    },
    [api],
  );

  useEffect(() => {
    let cancelled = false;

    const loadInitialList = async () => {
      try {
        const response = await api.listConversations({ status: "open" });
        if (cancelled) {
          return;
        }

        setList({
          status: "open",
          items: response.items,
          nextCursor: response.nextCursor,
          isLoading: false,
          isLoadingMore: false,
        });
      } catch {
        if (cancelled) {
          return;
        }

        setList({
          status: "open",
          items: [],
          nextCursor: null,
          isLoading: false,
          isLoadingMore: false,
          error: supportCopy.listErrorDescription,
        });
      }
    };

    void loadInitialList();
    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    let cancelled = false;

    const loadSelectedThread = async () => {
      try {
        const detail = await api.getConversation(selectedId);
        if (cancelled) {
          return;
        }

        setThread({
          conversationId: selectedId,
          detail,
          fetchedAtMs: Date.now(),
          isLoading: false,
        });
      } catch {
        if (cancelled) {
          return;
        }

        setThread({
          conversationId: selectedId,
          isLoading: false,
          fetchedAtMs: Date.now(),
          error: supportCopy.threadErrorDescription,
        });
      }
    };

    void loadSelectedThread();
    return () => {
      cancelled = true;
    };
  }, [api, selectedId]);

  const threadMatchesRoute =
    Boolean(selectedId) && thread?.conversationId === selectedId;
  const visibleThread = threadMatchesRoute ? thread : undefined;

  const handleStatusChange = (status: SupportConversationStatus) => {
    void loadList(status);
    if (isMobile) {
      navigate(getAdminSupportPath());
    }
  };

  const handleSelect = (conversationId: string) => {
    navigate(getAdminSupportConversationPath(conversationId));
  };

  const handleBackToList = () => {
    navigate(getAdminSupportPath());
  };

  const handleLoadMore = () => {
    if (!list.nextCursor || isLoadingMoreRef.current) {
      return;
    }

    void loadList(list.status, list.nextCursor);
  };

  const handleSendReply = async (message: string) => {
    if (!selectedId || isSendingRef.current) {
      return;
    }

    isSendingRef.current = true;
    setIsSending(true);
    setNotice("");
    try {
      await api.reply(selectedId, message);
      await Promise.all([loadThread(selectedId), loadList(list.status)]);
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  const handleCloseConversation = async () => {
    if (!selectedId || isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    setIsClosing(true);
    setNotice("");
    try {
      await api.close(selectedId);
      await Promise.all([loadThread(selectedId), loadList(list.status)]);
    } finally {
      isClosingRef.current = false;
      setIsClosing(false);
    }
  };

  const handleRetryEmail = async (messageId: string) => {
    if (!selectedId || retryingMessageIdRef.current) {
      return;
    }

    retryingMessageIdRef.current = messageId;
    setRetryingMessageId(messageId);
    setNotice("");
    try {
      await api.retryEmail(selectedId, messageId);
      await loadThread(selectedId);
    } catch (error) {
      if (isApiError(error) && (error.status === 409 || error.code === "not_retryable")) {
        setNotice(supportCopy.notRetryable);
        await loadThread(selectedId);
        return;
      }

      setNotice(supportCopy.threadErrorDescription);
    } finally {
      retryingMessageIdRef.current = null;
      setRetryingMessageId(null);
    }
  };

  const handleRefreshScreenshotUrl = async (messageId: string) => {
    if (!selectedId) {
      return null;
    }

    const loaded = await loadThread(selectedId, { keepVisible: true });
    const message = loaded?.detail.messages.find(
      (item) => item.messageId === messageId,
    );
    return message?.screenshotUrl ?? null;
  };

  const handleScreenshotError = (messageId: string) => {
    if (!selectedId || !messageId) {
      if (selectedId) {
        void loadThread(selectedId);
      }
      return;
    }

    void handleRefreshScreenshotUrl(messageId);
  };

  const showList = !isMobile || !selectedId;
  const showThread = !isMobile || Boolean(selectedId);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "minmax(280px, 360px) 1fr" },
        gap: 3,
        alignItems: "start",
      }}
    >
      {showList ? (
        <Stack spacing={2}>
          <SupportStatusTabs
            value={list.status}
            onChange={handleStatusChange}
          />
          <SupportConversationList
            status={list.status}
            items={list.items}
            selectedId={selectedId}
            isLoading={list.isLoading}
            isLoadingMore={list.isLoadingMore}
            error={list.error}
            loadMoreError={list.loadMoreError}
            nextCursor={list.nextCursor}
            onSelect={handleSelect}
            onRetry={() => {
              void loadList(list.status);
            }}
            onLoadMore={handleLoadMore}
            nowMs={nowMs}
          />
        </Stack>
      ) : null}

      {showThread ? (
        <SupportThreadView
          conversation={visibleThread?.detail?.conversation}
          messages={visibleThread?.detail?.messages ?? []}
          fetchedAtMs={visibleThread?.fetchedAtMs ?? 0}
          isLoading={Boolean(
            selectedId && (!threadMatchesRoute || visibleThread?.isLoading),
          )}
          error={visibleThread?.error}
          notice={notice}
          isSending={isSending}
          isClosing={isClosing}
          retryingMessageId={retryingMessageId}
          showBackButton={isMobile && Boolean(selectedId)}
          nowMs={nowMs}
          onBack={handleBackToList}
          onRetry={() => {
            if (selectedId) {
              void loadThread(selectedId);
            }
          }}
          onSendReply={handleSendReply}
          onCloseConversation={handleCloseConversation}
          onRetryEmail={handleRetryEmail}
          onRefreshScreenshotUrl={handleRefreshScreenshotUrl}
          onScreenshotError={handleScreenshotError}
        />
      ) : null}
    </Box>
  );
};
