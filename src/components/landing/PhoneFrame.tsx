import { Box } from "@mui/material";
import { wardrobePalette } from "../../theme/wardrobePalette";

export type PhoneFrameProps = {
  src: string;
  alt: string;
  maxWidth?: number;
};

export const PhoneFrame = ({ src, alt, maxWidth = 280 }: PhoneFrameProps) => {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth,
        mx: "auto",
        borderRadius: "32px",
        overflow: "hidden",
        border: "10px solid",
        borderColor: wardrobePalette.deviceFrame,
        bgcolor: wardrobePalette.deviceFrame,
        boxShadow: 4,
        aspectRatio: "9 / 19.5",
      }}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        sx={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </Box>
  );
};
