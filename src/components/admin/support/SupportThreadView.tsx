import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { formatRelativeTime } from "../../../admin/relativeTime";
import { supportCopy } from "../../../admin/supportCopy";
import type {
  SupportConversationDetail,
  SupportMessage,
} from "../../../api/adminSupport";
import { ResourceLoadingState } from "../../dashboard/ResourceLoadingState";
import { ResourceErrorState } from "../../dashboard/ResourceErrorState";
import { SupportMessageBubble } from "./SupportMessageBubble";
import { SupportReplyBox } from "./SupportReplyBox";
import { SupportScreenshotViewer } from "./SupportScreenshotViewer";

export type SupportThreadViewProps = {
  conversation?: SupportConversationDetail;
  messages: SupportMessage[];
  fetchedAtMs: number;
  isLoading?: boolean;
  error?: string;
  notice?: string;
  isSending?: boolean;
  isClosing?: boolean;
  retryingMessageId?: string | null;
  showBackButton?: boolean;
  nowMs?: number;
  onBack?: () => void;
  onRetry: () => void;
  onSendReply: (message: string) => Promise<void> | void;
  onCloseConversation: () => Promise<void> | void;
  onRetryEmail: (messageId: string) => Promise<void> | void;
  onRefreshScreenshotUrl: (messageId: string) => Promise<string | null>;
  onScreenshotError: (messageId: string) => void;
};

const MetadataRow = ({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) => {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value || supportCopy.metadataMissing}</Typography>
    </Stack>
  );
};

export const SupportThreadView = ({
  conversation,
  messages,
  fetchedAtMs,
  isLoading = false,
  error,
  notice,
  isSending = false,
  isClosing = false,
  retryingMessageId,
  showBackButton = false,
  nowMs,
  onBack,
  onRetry,
  onSendReply,
  onCloseConversation,
  onRetryEmail,
  onRefreshScreenshotUrl,
  onScreenshotError,
}: SupportThreadViewProps) => {
  const [openScreenshot, setOpenScreenshot] = useState<{
    messageId: string;
    imageUrl: string;
  } | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);

  if (isLoading) {
    return <ResourceLoadingState label={supportCopy.loadingThread} />;
  }

  if (error) {
    return (
      <ResourceErrorState
        title={supportCopy.threadErrorTitle}
        description={supportCopy.threadErrorDescription}
        retryLabel={supportCopy.retryLabel}
        onRetry={onRetry}
      />
    );
  }

  if (!conversation) {
    return (
      <Stack spacing={1} sx={{ py: 6, alignItems: "center" }}>
        <Typography variant="h2" component="h2">
          {supportCopy.selectConversation}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {supportCopy.selectConversationDescription}
        </Typography>
      </Stack>
    );
  }

  const typeLabel =
    conversation.type === "bug" ? supportCopy.typeBug : supportCopy.typeQuery;
  const isClosed = conversation.status === "closed";

  const handleOpenScreenshot = (messageId: string, imageUrl: string) => {
    setOpenScreenshot({ messageId, imageUrl });
  };

  const handleCloseScreenshot = () => {
    setOpenScreenshot(null);
  };

  const handleScreenshotError = (messageId: string) => {
    onScreenshotError(messageId);
  };

  const handleViewerImageError = () => {
    if (!openScreenshot) {
      return;
    }

    const messageId = openScreenshot.messageId;
    void (async () => {
      const nextUrl = await onRefreshScreenshotUrl(messageId);
      if (!nextUrl) {
        return;
      }

      setOpenScreenshot((current) =>
        current?.messageId === messageId
          ? { messageId, imageUrl: nextUrl }
          : current,
      );
    })();
  };

  const handleOpenCloseConfirm = () => {
    setConfirmClose(true);
  };

  const handleCloseConfirm = () => {
    setConfirmClose(false);
  };

  const handleDialogClose = () => {
    if (isClosing) {
      return;
    }

    handleCloseConfirm();
  };

  const handleConfirmClose = async () => {
    if (isClosing) {
      return;
    }

    await onCloseConversation();
    setConfirmClose(false);
  };

  const handleRetryEmail = (messageId: string) => {
    void onRetryEmail(messageId);
  };

  return (
    <Stack spacing={2}>
      {showBackButton ? (
        <Button
          type="button"
          variant="text"
          onClick={onBack}
          tabIndex={0}
          aria-label={supportCopy.backToList}
          sx={{ alignSelf: "flex-start" }}
        >
          {supportCopy.backToList}
        </Button>
      ) : null}

      {notice ? (
        <Alert severity="info" role="status" aria-live="polite">
          {notice}
        </Alert>
      ) : null}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ justifyContent: "space-between", alignItems: { sm: "flex-start" } }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h2" component="h2">
            {typeLabel} · {conversation.email}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {conversation.platform}
          </Typography>
        </Stack>
        {!isClosed ? (
          <Button
            type="button"
            variant="outlined"
            color="inherit"
            onClick={handleOpenCloseConfirm}
            disabled={isClosing}
            tabIndex={0}
            aria-label={supportCopy.closeAriaLabel}
          >
            {isClosing ? supportCopy.closingConversation : supportCopy.closeLabel}
          </Button>
        ) : null}
      </Stack>

      <Stack spacing={1.5}>
        <MetadataRow label={supportCopy.metadataEmail} value={conversation.email} />
        <MetadataRow
          label={supportCopy.metadataPlatform}
          value={conversation.platform}
        />
        <MetadataRow label={supportCopy.metadataUid} value={conversation.uid} />
        <MetadataRow
          label={supportCopy.metadataAppVersion}
          value={conversation.appVersion}
        />
        <MetadataRow label={supportCopy.metadataDevice} value={conversation.device} />
        <MetadataRow
          label={supportCopy.metadataCreated}
          value={formatRelativeTime(conversation.createdAt, nowMs)}
        />
      </Stack>

      <Divider />

      <Stack spacing={2} aria-label="Conversation messages">
        {messages.map((message) => (
          <SupportMessageBubble
            key={message.messageId}
            message={message}
            fetchedAtMs={fetchedAtMs}
            nowMs={nowMs}
            isRetrying={retryingMessageId === message.messageId}
            onRetryEmail={handleRetryEmail}
            onOpenScreenshot={handleOpenScreenshot}
            onRefreshScreenshotUrl={onRefreshScreenshotUrl}
            onScreenshotError={handleScreenshotError}
          />
        ))}
      </Stack>

      {!isClosed ? (
        <SupportReplyBox
          disabled={isClosing}
          isSending={isSending}
          onSend={onSendReply}
        />
      ) : null}

      <SupportScreenshotViewer
        open={Boolean(openScreenshot)}
        imageUrl={openScreenshot?.imageUrl ?? null}
        onClose={handleCloseScreenshot}
        onImageError={handleViewerImageError}
      />

      <Dialog
        open={confirmClose}
        onClose={handleDialogClose}
        aria-labelledby="close-conversation-title"
        aria-describedby="close-conversation-description"
      >
        <DialogTitle id="close-conversation-title">
          {supportCopy.closeConfirmTitle}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="close-conversation-description">
            {supportCopy.closeConfirmDescription}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            type="button"
            onClick={handleCloseConfirm}
            disabled={isClosing}
            tabIndex={0}
            aria-label={supportCopy.closeCancel}
          >
            {supportCopy.closeCancel}
          </Button>
          <Button
            type="button"
            color="primary"
            variant="contained"
            onClick={() => {
              void handleConfirmClose();
            }}
            disabled={isClosing}
            tabIndex={0}
            aria-label={supportCopy.closeConfirmAction}
          >
            {isClosing
              ? supportCopy.closingConversation
              : supportCopy.closeConfirmAction}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
