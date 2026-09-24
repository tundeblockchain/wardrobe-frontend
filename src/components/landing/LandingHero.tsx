import { Box, Button, Container, Stack, Typography } from "@mui/material";
import type { TrackingIds } from "../../config/tracking";
import {
  heroScreenshotSizes,
  screenshotSlots,
} from "../../content/screenshotSlots";
import { IPhoneFrame } from "../device/IPhoneFrame";
import { SectionSurface } from "../surfaces/SectionSurface";
import { ScreenshotThumbs } from "./ScreenshotThumbs";
import { StoreCtaButtons } from "./StoreCtaButtons";

export type LandingHeroProps = {
  appName: string;
  appStoreUrl: string | undefined;
  playStoreUrl: string | undefined;
  trackingIds?: TrackingIds;
};

export const LandingHero = ({
  appName,
  appStoreUrl,
  playStoreUrl,
  trackingIds,
}: LandingHeroProps) => {
  const [heroScreenshot, ...sampleScreenshots] = screenshotSlots;
  if (!heroScreenshot) {
    return null;
  }

  return (
    <SectionSurface
      component="section"
      variant="hero"
      aria-labelledby="landing-hero-heading"
      sx={{
        overflow: "hidden",
        bgcolor: "background.default",
        pt: { xs: 2.5, md: 3 },
        pb: { xs: 5, md: 6 },
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          width: 420,
          height: 420,
          borderRadius: "50%",
          bgcolor: "secondary.light",
          opacity: 0.22,
          top: { xs: -140, md: -80 },
          right: { xs: -160, md: -40 },
        }}
      />
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 4, md: 6 }}
          sx={{ alignItems: { xs: "stretch", md: "flex-start" } }}
        >
          <Stack spacing={2.5} sx={{ flex: 1, position: "relative", pt: 0 }}>
            <Typography
              variant="overline"
              component="p"
              sx={{ color: "secondary.dark", letterSpacing: "0.16em" }}
            >
              {appName}
            </Typography>
            <Typography
              id="landing-hero-heading"
              variant="h1"
              component="h1"
              sx={{ fontSize: { xs: "2.25rem", md: "3.25rem" } }}
            >
              Your closet, beautifully organized
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520 }}>
              Photograph pieces, build outfits, and try looks on — a burgundy-and-plum
              wardrobe companion for iOS and Android.
            </Typography>
            <StoreCtaButtons
              appStoreUrl={appStoreUrl}
              playStoreUrl={playStoreUrl}
              placement="hero"
              trackingIds={trackingIds}
            />
            <Box>
              <Button
                component="a"
                href="/#screenshots"
                variant="text"
                color="secondary"
                tabIndex={0}
                aria-label="See the screenshot showcase"
              >
                See the app
              </Button>
            </Box>
            <ScreenshotThumbs slots={sampleScreenshots} />
          </Stack>
          <Box
            sx={{
              flex: "0 1 320px",
              width: "100%",
              minWidth: 0,
              position: "relative",
            }}
          >
            <IPhoneFrame
              size="hero"
              src={heroScreenshot.src}
              sources={heroScreenshot.sources}
              alt={heroScreenshot.alt}
              maxWidth={300}
              sizes={heroScreenshotSizes}
              eager
            />
          </Box>
        </Stack>
      </Container>
    </SectionSurface>
  );
};
