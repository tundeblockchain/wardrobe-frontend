import { Box, Button, Container, Stack, Typography } from "@mui/material";
import type { TrackingIds } from "../../config/tracking";
import { screenshotSlots } from "../../content/screenshotSlots";
import { SectionSurface } from "../surfaces/SectionSurface";
import { PhoneFrame } from "./PhoneFrame";
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
  const homeScreenshot = screenshotSlots[0];
  if (!homeScreenshot) {
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
        py: { xs: 6, md: 10 },
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
          spacing={{ xs: 6, md: 8 }}
          sx={{ alignItems: "center" }}
        >
          <Stack spacing={3} sx={{ flex: 1, position: "relative" }}>
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
          </Stack>
          <Box sx={{ flex: "0 1 320px", width: "100%", position: "relative" }}>
            <PhoneFrame
              src={homeScreenshot.src}
              alt={homeScreenshot.alt}
              maxWidth={300}
            />
          </Box>
        </Stack>
      </Container>
    </SectionSurface>
  );
};
