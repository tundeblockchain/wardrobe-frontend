import {
  Box,
  Chip,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { formatRelativeTime } from "../../../admin/relativeTime";
import { supportCopy } from "../../../admin/supportCopy";
import type { SupportConversationSummary } from "../../../api/adminSupport";
import { SupportEmailStatusChip } from "./SupportEmailStatusChip";

export type SupportConversationRowProps = {
  conversation: SupportConversationSummary;
  selected: boolean;
  onSelect: (conversationId: string) => void;
  nowMs?: number;
};

export const SupportConversationRow = ({
  conversation,
  selected,
  onSelect,
  nowMs,
}: SupportConversationRowProps) => {
  const typeLabel =
    conversation.type === "bug" ? supportCopy.typeBug : supportCopy.typeQuery;
  const authorLabel =
    conversation.lastMessageAuthor === "admin"
      ? supportCopy.fromAdmin
      : supportCopy.fromUser;
  const preview = conversation.lastMessagePreview;
  const emailLabel = conversation.email || supportCopy.metadataMissing;

  const handleClick = () => {
    onSelect(conversation.conversationId);
  };

  const handleKeyDown = (event: { key: string; preventDefault: () => void }) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onSelect(conversation.conversationId);
  };

  return (
    <ListItemButton
      selected={selected}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={`${typeLabel} from ${emailLabel}`}
      sx={{ alignItems: "flex-start", py: 1.5 }}
    >
      <ListItemText
        primary={
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.5 }}
          >
            <Chip size="small" label={typeLabel} aria-label={typeLabel} />
            <Typography variant="subtitle2" component="span">
              {emailLabel}
            </Typography>
            {conversation.platform ? (
              <Typography variant="caption" color="text.secondary">
                {conversation.platform}
              </Typography>
            ) : null}
          </Stack>
        }
        slotProps={{
          primary: { component: "div" },
          secondary: { component: "div" },
        }}
        secondary={
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={preview ? undefined : { fontStyle: "italic" }}
            >
              {preview ? `${authorLabel}: ${preview}` : supportCopy.noPreview}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", mt: 0.5, flexWrap: "wrap" }}
            >
              <Typography variant="caption" color="text.secondary">
                {formatRelativeTime(conversation.lastMessageAt, nowMs)}
              </Typography>
              <SupportEmailStatusChip status={conversation.lastEmailStatus} />
            </Stack>
          </Box>
        }
      />
    </ListItemButton>
  );
};
