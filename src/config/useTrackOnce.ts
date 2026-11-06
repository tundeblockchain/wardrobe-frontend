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
  const fired = useRef(false);
  const paramsKey = JSON.stringify(params ?? {});

  useEffect(() => {
    if (!enabled || fired.current) {
      return;
    }

    fired.current = true;
    trackEvent(name, params);
  }, [enabled, name, params, paramsKey]);
};
