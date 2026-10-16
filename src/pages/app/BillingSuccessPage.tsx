import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button, Stack } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { ME_PATH } from "../../api/authenticatedApi";
import type { Entitlement } from "../../api/resourceTypes";
import { useApi } from "../../api/useApi";
import { DashboardPage } from "../../components/dashboard/DashboardPage";
import { dashboardCopy } from "../../content/dashboardCopy";
import { appPaths } from "../../routes/paths";

export const BILLING_SUCCESS_POLL_INTERVAL_MS = 2_500;
export const BILLING_SUCCESS_MAX_ATTEMPTS = 8;

export type BillingSuccessGetMeFn = (
  signal?: AbortSignal,
) => Promise<Pick<Entitlement, "paidTier">>;

export type BillingSuccessPageProps = {
  getMe?: BillingSuccessGetMeFn;
  pollIntervalMs?: number;
  maxAttempts?: number;
};

type SuccessView = "polling" | "ready" | "timeout";

const copy = dashboardCopy.billing;

export const BillingSuccessPage = ({
  getMe: getMeProp,
  pollIntervalMs = BILLING_SUCCESS_POLL_INTERVAL_MS,
  maxAttempts = BILLING_SUCCESS_MAX_ATTEMPTS,
}: BillingSuccessPageProps) => {
  const api = useApi();
  const [round, setRound] = useState(0);
  const [view, setView] = useState<SuccessView>("polling");
  const getMeRef = useRef<BillingSuccessGetMeFn>(
    getMeProp ?? ((signal) => api.request<Entitlement>(ME_PATH, { signal })),
  );

  useEffect(() => {
    getMeRef.current =
      getMeProp ?? ((signal) => api.request<Entitlement>(ME_PATH, { signal }));
  }, [api, getMeProp]);

  useEffect(() => {
    const abortController = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    let attempt = 0;

    const isStopped = (): boolean => {
      return cancelled || abortController.signal.aborted;
    };

    const runAttempt = async () => {
      if (isStopped()) {
        return;
      }

      attempt += 1;
      try {
        const me = await getMeRef.current(abortController.signal);
        if (isStopped()) {
          return;
        }

        if (me.paidTier) {
          setView("ready");
          return;
        }
      } catch {
        if (isStopped()) {
          return;
        }
      }

      if (attempt >= maxAttempts) {
        setView("timeout");
        return;
      }

      timeoutId = setTimeout(() => {
        void runAttempt();
      }, pollIntervalMs);
    };

    void runAttempt();

    return () => {
      cancelled = true;
      abortController.abort();
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [round, pollIntervalMs, maxAttempts]);

  const handleRetry = () => {
    setView("polling");
    setRound((currentRound) => currentRound + 1);
  };

  const handleRetryKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleRetry();
  };

  const title =
    view === "ready"
      ? copy.successReadyTitle
      : view === "timeout"
        ? copy.successTimeoutTitle
        : copy.successProcessingTitle;
  const description =
    view === "ready"
      ? copy.successReadyDescription
      : view === "timeout"
        ? copy.successTimeoutDescription
        : copy.successProcessingDescription;

  return (
    <DashboardPage
      headingId="billing-success-heading"
      title={title}
      description={description}
    >
      <Stack spacing={2}>
        {view === "timeout" ? (
          <Button
            type="button"
            variant="contained"
            color="primary"
            onClick={handleRetry}
            onKeyDown={handleRetryKeyDown}
            tabIndex={0}
            aria-label={copy.successRetryAriaLabel}
          >
            {copy.successRetryLabel}
          </Button>
        ) : null}
        {view === "ready" ? (
          <Button
            component={RouterLink}
            to={appPaths.app}
            variant="contained"
            color="primary"
            tabIndex={0}
            aria-label={copy.successDashboardAriaLabel}
          >
            {copy.successDashboardLabel}
          </Button>
        ) : null}
      </Stack>
    </DashboardPage>
  );
};
