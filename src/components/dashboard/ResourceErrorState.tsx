import { Button, Stack } from "@mui/material";
import { StatusCard } from "../StatusCard";

export type ResourceErrorStateProps = {
  title: string;
  description: string;
  retryLabel: string;
  onRetry: () => void;
};

export const ResourceErrorState = ({
  title,
  description,
  retryLabel,
  onRetry,
}: ResourceErrorStateProps) => {
  const handleRetryClick = () => {
    onRetry();
  };

  return (
    <Stack spacing={2}>
      <StatusCard title={title} description={description} />
      <Button
        type="button"
        variant="outlined"
        color="primary"
        onClick={handleRetryClick}
        tabIndex={0}
        aria-label={retryLabel}
      >
        Try again
      </Button>
    </Stack>
  );
};
