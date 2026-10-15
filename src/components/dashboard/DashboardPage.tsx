import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { getPublicAppEnv } from "../../config/env";

export type DashboardPageProps = {
  headingId: string;
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
};

export const DashboardPage = ({
  headingId,
  title,
  description,
  children,
  actions,
}: DashboardPageProps) => {
  const { appName } = getPublicAppEnv();

  return (
    <Box
      component="article"
      aria-labelledby={headingId}
      data-testid="dashboard-page-container"
      sx={{
        width: "100%",
        maxWidth: "none",
        minWidth: 0,
        mx: 0,
        px: 0,
        boxSizing: "border-box",
      }}
    >
      <Stack spacing={3} sx={{ minWidth: 0, width: "100%" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            alignItems: { sm: "flex-start" },
            justifyContent: "space-between",
          }}
        >
          <Stack spacing={1} sx={{ minWidth: 0, maxWidth: 720 }}>
            <Typography
              variant="overline"
              component="p"
              sx={{ color: "secondary.dark", letterSpacing: "0.16em" }}
            >
              {appName}
            </Typography>
            <Typography
              id={headingId}
              variant="h1"
              component="h1"
              color="text.primary"
            >
              {title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {description}
            </Typography>
          </Stack>
          {actions ? (
            <Box sx={{ flexShrink: 0, pt: { sm: 4 } }}>{actions}</Box>
          ) : null}
        </Stack>
        {children}
      </Stack>
    </Box>
  );
};
