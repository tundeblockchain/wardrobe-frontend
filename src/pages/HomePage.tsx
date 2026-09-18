import { LandingHero } from "../components/landing/LandingHero";
import { FeatureSection } from "../components/landing/FeatureSection";
import { ScreenshotShowcase } from "../components/landing/ScreenshotShowcase";
import { StoreCtaSection } from "../components/landing/StoreCtaSection";
import { getPublicAppEnv } from "../config/env";

export const HomePage = () => {
  const { appName, appStoreUrl, playStoreUrl } = getPublicAppEnv();

  return (
    <>
      <LandingHero
        appName={appName}
        appStoreUrl={appStoreUrl}
        playStoreUrl={playStoreUrl}
      />
      <FeatureSection />
      <ScreenshotShowcase />
      <StoreCtaSection
        appName={appName}
        appStoreUrl={appStoreUrl}
        playStoreUrl={playStoreUrl}
      />
    </>
  );
};
