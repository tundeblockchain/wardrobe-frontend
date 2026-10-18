import { Box, Button, Container, Stack, Typography } from "@mui/material";
import type { TrackingIds } from "../../config/tracking";
import {
  BANNER_ALT,
  BANNER_ASPECT_RATIO,
  BANNER_PATH,
} from "../../content/brandAssets";
import { screenshotSlots } from "../../content/screenshotSlots";
import { SectionSurface } from "../surfaces/SectionSurface";
import { ScreenshotThumbs } from "./ScreenshotThumbs";
import { StoreCtaButtons } from "./StoreCtaButtons";

export const LANDING_HERO_BANNER_TEST_ID = "landing-hero-banner";
export const LANDING_HERO_BANNER_FRAME_TEST_ID = "landing-hero-banner-frame";

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
  const [, ...sampleScreenshots] = screenshotSlots;

  return (
    <SectionSurface
      component="section"
      variant="hero"
      aria-labelledby="landing-hero-heading"
      sx={{
        overflowX: "hidden",
        overflowY: "hidden",
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
        <Stack spacing={{ xs: 3, md: 4 }} sx={{ minWidth: 0, maxWidth: "100%" }}>
          <Box
            data-testid={LANDING_HERO_BANNER_FRAME_TEST_ID}
            sx={{
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              boxSizing: "border-box",
              borderRadius: 2,
              overflow: "visible",
              bgcolor: "background.paper",
              p: { xs: 1, md: 1.5 },
            }}
          >
            <Box
              component="img"
              data-testid={LANDING_HERO_BANNER_TEST_ID}
              data-aspect-ratio={BANNER_ASPECT_RATIO}
              data-object-fit="contain"
              src={BANNER_PATH}
              alt={BANNER_ALT}
              sx={{
                display: "block",
                width: "100%",
                height: "auto",
                maxWidth: "100%",
                aspectRatio: BANNER_ASPECT_RATIO,
                objectFit: "contain",
                objectPosition: "center",
                borderRadius: 0,
                verticalAlign: "middle",
              }}
            />
          </Box>
          <Stack spacing={2.5} sx={{ position: "relative", minWidth: 0 }}>
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
        </Stack>
      </Container>
    </SectionSurface>
  );
};
