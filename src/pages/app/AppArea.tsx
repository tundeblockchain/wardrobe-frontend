import { Box } from "@mui/material";
import { SkipLink } from "../../components/SkipLink";
import { AppMain } from "../../layout/AppMain";
import { AppHomePage } from "./AppHomePage";

export const AppArea = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        backgroundImage: (theme) => theme.gradients.page,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <SkipLink targetId="main-content" />
      <AppMain>
        <AppHomePage />
      </AppMain>
    </Box>
  );
};
