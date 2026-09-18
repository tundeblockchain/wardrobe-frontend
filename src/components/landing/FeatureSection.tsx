import {
  Checkroom,
  FaceRetouchingNatural,
  Inventory2,
  Style,
} from "@mui/icons-material";
import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  featureItems,
  type FeatureIconId,
} from "../../content/featureItems";
import { SectionSurface } from "../surfaces/SectionSurface";

const featureIcons: Record<FeatureIconId, typeof Checkroom> = {
  catalog: Checkroom,
  outfits: Style,
  tryOn: FaceRetouchingNatural,
  details: Inventory2,
};

export const FeatureSection = () => {
  return (
    <SectionSurface
      component="section"
      variant="blush"
      id="features"
      tabIndex={-1}
      aria-labelledby="features-heading"
      sx={{
        py: { xs: 8, md: 10 },
        scrollMarginTop: 88,
        outline: "none",
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={1} sx={{ mb: 4, maxWidth: 640 }}>
          <Typography id="features-heading" variant="h2" component="h2">
            Made for getting dressed
          </Typography>
          <Typography variant="body1" color="text.secondary">
            A focused set of screens for cataloging, styling, and trying on what
            you already own.
          </Typography>
        </Stack>
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "repeat(4, 1fr)",
            },
          }}
        >
          {featureItems.map((featureItem) => {
            const Icon = featureIcons[featureItem.id];

            return (
              <Paper
                key={featureItem.id}
                component="article"
                elevation={0}
                aria-label={featureItem.title}
                sx={{
                  p: 3,
                  height: "100%",
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <Stack spacing={1.5}>
                  <Box
                    aria-hidden="true"
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                      color: "primary.main",
                    }}
                  >
                    <Icon />
                  </Box>
                  <Typography variant="h3" component="h3">
                    {featureItem.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {featureItem.description}
                  </Typography>
                </Stack>
              </Paper>
            );
          })}
        </Box>
      </Container>
    </SectionSurface>
  );
};
