import { Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { StatusCard } from "../StatusCard";
import { DashboardNarrowContent } from "./DashboardNarrowContent";

export type ResourceUpgradeStateProps = {
  title: string;
  description: string;
  actionLabel: string;
  actionTo: string;
  actionAriaLabel: string;
};

export const ResourceUpgradeState = ({
  title,
  description,
  actionLabel,
  actionTo,
  actionAriaLabel,
}: ResourceUpgradeStateProps) => {
  return (
    <DashboardNarrowContent>
      <StatusCard title={title} description={description} />
      <Button
        component={RouterLink}
        to={actionTo}
        variant="contained"
        color="primary"
        tabIndex={0}
        aria-label={actionAriaLabel}
      >
        {actionLabel}
      </Button>
    </DashboardNarrowContent>
  );
};
