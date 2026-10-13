import type { ReactNode } from "react";
import { Box } from "@mui/material";

export type ResourceCardGridProps = {
  children: ReactNode;
  label: string;
};

export const ResourceCardGrid = ({ children, label }: ResourceCardGridProps) => {
  return (
    <Box
      component="ul"
      aria-label={label}
      sx={{
        display: "grid",
        gap: 3,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "1fr 1fr",
          md: "repeat(3, 1fr)",
        },
        listStyle: "none",
        p: 0,
        m: 0,
      }}
    >
      {children}
    </Box>
  );
};
