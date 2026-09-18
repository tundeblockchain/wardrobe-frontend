import { Box, Button, Stack, Typography } from "@mui/material";
import {
  screenshotSlots,
  type ScreenshotSlotId,
} from "../../content/screenshotSlots";
import { PhoneFrame } from "./PhoneFrame";

export type ScreenshotGalleryProps = {
  selectedSlotId: ScreenshotSlotId;
  onSelectSlot: (slotId: ScreenshotSlotId) => void;
};

export const ScreenshotGallery = ({
  selectedSlotId,
  onSelectSlot,
}: ScreenshotGalleryProps) => {
  const handleSlotClick = (slotId: ScreenshotSlotId) => {
    onSelectSlot(slotId);
  };

  return (
    <Box
      component="ul"
      aria-label="Labeled screenshot placeholders"
      sx={{
        display: "grid",
        gap: 2,
        m: 0,
        p: 0,
        listStyle: "none",
        gridTemplateColumns: {
          xs: "1fr 1fr",
          md: "repeat(3, 1fr)",
          lg: "repeat(6, 1fr)",
        },
      }}
    >
      {screenshotSlots.map((slot) => {
        const isSelected = slot.id === selectedSlotId;

        return (
          <Box component="li" key={slot.id} sx={{ m: 0 }}>
            <Button
              onClick={() => handleSlotClick(slot.id)}
              tabIndex={0}
              aria-label={`${slot.label} placeholder screenshot`}
              aria-pressed={isSelected}
              sx={{
                display: "block",
                width: "100%",
                p: 1,
                borderRadius: 2,
                textAlign: "center",
                color: "inherit",
                border: 2,
                borderColor: isSelected ? "secondary.light" : "transparent",
                "&:focus-visible": {
                  outline: "2px solid",
                  outlineColor: "secondary.light",
                  outlineOffset: 2,
                },
              }}
            >
              <Stack spacing={1} sx={{ alignItems: "center" }}>
                <PhoneFrame src={slot.src} alt="" maxWidth={160} />
                <Typography
                  component="span"
                  variant="caption"
                  sx={{ color: "primary.contrastText", fontWeight: 600 }}
                >
                  {slot.label}
                </Typography>
              </Stack>
            </Button>
          </Box>
        );
      })}
    </Box>
  );
};
