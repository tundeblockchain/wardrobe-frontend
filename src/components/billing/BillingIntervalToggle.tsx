import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { BillingInterval } from "../../api/billing";
import { dashboardCopy } from "../../content/dashboardCopy";

export type BillingIntervalToggleProps = {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  disabled?: boolean;
};

const copy = dashboardCopy.billing;

export const BillingIntervalToggle = ({
  value,
  onChange,
  disabled = false,
}: BillingIntervalToggleProps) => {
  const handleChange = (
    _event: unknown,
    nextInterval: BillingInterval | null,
  ) => {
    if (!nextInterval) {
      return;
    }

    onChange(nextInterval);
  };

  return (
    <ToggleButtonGroup
      exclusive
      color="primary"
      value={value}
      onChange={handleChange}
      aria-label={copy.intervalLabel}
    >
      <ToggleButton
        value="monthly"
        tabIndex={0}
        aria-label={copy.intervalMonthlyAriaLabel}
        disabled={disabled}
      >
        {copy.intervalMonthlyLabel}
      </ToggleButton>
      <ToggleButton
        value="yearly"
        tabIndex={0}
        aria-label={copy.intervalYearlyAriaLabel}
        disabled={disabled}
      >
        {copy.intervalYearlyLabel}
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
