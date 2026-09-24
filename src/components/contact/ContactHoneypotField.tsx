import type { ChangeEvent } from "react";
import { Box, TextField } from "@mui/material";

export type ContactHoneypotFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export const ContactHoneypotField = ({
  value,
  onChange,
}: ContactHoneypotFieldProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <Box
      data-honeypot="company"
      aria-hidden="true"
      sx={{
        position: "absolute",
        left: "-10000px",
        top: "auto",
        width: "1px",
        height: "1px",
        overflow: "hidden",
      }}
    >
      <TextField
        name="company"
        label="Company"
        value={value}
        onChange={handleChange}
        autoComplete="off"
        variant="outlined"
        slotProps={{
          htmlInput: {
            tabIndex: -1,
            autoComplete: "off",
            "aria-hidden": true,
          },
        }}
      />
    </Box>
  );
};
