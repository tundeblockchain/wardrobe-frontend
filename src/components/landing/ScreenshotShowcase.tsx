import type { KeyboardEvent } from "react";
import { useState } from "react";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import {
  screenshotSlots,
  type ScreenshotSlotId,
} from "../../content/screenshotSlots";
import { PhoneFrame } from "./PhoneFrame";
import { ScreenshotGallery } from "./ScreenshotGallery";

export const ScreenshotShowcase = () => {
  const [selectedSlotId, setSelectedSlotId] = useState<ScreenshotSlotId>(
    screenshotSlots[0].id,
  );
  const selectedSlot =
    screenshotSlots.find((slot) => slot.id === selectedSlotId) ??
    screenshotSlots[0];

  if (!selectedSlot) {
    return null;
  }

  const handleSlotClick = (slotId: ScreenshotSlotId) => {
    setSelectedSlotId(slotId);
  };

  const handleSlotKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const lastIndex = screenshotSlots.length - 1;
    let nextIndex: number;

    if (event.key === "ArrowRight") {
      nextIndex = index === lastIndex ? 0 : index + 1;
    } else if (event.key === "ArrowLeft") {
      nextIndex = index === 0 ? lastIndex : index - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = lastIndex;
    } else {
      return;
    }

    event.preventDefault();
    const nextSlot = screenshotSlots[nextIndex];
    if (!nextSlot) {
      return;
    }

    setSelectedSlotId(nextSlot.id);
    const nextTab = document.getElementById(`screenshot-tab-${nextSlot.id}`);
    nextTab?.focus();
  };

  return (
    <Box
      component="section"
      id="screenshots"
      tabIndex={-1}
      aria-labelledby="screenshots-heading"
      sx={{
        py: { xs: 8, md: 10 },
        bgcolor: "background.default",
        color: "text.primary",
        scrollMarginTop: 88,
        outline: "none",
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 5, md: 8 }}
          sx={{ alignItems: { xs: "stretch", md: "flex-start" } }}
        >
          <Stack spacing={3} sx={{ flex: 1 }}>
            <Stack spacing={1}>
              <Typography
                id="screenshots-heading"
                variant="h2"
                component="h2"
                color="inherit"
              >
                See the app
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Labeled placeholders for Home, Wardrobe detail, Item detail,
                Outfits, Try-on, and Account. Real marketing PNGs drop in later
                without changing layout.
              </Typography>
            </Stack>
            <Box
              component="div"
              role="tablist"
              aria-label="App screenshot slots"
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              {screenshotSlots.map((slot, index) => {
                const isSelected = slot.id === selectedSlot.id;

                return (
                  <Button
                    key={slot.id}
                    id={`screenshot-tab-${slot.id}`}
                    role="tab"
                    aria-selected={isSelected}
                    aria-controls="screenshot-panel"
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => handleSlotClick(slot.id)}
                    onKeyDown={(event) => handleSlotKeyDown(event, index)}
                    variant={isSelected ? "contained" : "outlined"}
                    color="secondary"
                    size="small"
                    aria-label={`${slot.label} screenshot`}
                    sx={{
                      "&:focus-visible": {
                        outline: "2px solid",
                        outlineColor: "primary.main",
                        outlineOffset: 2,
                      },
                    }}
                  >
                    {slot.label}
                  </Button>
                );
              })}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {selectedSlot.description}
            </Typography>
          </Stack>
          <Box
            role="tabpanel"
            id="screenshot-panel"
            aria-labelledby={`screenshot-tab-${selectedSlot.id}`}
            sx={{ flex: "0 1 320px", width: "100%" }}
          >
            <PhoneFrame src={selectedSlot.src} alt={selectedSlot.alt} />
          </Box>
        </Stack>
        <Box sx={{ mt: { xs: 6, md: 8 } }}>
          <ScreenshotGallery
            selectedSlotId={selectedSlot.id}
            onSelectSlot={handleSlotClick}
          />
        </Box>
      </Container>
    </Box>
  );
};
