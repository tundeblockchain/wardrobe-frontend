import { Box, Button, CircularProgress, Container, Stack, Typography } from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";
import { SharePreviewCard } from "../components/share/SharePreviewCard";
import { SeoHead } from "../components/seo/SeoHead";
import { StatusCard } from "../components/StatusCard";
import { StoreCtaButtons } from "../components/landing/StoreCtaButtons";
import { SectionSurface } from "../components/surfaces/SectionSurface";
import { fetchSharePreview } from "../api/sharePreview";
import { getPublicAppEnv, type PublicAppEnv } from "../config/env";
import { areStoreLinksPublished } from "../config/storeCtas";
import { getPageSeo } from "../content/seo";
import { getSharePreviewStatusCopy } from "../content/sharePreviewCopy";
import { useSharePreview } from "../hooks/useSharePreview";
import { appPaths, getSharePath } from "../routes/paths";

export type SharePreviewPageProps = {
  env?: PublicAppEnv;
  token?: string;
  requestSharePreview?: typeof fetchSharePreview;
};

export const SharePreviewPage = ({
  env = getPublicAppEnv(),
  token: tokenProp,
  requestSharePreview,
}: SharePreviewPageProps) => {
  const { token: tokenFromParams } = useParams();
  const token = tokenProp ?? tokenFromParams;
  const sharePreviewState = useSharePreview({
    apiBaseUrl: env.apiBaseUrl,
    token,
    requestSharePreview,
  });
  const sharePath = token ? getSharePath(token) : appPaths.home;
  const pageSeo = getPageSeo({
    pathname: sharePath,
    env,
    siteOrigin: window.location.origin,
    sharePreview:
      sharePreviewState.status === "ok" ? sharePreviewState.preview : undefined,
    shareErrorKind:
      sharePreviewState.status === "ok" || sharePreviewState.status === "loading"
        ? undefined
        : sharePreviewState.status,
  });
  const storeLinksPublished = areStoreLinksPublished({
    appStoreUrl: env.appStoreUrl,
    playStoreUrl: env.playStoreUrl,
  });
  const trackingIds = {
    gaMeasurementId: env.gaMeasurementId,
    metaPixelId: env.metaPixelId,
  };

  const handleRetryClick = () => {
    sharePreviewState.handleRetry();
  };

  return (
    <>
      <SeoHead pageSeo={pageSeo} />
      <SectionSurface
        component="section"
        variant="hero"
        aria-label={
          sharePreviewState.status === "ok"
            ? sharePreviewState.preview.title
            : sharePreviewState.status === "loading"
              ? "Shared look"
              : getSharePreviewStatusCopy(sharePreviewState.status).title
        }
        sx={{
          py: { xs: 6, md: 8 },
        }}
      >
        <Container maxWidth="sm">
          <Stack spacing={4}>
            <Typography
              variant="overline"
              component="p"
              sx={{ color: "secondary.dark", letterSpacing: "0.16em" }}
            >
              {env.appName}
            </Typography>

            {sharePreviewState.status === "loading" ? (
              <Stack
                spacing={2}
                sx={{ alignItems: "center", py: 6 }}
                role="status"
                aria-live="polite"
                aria-label="Loading shared look"
              >
                <CircularProgress color="primary" aria-hidden="true" />
                <Typography
                  id="share-preview-heading"
                  variant="h1"
                  component="h1"
                >
                  Loading shared look
                </Typography>
              </Stack>
            ) : null}

            {sharePreviewState.status === "ok" ? (
              <SharePreviewCard preview={sharePreviewState.preview} />
            ) : null}

            {sharePreviewState.status !== "loading" &&
            sharePreviewState.status !== "ok" ? (
              <Stack spacing={2}>
                <StatusCard
                  headingComponent="h1"
                  title={getSharePreviewStatusCopy(sharePreviewState.status).title}
                  description={
                    getSharePreviewStatusCopy(sharePreviewState.status).description
                  }
                />
                {sharePreviewState.status === "network" ? (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleRetryClick}
                    tabIndex={0}
                    aria-label="Try loading this share again"
                  >
                    Try again
                  </Button>
                ) : null}
              </Stack>
            ) : null}

            <Box
              component="section"
              aria-labelledby="share-store-cta-heading"
            >
              <Stack spacing={2}>
                <Typography
                  id="share-store-cta-heading"
                  variant="h2"
                  component="h2"
                  sx={{ fontSize: { xs: "1.5rem", md: "1.75rem" } }}
                >
                  Open this look in {env.appName}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Download on the App Store or Google Play to catalog pieces,
                  compose outfits, and try looks on.
                </Typography>
                <StoreCtaButtons
                  appStoreUrl={env.appStoreUrl}
                  playStoreUrl={env.playStoreUrl}
                  placement="share"
                  trackingIds={trackingIds}
                />
                {storeLinksPublished ? null : (
                  <Typography variant="body2" color="text.secondary">
                    Store listings are not published yet. The buttons above remain
                    disabled placeholders.
                  </Typography>
                )}
              </Stack>
            </Box>

            <Button
              component={RouterLink}
              to={appPaths.home}
              variant="text"
              color="secondary"
              tabIndex={0}
              aria-label={`Back to ${env.appName}`}
            >
              Back to {env.appName}
            </Button>
          </Stack>
        </Container>
      </SectionSurface>
    </>
  );
};
