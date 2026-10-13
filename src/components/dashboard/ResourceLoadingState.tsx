import { CircularProgress, Stack, Typography } from "@mui/material";

export type ResourceLoadingStateProps = {
  label: string;
};

export const ResourceLoadingState = ({ label }: ResourceLoadingStateProps) => {
  return (
    <Stack
      spacing={2}
      sx={{ alignItems: "center", py: { xs: 6, md: 8 } }}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <CircularProgress color="primary" aria-hidden="true" />
      <Typography variant="body1" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
};
