import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { supportCopy } from "../../../admin/supportCopy";

export type SupportScreenshotViewerProps = {
  open: boolean;
  imageUrl: string | null;
  onClose: () => void;
  onImageError: () => void;
};

export const SupportScreenshotViewer = ({
  open,
  imageUrl,
  onClose,
  onImageError,
}: SupportScreenshotViewerProps) => {
  const handleClose = () => {
    onClose();
  };

  const handleImageError = () => {
    onImageError();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="support-screenshot-title"
    >
      <DialogTitle id="support-screenshot-title">
        {supportCopy.screenshotViewerTitle}
      </DialogTitle>
      <DialogContent>
        {imageUrl ? (
          <BoxImage
            src={imageUrl}
            alt={supportCopy.screenshotAlt}
            onError={handleImageError}
          />
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button
          type="button"
          onClick={handleClose}
          tabIndex={0}
          aria-label={supportCopy.closeScreenshot}
        >
          {supportCopy.closeScreenshot}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const BoxImage = ({
  src,
  alt,
  onError,
}: {
  src: string;
  alt: string;
  onError: () => void;
}) => {
  return (
    <img
      src={src}
      alt={alt}
      onError={onError}
      style={{
        display: "block",
        width: "100%",
        height: "auto",
        maxHeight: "70vh",
        objectFit: "contain",
      }}
    />
  );
};
