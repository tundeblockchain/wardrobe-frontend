import { IconButton } from "@mui/material";
import { supportCopy } from "../../../admin/supportCopy";
import { resolveScreenshotUrlForOpen } from "../../../admin/screenshotExpiry";

export type SupportScreenshotThumbProps = {
  screenshotUrl: string | null;
  fetchedAtMs: number;
  onOpen: (imageUrl: string) => void;
  onRefreshUrl: () => Promise<string | null>;
  onImageError: () => void;
  nowMs?: number;
};

export const SupportScreenshotThumb = ({
  screenshotUrl,
  fetchedAtMs,
  onOpen,
  onRefreshUrl,
  onImageError,
  nowMs,
}: SupportScreenshotThumbProps) => {
  if (!screenshotUrl) {
    return null;
  }

  const handleOpen = async () => {
    const url = await resolveScreenshotUrlForOpen({
      fetchedAtMs,
      currentUrl: screenshotUrl,
      nowMs,
      refresh: onRefreshUrl,
    });
    if (!url) {
      return;
    }

    onOpen(url);
  };

  const handleClick = () => {
    void handleOpen();
  };

  const handleKeyDown = (event: { key: string; preventDefault: () => void }) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    void handleOpen();
  };

  const handleImageError = () => {
    onImageError();
  };

  return (
    <IconButton
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={supportCopy.openScreenshot}
      sx={{
        p: 0.5,
        borderRadius: 1,
        alignSelf: "flex-start",
      }}
    >
      <img
        src={screenshotUrl}
        alt={supportCopy.screenshotAlt}
        onError={handleImageError}
        width={96}
        height={96}
        style={{
          display: "block",
          width: 96,
          height: 96,
          objectFit: "cover",
          borderRadius: 8,
        }}
      />
    </IconButton>
  );
};
