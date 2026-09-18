import { AnalyticsListener } from "./components/analytics/AnalyticsListener";
import { SeoRouteHead } from "./components/seo/SeoRouteHead";
import { getPublicAppEnv } from "./config/env";
import { AppShell } from "./layout/AppShell";
import { AppProviders } from "./providers/AppProviders";
import { AppRoutes } from "./routes/AppRoutes";

export const App = () => {
  const { gaMeasurementId, metaPixelId } = getPublicAppEnv();

  return (
    <AppProviders>
      <SeoRouteHead />
      <AnalyticsListener
        gaMeasurementId={gaMeasurementId}
        metaPixelId={metaPixelId}
      />
      <AppShell>
        <AppRoutes />
      </AppShell>
    </AppProviders>
  );
};
