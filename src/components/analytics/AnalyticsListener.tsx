import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  canTrackGoogleAnalytics,
  canTrackMetaPixel,
  canTrackTikTokPixel,
} from "../../config/tracking";
import { trackSpaPageView } from "../../config/trackingEvents";

export type AnalyticsListenerProps = {
  gaMeasurementId: string | undefined;
  metaPixelId: string | undefined;
  tiktokPixelId: string | undefined;
};

export const AnalyticsListener = ({
  gaMeasurementId,
  metaPixelId,
  tiktokPixelId,
}: AnalyticsListenerProps) => {
  const location = useLocation();
  const shouldTrack =
    canTrackGoogleAnalytics(gaMeasurementId) ||
    canTrackMetaPixel(metaPixelId) ||
    canTrackTikTokPixel(tiktokPixelId);
  const lastTrackedPath = useRef<string | undefined>(undefined);
  const pageKey = `${location.pathname}${location.search}`;

  useEffect(() => {
    if (!shouldTrack) {
      return;
    }

    if (lastTrackedPath.current === pageKey) {
      return;
    }

    lastTrackedPath.current = pageKey;
    trackSpaPageView(
      {
        pathname: location.pathname,
        search: location.search,
      },
      { ids: { gaMeasurementId, metaPixelId, tiktokPixelId } },
    );
  }, [pageKey, shouldTrack, location.pathname, location.search, gaMeasurementId, metaPixelId, tiktokPixelId]);

  return null;
};
