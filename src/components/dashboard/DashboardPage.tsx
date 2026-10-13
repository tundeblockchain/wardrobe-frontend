import type { ReactNode } from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import { getPublicAppEnv } from "../../config/env";
import { SectionSurface } from "../surfaces/SectionSurface";

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
    <SectionSurface
      component="article"
      variant="mist"
      aria-labelledby={headingId}
      sx={{
        py: { xs: 4, md: 6 },
        flex: 1,
      }}
    >
      <Container
        maxWidth={false}
        disableGutters
        data-testid="dashboard-page-container"
        sx={{
          width: "100%",
          maxWidth: "none",
          mx: 0,
          px: 3,
          boxSizing: "border-box",
        }}
      >
        <Stack spacing={3}>
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
              <Typography id={headingId} variant="h1" component="h1">
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
      </Container>
    </SectionSurface>
  );
};
