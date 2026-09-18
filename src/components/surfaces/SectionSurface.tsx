import type { ReactNode } from "react";
import { Box, type BoxProps } from "@mui/material";
import type { SectionSurfaceVariant } from "../../theme/wardrobeGradients";

export type SectionSurfaceProps = BoxProps & {
  variant: SectionSurfaceVariant;
  children: ReactNode;
};

export const SectionSurface = ({
  variant,
  sx,
  children,
  ...props
}: SectionSurfaceProps) => {
  return (
    <Box
      {...props}
      data-surface={variant}
      sx={[
        (theme) => ({
          position: "relative",
          backgroundColor: theme.palette.background.default,
          backgroundImage: theme.gradients[variant],
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
};
