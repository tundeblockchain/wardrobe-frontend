import { useRef, useState } from "react";
import {
  assignBillingUrl,
  createCheckoutSession,
  getAlreadySubscribedMessage,
  isAlreadySubscribedError,
  readBillingSessionUrl,
  resolvePaidTierSource,
  type BillingSession,
  type CheckoutTier,
} from "../api/billing";
import { isApiError } from "../api/httpClient";
import type { Entitlement, PaidTier } from "../api/resourceTypes";
import { useApi } from "../api/useApi";
import { dashboardCopy } from "../content/dashboardCopy";

export type StartCheckoutFn = (tier: CheckoutTier) => Promise<BillingSession>;

export type CheckoutGetMeFn = () => Promise<Pick<Entitlement, "paidTier">>;

export type UseCheckoutActionOptions = {
  startCheckout?: StartCheckoutFn;
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
  handleCheckout: (tier: CheckoutTier) => Promise<void>;
};

const toCheckoutErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    const serverMessage = error.message.trim();
    if (serverMessage) {
      return serverMessage;
    }
  }

  return dashboardCopy.billing.errorFallback;
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

  const handleCheckout = async (tier: CheckoutTier) => {
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
      ((nextTier: CheckoutTier) => createCheckoutSession(api, nextTier));
    const getMe = options.getMe ?? api.getMe;

    try {
      const session = await startCheckout(tier);
      const url = readBillingSessionUrl(session);
      if (options.assignLocation) {
        options.assignLocation(url);
      } else {
        assignBillingUrl(url);
      }
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

      setError(toCheckoutErrorMessage(caughtError));
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
  };
};
