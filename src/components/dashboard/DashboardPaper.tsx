import type { ReactNode } from "react";
import { Box, Paper } from "@mui/material";
import { DashboardPaperContext } from "./dashboardPaperContext";
import { getDashboardPaperBoxShadow } from "./dashboardPaperShadow";

export const DASHBOARD_PAPER_TEST_ID = "dashboard-paper";
export const DASHBOARD_PAPER_GUTTER_TEST_ID = "dashboard-paper-gutter";
export const DASHBOARD_PAPER_MAX_WIDTH = 960;
export {
  DASHBOARD_PAPER_DARK_EMPHASIS_SHADOW,
  DASHBOARD_PAPER_DARK_SHADOW,
  DASHBOARD_PAPER_LIGHT_EMPHASIS_SHADOW,
  DASHBOARD_PAPER_LIGHT_SHADOW,
} from "./dashboardPaperShadow";

export type DashboardPaperProps = {
  children: ReactNode;
};

export const DashboardPaper = ({ children }: DashboardPaperProps) => {
  return (
    <Box
      data-testid={DASHBOARD_PAPER_GUTTER_TEST_ID}
      sx={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        minWidth: 0,
        width: "100%",
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, md: 3 },
        boxSizing: "border-box",
      }}
    >
      <Paper
        elevation={0}
        data-testid={DASHBOARD_PAPER_TEST_ID}
        sx={(theme) => ({
          width: "100%",
          maxWidth: DASHBOARD_PAPER_MAX_WIDTH,
          minWidth: 0,
          mx: "auto",
          boxSizing: "border-box",
          p: { xs: 2, sm: 3 },
          overflow: "visible",
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: getDashboardPaperBoxShadow(theme.palette.mode),
        })}
      >
        <DashboardPaperContext.Provider value={true}>
          {children}
        </DashboardPaperContext.Provider>
      </Paper>
    </Box>
  );
};
