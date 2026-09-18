import type { PropsWithChildren } from "react";
import { Box } from "@mui/material";
import { SkipLink } from "../components/SkipLink";
import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";
import { AppMain } from "./AppMain";

type AppShellProps = PropsWithChildren;

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <SkipLink targetId="main-content" />
      <AppHeader />
      <AppMain>{children}</AppMain>
      <AppFooter />
    </Box>
  );
};
