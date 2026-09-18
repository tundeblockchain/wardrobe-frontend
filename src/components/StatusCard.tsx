import { Paper, Typography } from "@mui/material";

export type StatusCardProps = {
  title: string;
  description: string;
};

export const StatusCard = ({ title, description }: StatusCardProps) => {
  if (!title) {
    return null;
  }

  return (
    <Paper
      component="article"
      elevation={0}
      aria-label={title}
      sx={{
        p: 3,
        border: 1,
        borderColor: "divider",
      }}
    >
      <Typography variant="h2" component="h2" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {description}
      </Typography>
    </Paper>
  );
};
