import type { KeyboardEvent } from "react";
import AddOutlined from "@mui/icons-material/AddOutlined";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { dashboardCopy } from "../../content/dashboardCopy";
import { DEFAULT_RESOURCE_CARD_IMAGE_ASPECT_RATIO } from "./ResourceCard";

export const WISH_LIST_ADD_CARD_TEST_ID = "wish-list-add-card";

export type WishListAddCardProps = {
  onAdd: () => void;
};

export const WishListAddCard = ({ onAdd }: WishListAddCardProps) => {
  const copy = dashboardCopy.wishList;
  const titleId = "wish-list-add-card-title";

  const handleClick = () => {
    onAdd();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onAdd();
  };

  return (
    <Paper
      component="button"
      type="button"
      elevation={0}
      tabIndex={0}
      aria-label={copy.addCardAriaLabel}
      data-testid={WISH_LIST_ADD_CARD_TEST_ID}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      sx={(theme) => ({
        display: "block",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        textAlign: "left",
        cursor: "pointer",
        p: 0,
        color: "inherit",
        font: "inherit",
        border: 1,
        borderStyle: "dashed",
        borderColor: theme.palette.divider,
        bgcolor: theme.palette.background.paper,
        "&:hover": {
          borderColor: theme.palette.primary.light,
        },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: theme.palette.primary.main,
          outlineOffset: 2,
        },
      })}
    >
      <Box
        data-testid="wish-list-add-card-image-frame"
        data-aspect-ratio={DEFAULT_RESOURCE_CARD_IMAGE_ASPECT_RATIO}
        sx={{
          aspectRatio: DEFAULT_RESOURCE_CARD_IMAGE_ASPECT_RATIO,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "action.hover",
          color: "text.secondary",
        }}
      >
        <AddOutlined aria-hidden="true" sx={{ fontSize: 40 }} />
      </Box>
      <Stack spacing={0.5} sx={{ p: 1.5 }}>
        <Typography id={titleId} variant="h3" component="p">
          {copy.addCardLabel}
        </Typography>
      </Stack>
    </Paper>
  );
};
