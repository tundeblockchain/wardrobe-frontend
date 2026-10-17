import type { ReactNode } from "react";
import { Box, Stack } from "@mui/material";

export const DASHBOARD_NARROW_CONTENT_TEST_ID = "dashboard-narrow-content";
export const DASHBOARD_NARROW_CONTENT_MAX_WIDTH = 520;

export type DashboardNarrowContentProps = {
  children: ReactNode;
};

export const DashboardNarrowContent = ({
  children,
}: DashboardNarrowContentProps) => {
  return (
    <Box
      data-testid={DASHBOARD_NARROW_CONTENT_TEST_ID}
      sx={{
        width: "100%",
        maxWidth: DASHBOARD_NARROW_CONTENT_MAX_WIDTH,
        minWidth: 0,
        alignSelf: "center",
        mx: "auto",
        boxSizing: "border-box",
      }}
    >
      <Stack
        spacing={2}
        sx={{
          width: "100%",
          minWidth: 0,
          alignItems: "flex-start",
          "& .MuiPaper-root": {
            width: "100%",
            alignSelf: "stretch",
            boxSizing: "border-box",
          },
          "& .MuiStack-root": {
            width: "100%",
            minWidth: 0,
          },
          "& .MuiButton-root": {
            width: "auto",
            alignSelf: "flex-start",
            flexShrink: 0,
          },
        }}
      >
        {children}
      </Stack>
    </Box>
  );
};
