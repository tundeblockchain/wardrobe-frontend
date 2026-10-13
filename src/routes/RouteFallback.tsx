import { Box, CircularProgress, Typography } from "@mui/material";

export type RouteFallbackProps = {
  label?: string;
};

export const RouteFallback = ({
  label = "Loading page",
}: RouteFallbackProps) => {
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label={label}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        py: 8,
        minHeight: "40vh",
      }}
    >
      <CircularProgress aria-hidden />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
};
