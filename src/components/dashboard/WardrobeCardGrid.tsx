import CheckroomOutlined from "@mui/icons-material/CheckroomOutlined";
import { Box } from "@mui/material";
import { getWardrobeImageUrl } from "../../api/resourceDisplay";
import type { Wardrobe } from "../../api/resourceTypes";
import { getAppWardrobePath } from "../../routes/paths";
import { ResourceCard, WARDROBE_CARD_IMAGE_ASPECT_RATIO } from "./ResourceCard";
import { ResourceCardGrid } from "./ResourceCardGrid";

export type WardrobeCardGridProps = {
  wardrobes: Wardrobe[];
};

export const WardrobeCardGrid = ({ wardrobes }: WardrobeCardGridProps) => {
  return (
    <ResourceCardGrid label="Wardrobes">
      {wardrobes.map((wardrobe) => {
        const titleId = `wardrobe-${wardrobe.wardrobeId}-title`;
        return (
          <Box key={wardrobe.wardrobeId} component="li" sx={{ minWidth: 0 }}>
            <ResourceCard
              to={getAppWardrobePath(wardrobe.wardrobeId)}
              title={wardrobe.name}
              titleId={titleId}
              imageUrl={getWardrobeImageUrl(wardrobe)}
              imageAlt={wardrobe.name}
              imageAspectRatio={WARDROBE_CARD_IMAGE_ASPECT_RATIO}
              fallbackLabel="No photo for this wardrobe"
              FallbackIcon={CheckroomOutlined}
              description="Open this wardrobe to see its clothing items."
            />
          </Box>
        );
      })}
    </ResourceCardGrid>
  );
};
