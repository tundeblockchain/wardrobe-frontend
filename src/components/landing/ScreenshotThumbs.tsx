import type { KeyboardEvent } from "react";
import { Box, Button } from "@mui/material";
import {
  thumbScreenshotSizes,
  type ScreenshotSlot,
} from "../../content/screenshotSlots";
import { IPhoneFrame } from "../device/IPhoneFrame";

export type ScreenshotThumbsProps = {
  slots: ScreenshotSlot[];
  href?: string;
  maxWidth?: number;
};

export const ScreenshotThumbs = ({
  slots,
  href = "/#screenshots",
  maxWidth = 88,
}: ScreenshotThumbsProps) => {
  if (slots.length === 0) {
    return null;
  }

  const handleThumbKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    if (event.key === " ") {
      event.preventDefault();
      event.currentTarget.click();
    }
  };

  return (
    <Box
      component="ul"
      aria-label="App screenshot samples"
      sx={{
        display: "grid",
        gap: 1,
        m: 0,
        p: 0,
        listStyle: "none",
        gridTemplateColumns: {
          xs: "repeat(3, minmax(0, 1fr))",
          sm: "repeat(5, minmax(0, 1fr))",
        },
        maxWidth: 480,
      }}
    >
      {slots.map((slot) => {
        return (
          <Box component="li" key={slot.id} sx={{ m: 0, minWidth: 0 }}>
            <Button
              component="a"
              href={href}
              tabIndex={0}
              aria-label={`${slot.label} screenshot sample`}
              onKeyDown={handleThumbKeyDown}
              sx={{
                display: "block",
                minWidth: 0,
                width: "100%",
                p: 0.5,
                borderRadius: 2,
                "&:focus-visible": {
                  outline: "2px solid",
                  outlineColor: "secondary.main",
                  outlineOffset: 2,
                },
              }}
            >
              <IPhoneFrame
                size="thumbnail"
                src={slot.src}
                sources={slot.sources}
                alt=""
                maxWidth={maxWidth}
                sizes={thumbScreenshotSizes}
              />
            </Button>
          </Box>
        );
      })}
    </Box>
  );
};
