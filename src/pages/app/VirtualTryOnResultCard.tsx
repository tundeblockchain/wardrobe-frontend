import { Box, Paper } from "@mui/material";
import { ResourceImage } from "../../components/dashboard/ResourceImage";

export const VIRTUAL_TRY_ON_RESULT_TEST_ID = "virtual-try-on-result-card";

export type VirtualTryOnResultCardProps = {
  imageUrls: string[];
  resultLabel: string;
  onCardRef?: (node: HTMLElement | null) => void;
};

export const VirtualTryOnResultCard = ({
  imageUrls,
  resultLabel,
  onCardRef,
}: VirtualTryOnResultCardProps) => {
  const handleCardRef = (node: HTMLElement | null) => {
    onCardRef?.(node);
  };

  return (
    <Paper
      ref={handleCardRef}
      elevation={0}
      component="section"
      aria-label={resultLabel}
      data-testid={VIRTUAL_TRY_ON_RESULT_TEST_ID}
      sx={(theme) => ({
        width: "100%",
        minWidth: 0,
        alignSelf: "stretch",
        boxSizing: "border-box",
        p: { xs: 2.5, sm: 3 },
        border: 1,
        borderColor: theme.palette.divider,
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        overflow: "visible",
      })}
    >
      <Box
        component="ul"
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
          },
          gap: 2,
          listStyle: "none",
          p: 0,
          m: 0,
          width: "100%",
        }}
      >
        {imageUrls.map((imageUrl, index) => (
          <Box key={`${imageUrl}-${index}`} component="li">
            <Box
              sx={{
                aspectRatio: "3 / 4",
                overflow: "hidden",
                border: 1,
                borderColor: "divider",
              }}
            >
              <ResourceImage
                imageUrl={imageUrl}
                alt={`Virtual Try On render ${index + 1}`}
                fallbackLabel="Virtual Try On photo not available"
              />
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};
