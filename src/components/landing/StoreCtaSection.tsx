import { Box, Container, Stack, Typography } from "@mui/material";
import { areStoreLinksPublished } from "../../config/storeCtas";
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
    <Box
      component="section"
      id="download"
      tabIndex={-1}
      aria-labelledby="download-heading"
      sx={{
        py: { xs: 8, md: 10 },
        bgcolor: "primary.main",
        color: "primary.contrastText",
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
            sx={{
              color: "primary.contrastText",
              opacity: 0.9,
              maxWidth: 560,
              textAlign: { xs: "left", sm: "center" },
            }}
          >
            Download on the App Store or Google Play. Buttons stay disabled until
            store URLs are set in the environment.
          </Typography>
          <Box
            sx={{
              "& .MuiButton-outlined": {
                color: "primary.contrastText",
                borderColor: "primary.contrastText",
                "&.Mui-disabled": {
                  color: "primary.contrastText",
                  borderColor: "primary.contrastText",
                  opacity: 0.5,
                },
              },
              "& .MuiButton-contained": {
                bgcolor: "background.paper",
                color: "primary.main",
                "&:hover": {
                  bgcolor: "background.default",
                },
                "&.Mui-disabled": {
                  bgcolor: "background.paper",
                  color: "primary.main",
                  opacity: 0.5,
                },
              },
            }}
          >
            <StoreCtaButtons
              appStoreUrl={appStoreUrl}
              playStoreUrl={playStoreUrl}
            />
          </Box>
          {storeLinksPublished ? null : (
            <Typography
              variant="body2"
              sx={{
                color: "primary.contrastText",
                opacity: 0.8,
                textAlign: { xs: "left", sm: "center" },
              }}
            >
              Store listings are not published yet. The buttons above remain
              disabled placeholders.
            </Typography>
          )}
        </Stack>
      </Container>
    </Box>
  );
};
