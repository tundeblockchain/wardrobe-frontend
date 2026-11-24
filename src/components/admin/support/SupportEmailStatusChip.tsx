import { Chip } from "@mui/material";
import { supportCopy } from "../../../admin/supportCopy";
import type { SupportEmailStatus } from "../../../api/adminSupport";

export type SupportEmailStatusChipProps = {
  status: SupportEmailStatus | null | undefined;
};

const getEmailStatusPresentation = (status: SupportEmailStatus) => {
  if (status === "sent") {
    return { label: supportCopy.emailSent, color: "success" as const };
  }

  if (status === "failed") {
    return { label: supportCopy.emailFailed, color: "error" as const };
  }

  if (status === "skipped") {
    return { label: supportCopy.emailSkipped, color: "default" as const };
  }

  return { label: supportCopy.emailPending, color: "default" as const };
};

export const SupportEmailStatusChip = ({
  status,
}: SupportEmailStatusChipProps) => {
  if (!status) {
    return null;
  }

  const copy = getEmailStatusPresentation(status);
  const isPending = copy.label === supportCopy.emailPending;

  return (
    <Chip
      size="small"
      color={copy.color}
      variant={isPending ? "outlined" : "filled"}
      label={copy.label}
      aria-label={copy.label}
      sx={isPending ? { color: "text.secondary" } : undefined}
    />
  );
};
