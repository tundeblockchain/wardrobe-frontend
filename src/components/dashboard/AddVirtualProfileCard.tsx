import type { KeyboardEvent } from "react";
import PersonAddAltOutlined from "@mui/icons-material/PersonAddAltOutlined";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { dashboardCopy } from "../../content/dashboardCopy";
import { appPaths } from "../../routes/paths";
import { DEFAULT_RESOURCE_CARD_IMAGE_ASPECT_RATIO } from "./ResourceCard";

export const ADD_VIRTUAL_PROFILE_CARD_TEST_ID = "add-virtual-profile-card";

export const AddVirtualProfileCard = () => {
  const copy = dashboardCopy.virtualProfiles;
  const titleId = "add-virtual-profile-card-title";

  const handleKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    if (event.key === " ") {
      event.preventDefault();
      event.currentTarget.click();
    }
  };

  return (
    <Paper
      component={RouterLink}
      to={appPaths.appVirtualProfileNew}
      elevation={1}
      tabIndex={0}
      aria-label={copy.addAriaLabel}
      data-testid={ADD_VIRTUAL_PROFILE_CARD_TEST_ID}
      onKeyDown={handleKeyDown}
      sx={(theme) => ({
        display: "block",
        overflow: "hidden",
        height: "100%",
        color: "inherit",
        textDecoration: "none",
        border: 1,
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
        data-testid="add-virtual-profile-card-image-frame"
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
        <PersonAddAltOutlined aria-hidden="true" sx={{ fontSize: 40 }} />
      </Box>
      <Stack spacing={1} sx={{ p: 2 }}>
        <Typography id={titleId} variant="h3" component="p">
          {copy.addLabel}
        </Typography>
      </Stack>
    </Paper>
  );
};
