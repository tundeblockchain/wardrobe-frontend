import { Button, Stack } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { DashboardPage } from "../../components/dashboard/DashboardPage";
import { StatusCard } from "../../components/StatusCard";
import { dashboardCopy } from "../../content/dashboardCopy";
import { appPaths } from "../../routes/paths";

const copy = dashboardCopy.billing;

export const BillingCancelPage = () => {
  return (
    <DashboardPage
      headingId="billing-cancel-heading"
      title={copy.cancelTitle}
      description={copy.cancelDescription}
    >
      <Stack spacing={2}>
        <StatusCard
          title={copy.cancelTitle}
          description={copy.cancelDescription}
        />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            component={RouterLink}
            to={appPaths.app}
            variant="contained"
            color="primary"
            tabIndex={0}
            aria-label={copy.cancelDashboardAriaLabel}
          >
            {copy.cancelDashboardLabel}
          </Button>
          <Button
            component={RouterLink}
            to={appPaths.appSettingsPlan}
            variant="outlined"
            color="primary"
            tabIndex={0}
            aria-label={copy.cancelSettingsAriaLabel}
          >
            {copy.cancelSettingsLabel}
          </Button>
        </Stack>
      </Stack>
    </DashboardPage>
  );
};
