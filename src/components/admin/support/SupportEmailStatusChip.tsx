import { Chip } from "@mui/material";
import { supportCopy } from "../../../admin/supportCopy";
import type { SupportEmailStatus } from "../../../api/adminSupport";

export type SupportEmailStatusChipProps = {
  status: SupportEmailStatus | null | undefined;
};

const STATUS_COPY: Record<
  SupportEmailStatus,
  { label: string; color: "success" | "error" | "default" }
> = {
  sent: { label: supportCopy.emailSent, color: "success" },
  failed: { label: supportCopy.emailFailed, color: "error" },
  skipped: { label: supportCopy.emailSkipped, color: "default" },
};

export const SupportEmailStatusChip = ({
  status,
}: SupportEmailStatusChipProps) => {
  if (!status) {
    return null;
  }

  const copy = STATUS_COPY[status];
  return (
    <Chip
      size="small"
      color={copy.color}
      label={copy.label}
      aria-label={copy.label}
    />
  );
};
