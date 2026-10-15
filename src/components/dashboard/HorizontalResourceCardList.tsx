import type { ReactNode } from "react";
import { Box } from "@mui/material";

export const HORIZONTAL_RESOURCE_CARD_WIDTH_PX = 152;
export const HORIZONTAL_RESOURCE_CARD_LIST_TEST_ID =
  "horizontal-resource-card-list";

export type HorizontalResourceCardListProps = {
  children: ReactNode;
  label: string;
};

export const HorizontalResourceCardList = ({
  children,
  label,
}: HorizontalResourceCardListProps) => {
  return (
    <Box
      component="ul"
      aria-label={label}
      data-testid={HORIZONTAL_RESOURCE_CARD_LIST_TEST_ID}
      sx={{
        display: "flex",
        flexWrap: "nowrap",
        gap: 1.5,
        listStyle: "none",
        m: 0,
        minWidth: 0,
        overflowX: "auto",
        overflowY: "hidden",
        p: 0.75,
        width: "100%",
        maxWidth: "100%",
      }}
    >
      {children}
    </Box>
  );
};

export type HorizontalResourceCardItemProps = {
  children: ReactNode;
};

export const HorizontalResourceCardItem = ({
  children,
}: HorizontalResourceCardItemProps) => {
  return (
    <Box
      component="li"
      sx={{
        flex: `0 0 ${HORIZONTAL_RESOURCE_CARD_WIDTH_PX}px`,
        minWidth: HORIZONTAL_RESOURCE_CARD_WIDTH_PX,
        width: HORIZONTAL_RESOURCE_CARD_WIDTH_PX,
      }}
    >
      {children}
    </Box>
  );
};
