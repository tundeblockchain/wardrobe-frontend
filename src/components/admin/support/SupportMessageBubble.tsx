import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { formatRelativeTime } from "../../../admin/relativeTime";
import { supportCopy } from "../../../admin/supportCopy";
import type { SupportMessage } from "../../../api/adminSupport";
import { SupportEmailStatusChip } from "./SupportEmailStatusChip";
import { SupportScreenshotThumb } from "./SupportScreenshotThumb";

export type SupportMessageBubbleProps = {
  message: SupportMessage;
  fetchedAtMs: number;
  nowMs?: number;
  isRetrying?: boolean;
  onRetryEmail?: (messageId: string) => void;
  onOpenScreenshot: (messageId: string, imageUrl: string) => void;
  onRefreshScreenshotUrl: (messageId: string) => Promise<string | null>;
  onScreenshotError: (messageId: string) => void;
};

export const SupportMessageBubble = ({
  message,
  fetchedAtMs,
  nowMs,
  isRetrying = false,
  onRetryEmail,
  onOpenScreenshot,
  onRefreshScreenshotUrl,
  onScreenshotError,
}: SupportMessageBubbleProps) => {
  const isAdmin = message.author === "admin";
  const authorLabel = isAdmin ? supportCopy.fromAdmin : supportCopy.fromUser;
  const showRetry =
    isAdmin && message.emailStatus === "failed" && Boolean(onRetryEmail);

  const handleRetryEmail = () => {
    if (isRetrying) {
      return;
    }

    onRetryEmail?.(message.messageId);
  };

  const handleOpenScreenshot = (imageUrl: string) => {
    onOpenScreenshot(message.messageId, imageUrl);
  };

  const handleRefreshScreenshotUrl = () => {
    return onRefreshScreenshotUrl(message.messageId);
  };

  const handleScreenshotError = () => {
    onScreenshotError(message.messageId);
  };

  return (
    <Stack
      sx={{
        alignItems: isAdmin ? "flex-end" : "flex-start",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          maxWidth: "85%",
          bgcolor: isAdmin ? "primary.main" : "action.hover",
          color: isAdmin ? "primary.contrastText" : "text.primary",
        }}
      >
        <Typography variant="caption" component="p" sx={{ opacity: 0.8 }}>
          {authorLabel}
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          {message.body}
        </Typography>
      </Paper>
      <Box sx={{ mt: 0.75 }}>
        <SupportScreenshotThumb
          screenshotUrl={message.screenshotUrl}
          fetchedAtMs={fetchedAtMs}
          nowMs={nowMs}
          onOpen={handleOpenScreenshot}
          onRefreshUrl={handleRefreshScreenshotUrl}
          onImageError={handleScreenshotError}
        />
      </Box>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", mt: 0.5, flexWrap: "wrap" }}
      >
        <Typography variant="caption" color="text.secondary">
          {formatRelativeTime(message.createdAt, nowMs)}
        </Typography>
        {isAdmin ? (
          <SupportEmailStatusChip status={message.emailStatus} />
        ) : null}
        {showRetry ? (
          <Button
            type="button"
            size="small"
            variant="text"
            onClick={handleRetryEmail}
            disabled={isRetrying}
            tabIndex={0}
            aria-label={
              isRetrying ? supportCopy.retryingEmail : supportCopy.retryEmail
            }
          >
            {isRetrying ? supportCopy.retryingEmail : supportCopy.retryEmail}
          </Button>
        ) : null}
      </Stack>
    </Stack>
  );
};
