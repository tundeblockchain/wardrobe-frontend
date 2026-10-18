import { Box } from "@mui/material";
import { LOGO_PATH } from "../../content/brandAssets";

export type BrandLogoProps = {
  alt?: string;
  height?: number | { xs: number; sm: number };
};

export const BrandLogo = ({
  alt = "",
  height = { xs: 40, sm: 48 },
}: BrandLogoProps) => {
  return (
    <Box
      component="img"
      src={LOGO_PATH}
      alt={alt}
      sx={{
        height,
        width: "auto",
        maxWidth: "100%",
        display: "block",
        borderRadius: 1,
        flexShrink: 0,
        alignSelf: "flex-start",
      }}
    />
  );
};
