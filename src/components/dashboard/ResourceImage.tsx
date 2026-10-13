import { useState } from "react";
import { Box, Typography } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";
import CheckroomOutlined from "@mui/icons-material/CheckroomOutlined";

export type ResourceImageProps = {
  imageUrl?: string;
  alt: string;
  fallbackLabel: string;
  FallbackIcon?: SvgIconComponent;
};

const ResourceImageFallback = ({
  alt,
  fallbackLabel,
  FallbackIcon = CheckroomOutlined,
}: {
  alt: string;
  fallbackLabel: string;
  FallbackIcon?: SvgIconComponent;
}) => {
  return (
    <Box
      aria-label={`${alt} photo not available`}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        minHeight: 200,
        height: "100%",
        bgcolor: "secondary.light",
        color: "secondary.contrastText",
        px: 2,
      }}
    >
      <FallbackIcon aria-hidden="true" sx={{ fontSize: 40 }} />
      <Typography variant="body2" component="p" sx={{ textAlign: "center" }}>
        {fallbackLabel}
      </Typography>
    </Box>
  );
};

export const ResourceImage = ({
  imageUrl,
  alt,
  fallbackLabel,
  FallbackIcon = CheckroomOutlined,
}: ResourceImageProps) => {
  const [hasImageError, setHasImageError] = useState(false);

  const handleImageError = () => {
    setHasImageError(true);
  };

  if (!imageUrl || hasImageError) {
    return (
      <ResourceImageFallback
        alt={alt}
        fallbackLabel={fallbackLabel}
        FallbackIcon={FallbackIcon}
      />
    );
  }

  return (
    <Box
      component="img"
      src={imageUrl}
      alt={alt}
      onError={handleImageError}
      sx={{
        display: "block",
        width: "100%",
        height: "100%",
        minHeight: 200,
        objectFit: "cover",
        bgcolor: "background.default",
      }}
    />
  );
};
