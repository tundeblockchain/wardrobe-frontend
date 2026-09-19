import { useState } from "react";
import { Checkroom, Style } from "@mui/icons-material";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import {
  getShareResourceTypeLabel,
  type SharePreview,
  type ShareResourceType,
} from "../../api/sharePreview";

export type SharePreviewCardProps = {
  preview: SharePreview;
};

const resourceTypeIcons: Record<ShareResourceType, typeof Checkroom> = {
  ITEM: Checkroom,
  OUTFIT: Style,
};

const SharePreviewImageFallback = ({
  title,
  resourceType,
}: {
  title: string;
  resourceType: ShareResourceType;
}) => {
  const Icon = resourceTypeIcons[resourceType];
  const typeLabel = getShareResourceTypeLabel(resourceType);

  return (
    <Box
      aria-label={`${title} photo not available`}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        minHeight: 280,
        bgcolor: "secondary.light",
        color: "secondary.contrastText",
      }}
    >
      <Icon aria-hidden="true" sx={{ fontSize: 56 }} />
      <Typography variant="body2" component="p" sx={{ px: 2, textAlign: "center" }}>
        No photo for this {typeLabel.toLowerCase()}
      </Typography>
    </Box>
  );
};

const SharePreviewImage = ({
  imageUrl,
  title,
  resourceType,
}: {
  imageUrl: string;
  title: string;
  resourceType: ShareResourceType;
}) => {
  const [hasImageError, setHasImageError] = useState(false);

  const handleImageError = () => {
    setHasImageError(true);
  };

  if (hasImageError) {
    return <SharePreviewImageFallback title={title} resourceType={resourceType} />;
  }

  return (
    <Box
      component="img"
      src={imageUrl}
      alt={title}
      onError={handleImageError}
      sx={{
        display: "block",
        width: "100%",
        aspectRatio: "3 / 4",
        objectFit: "cover",
        bgcolor: "background.default",
      }}
    />
  );
};

export const SharePreviewCard = ({ preview }: SharePreviewCardProps) => {
  const typeLabel = getShareResourceTypeLabel(preview.resourceType);
  const headingId = "share-preview-title";

  return (
    <Paper
      component="article"
      elevation={0}
      aria-labelledby={headingId}
      sx={{
        overflow: "hidden",
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {preview.imageUrl ? (
        <SharePreviewImage
          key={preview.imageUrl}
          imageUrl={preview.imageUrl}
          title={preview.title}
          resourceType={preview.resourceType}
        />
      ) : (
        <SharePreviewImageFallback
          title={preview.title}
          resourceType={preview.resourceType}
        />
      )}
      <Stack spacing={1.5} sx={{ p: { xs: 2.5, md: 3 } }}>
        <Chip
          label={typeLabel}
          color="secondary"
          size="small"
          aria-label={`Shared type: ${typeLabel}`}
          sx={{ alignSelf: "flex-start", fontWeight: 600 }}
        />
        <Typography id={headingId} variant="h1" component="h1">
          {preview.title}
        </Typography>
      </Stack>
    </Paper>
  );
};
