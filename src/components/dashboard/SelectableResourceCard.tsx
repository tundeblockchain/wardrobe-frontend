import type { KeyboardEvent } from "react";
import type { SvgIconComponent } from "@mui/icons-material";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { ResourceImage } from "./ResourceImage";
import { DEFAULT_RESOURCE_CARD_IMAGE_ASPECT_RATIO } from "./ResourceCard";

export type SelectableCardSelection = "single" | "multi";

export type SelectableResourceCardProps = {
  title: string;
  titleId: string;
  imageUrl?: string;
  imageAlt: string;
  fallbackLabel: string;
  FallbackIcon?: SvgIconComponent;
  chips?: string[];
  selected: boolean;
  selection: SelectableCardSelection;
  onSelect: () => void;
};

export const SelectableResourceCard = ({
  title,
  titleId,
  imageUrl,
  imageAlt,
  fallbackLabel,
  FallbackIcon,
  chips = [],
  selected,
  selection,
  onSelect,
}: SelectableResourceCardProps) => {
  const handleClick = () => {
    onSelect();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onSelect();
  };

  const isMulti = selection === "multi";

  return (
    <Paper
      component="button"
      type="button"
      elevation={0}
      tabIndex={0}
      aria-label={title}
      aria-labelledby={titleId}
      aria-pressed={isMulti ? undefined : selected}
      aria-checked={isMulti ? selected : undefined}
      role={isMulti ? "checkbox" : "button"}
      data-selected={selected ? "true" : "false"}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      sx={(theme) => ({
        display: "block",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        textAlign: "left",
        cursor: "pointer",
        p: 0,
        color: "inherit",
        font: "inherit",
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: selected
          ? theme.palette.primary.main
          : theme.palette.divider,
        bgcolor: selected
          ? theme.palette.action.selected
          : theme.palette.background.paper,
        boxShadow: selected
          ? `inset 0 0 0 1px ${theme.palette.primary.main}`
          : "none",
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: theme.palette.primary.main,
          outlineOffset: 2,
        },
      })}
    >
      <Box
        data-testid="selectable-card-image-frame"
        data-aspect-ratio={DEFAULT_RESOURCE_CARD_IMAGE_ASPECT_RATIO}
        sx={{
          aspectRatio: DEFAULT_RESOURCE_CARD_IMAGE_ASPECT_RATIO,
          overflow: "hidden",
        }}
      >
        <ResourceImage
          imageUrl={imageUrl}
          alt={imageAlt}
          fallbackLabel={fallbackLabel}
          FallbackIcon={FallbackIcon}
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
        <Typography id={titleId} variant="h3" component="p">
          {title}
        </Typography>
      </Stack>
    </Paper>
  );
};
