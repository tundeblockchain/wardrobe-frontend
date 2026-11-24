import { Alert, Button, List, Stack, Typography } from "@mui/material";
import { supportCopy } from "../../../admin/supportCopy";
import type {
  SupportConversationStatus,
  SupportConversationSummary,
} from "../../../api/adminSupport";
import { ResourceEmptyState } from "../../dashboard/ResourceEmptyState";
import { ResourceErrorState } from "../../dashboard/ResourceErrorState";
import { ResourceLoadingState } from "../../dashboard/ResourceLoadingState";
import { SupportConversationRow } from "./SupportConversationRow";

export type SupportConversationListProps = {
  status: SupportConversationStatus;
  items: SupportConversationSummary[];
  selectedId?: string;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  error?: string;
  loadMoreError?: string;
  nextCursor: string | null;
  onSelect: (conversationId: string) => void;
  onRetry: () => void;
  onLoadMore: () => void;
  nowMs?: number;
};

const EMPTY_COPY: Record<
  SupportConversationStatus,
  { title: string; description: string }
> = {
  open: {
    title: supportCopy.emptyOpenTitle,
    description: supportCopy.emptyOpenDescription,
  },
  replied: {
    title: supportCopy.emptyRepliedTitle,
    description: supportCopy.emptyRepliedDescription,
  },
  closed: {
    title: supportCopy.emptyClosedTitle,
    description: supportCopy.emptyClosedDescription,
  },
};

export const SupportConversationList = ({
  status,
  items,
  selectedId,
  isLoading = false,
  isLoadingMore = false,
  error,
  loadMoreError,
  nextCursor,
  onSelect,
  onRetry,
  onLoadMore,
  nowMs,
}: SupportConversationListProps) => {
  if (isLoading) {
    return <ResourceLoadingState label={supportCopy.loadingList} />;
  }

  if (error && items.length === 0) {
    return (
      <ResourceErrorState
        title={supportCopy.listErrorTitle}
        description={supportCopy.listErrorDescription}
        retryLabel={supportCopy.retryLabel}
        onRetry={onRetry}
      />
    );
  }

  if (items.length === 0) {
    const emptyCopy = EMPTY_COPY[status];
    return (
      <ResourceEmptyState
        title={emptyCopy.title}
        description={emptyCopy.description}
      />
    );
  }

  const handleLoadMore = () => {
    if (isLoadingMore) {
      return;
    }

    onLoadMore();
  };

  return (
    <Stack spacing={1}>
      <List aria-label={supportCopy.listLabel} disablePadding>
        {items.map((conversation) => (
          <SupportConversationRow
            key={conversation.conversationId}
            conversation={conversation}
            selected={conversation.conversationId === selectedId}
            onSelect={onSelect}
            nowMs={nowMs}
          />
        ))}
      </List>
      {loadMoreError ? (
        <Stack spacing={1}>
          <Alert severity="error" role="alert">
            {loadMoreError}
          </Alert>
          <Button
            type="button"
            variant="outlined"
            color="primary"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            tabIndex={0}
            aria-label={supportCopy.retryLabel}
          >
            {supportCopy.retryLabel}
          </Button>
        </Stack>
      ) : nextCursor ? (
        <Button
          type="button"
          variant="outlined"
          onClick={handleLoadMore}
          disabled={isLoadingMore}
          tabIndex={0}
          aria-label={supportCopy.loadMore}
        >
          {supportCopy.loadMore}
        </Button>
      ) : null}
      {items.length > 0 ? (
        <Typography variant="caption" color="text.secondary">
          {items.length} {items.length === 1 ? "conversation" : "conversations"}
        </Typography>
      ) : null}
    </Stack>
  );
};
