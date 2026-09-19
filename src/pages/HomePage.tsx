import { LandingHero } from "../components/landing/LandingHero";
import { FeatureSection } from "../components/landing/FeatureSection";
import { ScreenshotShowcase } from "../components/landing/ScreenshotShowcase";
import { StoreCtaSection } from "../components/landing/StoreCtaSection";
import { getPublicAppEnv } from "../config/env";

export const HomePage = () => {
  const { appName, appStoreUrl, playStoreUrl, gaMeasurementId, metaPixelId } =
    getPublicAppEnv();
  const trackingIds = { gaMeasurementId, metaPixelId };

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
