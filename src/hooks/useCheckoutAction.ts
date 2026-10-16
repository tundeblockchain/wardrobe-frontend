import { useRef, useState } from "react";
import {
  assignBillingUrl,
  createCheckoutSession,
  createPortalSession,
  DEFAULT_BILLING_INTERVAL,
  getAlreadySubscribedMessage,
  getBillingCheckoutErrorMessage,
  isAlreadySubscribedError,
  readBillingSessionUrl,
  resolvePaidTierSource,
  type BillingInterval,
  type BillingSession,
  type CheckoutTier,
} from "../api/billing";
import type { Entitlement, PaidTier } from "../api/resourceTypes";
import { useApi } from "../api/useApi";
import { dashboardCopy } from "../content/dashboardCopy";

export type StartCheckoutFn = (
  tier: CheckoutTier,
  interval?: BillingInterval,
) => Promise<BillingSession>;

export type StartPortalFn = () => Promise<BillingSession>;

export type CheckoutGetMeFn = () => Promise<Pick<Entitlement, "paidTier">>;

export type UseCheckoutActionOptions = {
  startCheckout?: StartCheckoutFn;
  startPortal?: StartPortalFn;
  getMe?: CheckoutGetMeFn;
  assignLocation?: (url: string) => void;
};

export type CheckoutActionState = {
  isStarting: boolean;
  error: string;
  alreadySubscribedMessage: string;
  existingPaidTier: PaidTier;
};

export type UseCheckoutActionResult = CheckoutActionState & {
  handleCheckout: (
    tier: CheckoutTier,
    interval?: BillingInterval,
  ) => Promise<void>;
  handlePortal: () => Promise<void>;
};

export const useCheckoutAction = (
  options: UseCheckoutActionOptions = {},
): UseCheckoutActionResult => {
  const api = useApi();
  const [isStarting, setIsStarting] = useState(false);
  const isStartingRef = useRef(false);
  const [error, setError] = useState("");
  const [alreadySubscribedMessage, setAlreadySubscribedMessage] = useState("");
  const [existingPaidTier, setExistingPaidTier] = useState<PaidTier>(null);

  const redirectToBillingSession = (session: BillingSession) => {
    const url = readBillingSessionUrl(session);
    if (options.assignLocation) {
      options.assignLocation(url);
      return;
    }

    assignBillingUrl(url);
  };

  const handleCheckout = async (
    tier: CheckoutTier,
    interval: BillingInterval = DEFAULT_BILLING_INTERVAL,
  ) => {
    if (isStartingRef.current) {
      return;
    }

    isStartingRef.current = true;
    setIsStarting(true);
    setError("");
    setAlreadySubscribedMessage("");
    setExistingPaidTier(null);

    const startCheckout =
      options.startCheckout ??
      ((nextTier: CheckoutTier, nextInterval?: BillingInterval) =>
        createCheckoutSession(api, nextTier, nextInterval));
    const getMe = options.getMe ?? api.getMe;

    try {
      const session = await startCheckout(tier, interval);
      redirectToBillingSession(session);
    } catch (caughtError) {
      if (isAlreadySubscribedError(caughtError)) {
        let paidTier: PaidTier = null;
        try {
          const me = await getMe();
          paidTier = me.paidTier ?? null;
        } catch {
          // Keep the 409 source when /me cannot be refreshed.
        }

        setExistingPaidTier(paidTier);
        setAlreadySubscribedMessage(
          getAlreadySubscribedMessage(
            resolvePaidTierSource(paidTier, caughtError),
          ),
        );
        return;
      }

      setError(
        getBillingCheckoutErrorMessage(
          caughtError,
          dashboardCopy.billing.errorFallback,
        ),
      );
    } finally {
      isStartingRef.current = false;
      setIsStarting(false);
    }
  };

  const handlePortal = async () => {
    if (isStartingRef.current) {
      return;
    }

    isStartingRef.current = true;
    setIsStarting(true);
    setError("");
    setAlreadySubscribedMessage("");

    const startPortal =
      options.startPortal ?? (() => createPortalSession(api));

    try {
      const session = await startPortal();
      redirectToBillingSession(session);
    } catch (caughtError) {
      setError(
        getBillingCheckoutErrorMessage(
          caughtError,
          dashboardCopy.settings.planManageErrorFallback,
        ),
      );
    } finally {
      isStartingRef.current = false;
      setIsStarting(false);
    }
  };

  return {
    isStarting,
    error,
    alreadySubscribedMessage,
    existingPaidTier,
    handleCheckout,
    handlePortal,
  };
};
