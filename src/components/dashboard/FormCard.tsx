import type { ReactNode } from "react";
import { Paper } from "@mui/material";

export const FORM_CARD_TEST_ID = "form-card";
export const FORM_CARD_MAX_WIDTH = 600;

export type FormCardProps = {
  children: ReactNode;
};

export const FormCard = ({ children }: FormCardProps) => {
  return (
    <Paper
      elevation={0}
      data-testid={FORM_CARD_TEST_ID}
      sx={{
        width: "100%",
        maxWidth: FORM_CARD_MAX_WIDTH,
        mx: "auto",
        boxSizing: "border-box",
        p: { xs: 2.5, sm: 3 },
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {children}
    </Paper>
  );
};
