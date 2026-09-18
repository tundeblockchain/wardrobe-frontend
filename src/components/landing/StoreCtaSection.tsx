import { Box, Container, Stack, Typography } from "@mui/material";
import { areStoreLinksPublished } from "../../config/storeCtas";
import { SectionSurface } from "../surfaces/SectionSurface";
import { StoreCtaButtons } from "./StoreCtaButtons";

export type StoreCtaSectionProps = {
  appName: string;
  appStoreUrl: string | undefined;
  playStoreUrl: string | undefined;
};

export const StoreCtaSection = ({
  appName,
  appStoreUrl,
  playStoreUrl,
}: StoreCtaSectionProps) => {
  const storeLinksPublished = areStoreLinksPublished({
    appStoreUrl,
    playStoreUrl,
  });

  return (
    <SectionSurface
      component="section"
      variant="blush"
      id="download"
      tabIndex={-1}
      aria-labelledby="download-heading"
      sx={{
        py: { xs: 8, md: 10 },
        color: "text.primary",
        scrollMarginTop: 88,
        outline: "none",
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={3} sx={{ alignItems: { xs: "stretch", sm: "center" } }}>
          <Typography
            id="download-heading"
            variant="h2"
            component="h2"
            color="inherit"
            sx={{ textAlign: { xs: "left", sm: "center" } }}
          >
            Get {appName}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              maxWidth: 560,
              textAlign: { xs: "left", sm: "center" },
            }}
          >
            Download on the App Store or Google Play. Buttons stay disabled until
            store URLs are set in the environment.
          </Typography>
          <Box>
            <StoreCtaButtons
              appStoreUrl={appStoreUrl}
              playStoreUrl={playStoreUrl}
            />
          </Box>
          {storeLinksPublished ? null : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                textAlign: { xs: "left", sm: "center" },
              }}
            >
              Store listings are not published yet. The buttons above remain
              disabled placeholders.
            </Typography>
          )}
        </Stack>
      </Container>
    </SectionSurface>
  );
};
