import { LandingHero } from "../components/landing/LandingHero";
import { FeatureSection } from "../components/landing/FeatureSection";
import { ScreenshotShowcase } from "../components/landing/ScreenshotShowcase";
import { StoreCtaSection } from "../components/landing/StoreCtaSection";
import { getPublicAppEnv } from "../config/env";
import { resolveTrackingIds } from "../config/trackingEvents";

export const HomePage = () => {
  const { appName, appStoreUrl, playStoreUrl } = getPublicAppEnv();
  const trackingIds = resolveTrackingIds();

  return (
    <>
      <LandingHero
        appName={appName}
        appStoreUrl={appStoreUrl}
        playStoreUrl={playStoreUrl}
        trackingIds={trackingIds}
      />
      <FeatureSection />
      <ScreenshotShowcase />
      <StoreCtaSection
        appName={appName}
        appStoreUrl={appStoreUrl}
        playStoreUrl={playStoreUrl}
        trackingIds={trackingIds}
      />
    </>
  );
};
