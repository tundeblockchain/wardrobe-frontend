import { Box } from "@mui/material";
import { wardrobePalette } from "../../theme/wardrobePalette";

export type PhoneFrameProps = {
  src: string;
  alt: string;
  maxWidth?: number;
  compact?: boolean;
};

export const PhoneFrame = ({
  src,
  alt,
  maxWidth = 280,
  compact = false,
}: PhoneFrameProps) => {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth,
        mx: "auto",
        borderRadius: compact ? "16px" : "32px",
        overflow: "hidden",
        border: compact ? "5px solid" : "10px solid",
        borderColor: wardrobePalette.deviceFrame,
        bgcolor: wardrobePalette.deviceFrame,
        boxShadow: compact ? 3 : 8,
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
