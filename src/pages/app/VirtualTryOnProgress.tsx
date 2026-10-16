import { LinearProgress, Stack, Typography } from "@mui/material";

export type VirtualTryOnProgressProps = {
  label: string;
};

export const VirtualTryOnProgress = ({ label }: VirtualTryOnProgressProps) => {
  return (
    <Stack
      spacing={2}
      sx={{ alignItems: "center", py: { xs: 6, md: 8 }, width: "100%" }}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <LinearProgress
        color="primary"
        sx={{ width: "100%", maxWidth: 360 }}
        aria-hidden="true"
      />
      <Typography variant="body1" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
};
