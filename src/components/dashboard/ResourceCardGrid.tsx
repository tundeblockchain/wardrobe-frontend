import type { ReactNode } from "react";
import { Box } from "@mui/material";

export const RESOURCE_CARD_MIN_WIDTH_PX = 220;
export const RESOURCE_CARD_MAX_WIDTH_PX = 280;
export const RESOURCE_CARD_GRID_COLUMNS = `repeat(auto-fill, minmax(min(100%, ${RESOURCE_CARD_MIN_WIDTH_PX}px), ${RESOURCE_CARD_MAX_WIDTH_PX}px))`;

export type ResourceCardGridProps = {
  children: ReactNode;
  label: string;
};

export const ResourceCardGrid = ({ children, label }: ResourceCardGridProps) => {
  return (
    <Box
      component="ul"
      aria-label={label}
      data-testid="resource-card-grid"
      sx={{
        display: "grid",
        gap: 3,
        gridTemplateColumns: RESOURCE_CARD_GRID_COLUMNS,
        justifyContent: "start",
        listStyle: "none",
        p: 0,
        m: 0,
        width: "100%",
      }}
    >
      {children}
    </Box>
  );
};
