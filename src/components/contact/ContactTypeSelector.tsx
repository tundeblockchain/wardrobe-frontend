import {
  FormControl,
  FormHelperText,
  FormLabel,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import type { FeedbackType } from "../../api/contact";

export type ContactTypeSelectorProps = {
  value: FeedbackType;
  onChange: (value: FeedbackType) => void;
  error?: string;
  disabled?: boolean;
};

export const ContactTypeSelector = ({
  value,
  onChange,
  error,
  disabled = false,
}: ContactTypeSelectorProps) => {
  const handleChange = (
    _event: unknown,
    nextType: FeedbackType | null,
  ) => {
    if (!nextType) {
      return;
    }

    onChange(nextType);
  };

  return (
    <FormControl error={Boolean(error)} fullWidth disabled={disabled}>
      <FormLabel id="contact-type-label">What is this about?</FormLabel>
      <ToggleButtonGroup
        exclusive
        color="primary"
        value={value}
        onChange={handleChange}
        aria-labelledby="contact-type-label"
        aria-label="What is this about?"
        sx={{
          mt: 1,
          width: "100%",
          "& .MuiToggleButton-root": {
            flex: 1,
            py: 1.25,
            textTransform: "none",
            fontWeight: 600,
          },
        }}
      >
        <ToggleButton
          value="bug"
          tabIndex={0}
          aria-label="Bug report"
          disabled={disabled}
        >
          Bug report
        </ToggleButton>
        <ToggleButton
          value="query"
          tabIndex={0}
          aria-label="Question"
          disabled={disabled}
        >
          Question
        </ToggleButton>
      </ToggleButtonGroup>
      {error ? <FormHelperText>{error}</FormHelperText> : null}
    </FormControl>
  );
};
