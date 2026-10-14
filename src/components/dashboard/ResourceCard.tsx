import type { KeyboardEvent, ReactNode } from "react";
import type { SvgIconComponent } from "@mui/icons-material";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { ResourceImage } from "./ResourceImage";

export const DEFAULT_RESOURCE_CARD_IMAGE_ASPECT_RATIO = "3 / 4";
export const WARDROBE_CARD_IMAGE_ASPECT_RATIO = "4 / 3";

export type ResourceCardProps = {
  to?: string;
  title: string;
  titleId: string;
  imageUrl?: string;
  imageAlt: string;
  imageAspectRatio?: string;
  fallbackLabel: string;
  FallbackIcon?: SvgIconComponent;
  onImageError?: () => void;
  chips?: string[];
  description?: string;
  children?: ReactNode;
};

export const ResourceCard = ({
  to,
  title,
  titleId,
  imageUrl,
  imageAlt,
  imageAspectRatio = DEFAULT_RESOURCE_CARD_IMAGE_ASPECT_RATIO,
  fallbackLabel,
  FallbackIcon,
  onImageError,
  chips = [],
  description,
  children,
}: ResourceCardProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    if (event.key === " ") {
      event.preventDefault();
      event.currentTarget.click();
    }
  };

  const content = (
    <>
      <Box
        data-testid="resource-card-image-frame"
        data-aspect-ratio={imageAspectRatio}
        sx={{ aspectRatio: imageAspectRatio, overflow: "hidden" }}
      >
        <ResourceImage
          imageUrl={imageUrl}
          alt={imageAlt}
          fallbackLabel={fallbackLabel}
          FallbackIcon={FallbackIcon}
          onImageError={onImageError}
        />
      </Box>
      <Stack spacing={1} sx={{ p: 2 }}>
        {chips.length > 0 ? (
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            {chips.map((chip) => (
              <Chip
                key={chip}
                label={chip}
                size="small"
                color="secondary"
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Stack>
        ) : null}
        <Typography id={titleId} variant="h3" component="h2">
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        ) : null}
        {children}
      </Stack>
    </>
  );

  if (!to) {
    return (
      <Paper
        component="article"
        elevation={0}
        aria-labelledby={titleId}
        sx={{
          overflow: "hidden",
          height: "100%",
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        {content}
      </Paper>
    );
  }

  return (
    <Paper
      component={RouterLink}
      to={to}
      elevation={0}
      tabIndex={0}
      aria-label={title}
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
      sx={{
        display: "block",
        overflow: "hidden",
        height: "100%",
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        color: "inherit",
        textDecoration: "none",
        "&:hover": {
          borderColor: "primary.light",
        },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 2,
        },
      }}
    >
      {content}
    </Paper>
  );
};
