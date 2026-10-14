import CheckroomOutlined from "@mui/icons-material/CheckroomOutlined";
import { Box, Stack, Typography } from "@mui/material";
import {
  getClothingCategoryLabel,
} from "../../api/resourceDisplay";
import type { SuggestedOutfitItemView } from "../../api/outfitRecommendations";
import { ResourceImage } from "./ResourceImage";

export type SuggestedOutfitItemsProps = {
  items: SuggestedOutfitItemView[];
  label: string;
};

export const SuggestedOutfitItems = ({
  items,
  label,
}: SuggestedOutfitItemsProps) => {
  return (
    <Box
      component="ul"
      aria-label={label}
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          sm: "repeat(3, minmax(0, 1fr))",
        },
        gap: 2,
        listStyle: "none",
        p: 0,
        m: 0,
      }}
    >
      {items.map((item) => {
        const itemLabel = item.name;
        return (
          <Box
            key={`${item.slot}:${item.itemId}`}
            component="li"
            sx={{ minWidth: 0 }}
          >
            <Stack spacing={1}>
              <Box
                sx={{
                  aspectRatio: "3 / 4",
                  overflow: "hidden",
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <ResourceImage
                  imageUrl={item.imageUrl}
                  alt={itemLabel}
                  fallbackLabel={`No photo for ${itemLabel}`}
                  FallbackIcon={CheckroomOutlined}
                />
              </Box>
              <Typography variant="body2" component="p">
                {itemLabel}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getClothingCategoryLabel(item.slot)}
              </Typography>
            </Stack>
          </Box>
        );
      })}
    </Box>
  );
};
