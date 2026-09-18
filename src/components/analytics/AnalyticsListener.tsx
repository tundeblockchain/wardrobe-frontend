import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  isGaMeasurementId,
  isMetaPixelId,
  trackSpaPageView,
} from "../../config/tracking";

export type AnalyticsListenerProps = {
  gaMeasurementId: string | undefined;
  metaPixelId: string | undefined;
};

export const AnalyticsListener = ({
  gaMeasurementId,
  metaPixelId,
}: AnalyticsListenerProps) => {
  const location = useLocation();
  const shouldTrack =
    isGaMeasurementId(gaMeasurementId) || isMetaPixelId(metaPixelId);
  const lastTrackedPath = useRef<string | undefined>(undefined);
  const pagePath = `${location.pathname}${location.search}`;

  useEffect(() => {
    if (!shouldTrack) {
      return;
    }

    if (lastTrackedPath.current === pagePath) {
      return;
    }

    lastTrackedPath.current = pagePath;
    trackSpaPageView({
      path: pagePath,
      title: document.title,
    });
  }, [pagePath, shouldTrack]);

  return null;
};
