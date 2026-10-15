import type { KeyboardEvent } from "react";
import StyleOutlined from "@mui/icons-material/StyleOutlined";
import { Box, Button } from "@mui/material";
import {
  getRecommendationReason,
  getRecommendationTitle,
  type SuggestedOutfitView,
} from "../../api/outfitRecommendations";
import { dashboardCopy } from "../../content/dashboardCopy";
import { ResourceCard } from "./ResourceCard";

export type SuggestedOutfitCardProps = {
  view: SuggestedOutfitView;
  index: number;
  onOpen?: (view: SuggestedOutfitView) => void;
  onSave?: (view: SuggestedOutfitView) => void;
};

const getOutfitItemCountLabel = (count: number): string => {
  if (count === 1) {
    return "1 item";
  }

  return `${count} items`;
};

export const SuggestedOutfitCard = ({
  view,
  index,
  onOpen,
  onSave,
}: SuggestedOutfitCardProps) => {
  const copy = dashboardCopy.recommendations;
  const title = getRecommendationTitle(view.recommendation);
  const reason = getRecommendationReason(view.recommendation);
  const titleId = `suggested-outfit-${index}-title`;
  const coverItem = view.items[0];

  const handleOpen = () => {
    onOpen?.(view);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
    if (!onOpen) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleOpen();
  };

  const handleSaveClick = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    onSave?.(view);
  };

  return (
    <Box
      component="li"
      sx={{ minWidth: 0 }}
      onClick={onOpen ? handleOpen : undefined}
      onKeyDown={onOpen ? handleKeyDown : undefined}
    >
      <ResourceCard
        title={title}
        titleId={titleId}
        imageUrl={coverItem?.imageUrl}
        imageAlt={coverItem?.name ?? title}
        fallbackLabel={`No photo for ${title}`}
        FallbackIcon={StyleOutlined}
        chips={[getOutfitItemCountLabel(view.items.length)]}
        description={reason}
      >
        {onSave ? (
          <Button
            type="button"
            variant="contained"
            color="primary"
            tabIndex={0}
            aria-label={`${copy.saveAriaLabel}: ${title}`}
            onClick={handleSaveClick}
          >
            {copy.saveLabel}
          </Button>
        ) : null}
      </ResourceCard>
    </Box>
  );
};
