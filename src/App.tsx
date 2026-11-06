import { AnalyticsListener } from "./components/analytics/AnalyticsListener";
import { SeoRouteHead } from "./components/seo/SeoRouteHead";
import { resolveTrackingIds } from "./config/trackingEvents";
import { AppProviders } from "./providers/AppProviders";
import { AppRoutes } from "./routes/AppRoutes";

export const App = () => {
  const { gaMeasurementId, metaPixelId, tiktokPixelId } = resolveTrackingIds();

  return (
    <AppProviders>
      <SeoRouteHead />
      <AnalyticsListener
        gaMeasurementId={gaMeasurementId}
        metaPixelId={metaPixelId}
        tiktokPixelId={tiktokPixelId}
      />
      <AppRoutes />
    </AppProviders>
  );
};
