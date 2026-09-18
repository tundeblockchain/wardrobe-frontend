import type { PropsWithChildren } from "react";
import { Box } from "@mui/material";

type AppMainProps = PropsWithChildren;

export const AppMain = ({ children }: AppMainProps) => {
  return (
    <Box
      component="main"
      id="main-content"
      tabIndex={-1}
      sx={{
        flex: 1,
        outline: "none",
      }}
    >
      {children}
    </Box>
  );
};
