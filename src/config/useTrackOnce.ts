import { useEffect, useRef } from "react";
import {
  trackEvent,
  type TrackingEventName,
  type TrackingParams,
} from "./trackingEvents";

export const useTrackOnce = (
  name: TrackingEventName,
  enabled: boolean,
  params?: TrackingParams,
): void => {
  const firedForThisMount = useRef(false);
  const paramsKey = JSON.stringify(params ?? {});

  useEffect(() => {
    if (!enabled || firedForThisMount.current) {
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled || firedForThisMount.current) {
        return;
      }

      firedForThisMount.current = true;
      trackEvent(name, params);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, name, params, paramsKey]);
};
