import type { ReactNode } from "react";
import { Box } from "@mui/material";
import type { ScreenshotSources } from "../../content/screenshotSlots";
import { wardrobePalette } from "../../theme/wardrobePalette";

export type IPhoneFrameSize = "hero" | "thumbnail";

export type IPhoneFrameProps = {
  size?: IPhoneFrameSize;
  maxWidth?: number;
  children?: ReactNode;
  src?: string;
  sources?: ScreenshotSources;
  alt?: string;
  sizes?: string;
  eager?: boolean;
};

type FrameTokens = {
  maxWidth: number;
  bezel: number;
  radius: number;
  screenRadius: number;
  islandWidth: string;
  islandHeight: number;
  islandTop: number;
  shadow: number;
  sizes: string;
};

const frameTokens: Record<IPhoneFrameSize, FrameTokens> = {
  hero: {
    maxWidth: 300,
    bezel: 11,
    radius: 38,
    screenRadius: 30,
    islandWidth: "34%",
    islandHeight: 20,
    islandTop: 10,
    shadow: 8,
    sizes: "(max-width: 899px) 70vw, 300px",
  },
  thumbnail: {
    maxWidth: 88,
    bezel: 4,
    radius: 16,
    screenRadius: 12,
    islandWidth: "36%",
    islandHeight: 6,
    islandTop: 4,
    shadow: 3,
    sizes: "88px",
  },
};

type ScreenshotImageProps = {
  src: string;
  sources?: ScreenshotSources;
  alt: string;
  sizes: string;
  eager: boolean;
};

const ScreenshotImage = ({
  src,
  sources,
  alt,
  sizes,
  eager,
}: ScreenshotImageProps) => {
  const loading = eager ? "eager" : "lazy";
  const fetchPriority = eager ? "high" : "auto";
  const width = sources?.width ?? 390;
  const height = sources?.height ?? 844;

  const imageSx = {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    aspectRatio: `${width} / ${height}`,
  } as const;

  if (!sources) {
    return (
      <Box
        component="img"
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding={eager ? "sync" : "async"}
        sx={imageSx}
      />
    );
  }

  return (
    <Box
      component="picture"
      sx={{
        display: "block",
        width: "100%",
        height: "100%",
      }}
    >
      <source type="image/avif" srcSet={sources.avif} sizes={sizes} />
      <source type="image/webp" srcSet={sources.webp} sizes={sizes} />
      <Box
        component="img"
        src={src}
        srcSet={sources.jpg}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding={eager ? "sync" : "async"}
        sx={imageSx}
      />
    </Box>
  );
};

export const IPhoneFrame = ({
  size = "hero",
  maxWidth,
  children,
  src,
  sources,
  alt = "",
  sizes,
  eager = false,
}: IPhoneFrameProps) => {
  const tokens = frameTokens[size];
  const frameMaxWidth = maxWidth ?? tokens.maxWidth;
  const imageSizes = sizes ?? tokens.sizes;
  const hasImage = Boolean(src);

  return (
    <Box
      data-device="iphone"
      data-size={size}
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: frameMaxWidth,
        minWidth: 0,
        mx: "auto",
      }}
    >
      {size === "hero" ? (
        <>
          <Box
            aria-hidden="true"
            sx={{
              position: "absolute",
              left: -2,
              top: "18%",
              width: 3,
              height: "7%",
              borderRadius: "2px 0 0 2px",
              bgcolor: wardrobePalette.deviceFrame,
            }}
          />
          <Box
            aria-hidden="true"
            sx={{
              position: "absolute",
              left: -2,
              top: "27%",
              width: 3,
              height: "11%",
              borderRadius: "2px 0 0 2px",
              bgcolor: wardrobePalette.deviceFrame,
            }}
          />
          <Box
            aria-hidden="true"
            sx={{
              position: "absolute",
              right: -2,
              top: "24%",
              width: 3,
              height: "12%",
              borderRadius: "0 2px 2px 0",
              bgcolor: wardrobePalette.deviceFrame,
            }}
          />
        </>
      ) : null}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          borderRadius: `${tokens.radius}px`,
          overflow: "hidden",
          bgcolor: wardrobePalette.deviceFrame,
          boxShadow: tokens.shadow,
          aspectRatio: "9 / 19.5",
          p: `${tokens.bezel}px`,
          backgroundImage:
            "linear-gradient(160deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 38%, rgba(0,0,0,0.28) 100%)",
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: `${tokens.screenRadius}px`,
            overflow: "hidden",
            bgcolor: "#000",
          }}
        >
          {children ??
            (hasImage && src ? (
              <ScreenshotImage
                src={src}
                sources={sources}
                alt={alt}
                sizes={imageSizes}
                eager={eager}
              />
            ) : null)}
          <Box
            aria-hidden="true"
            sx={{
              position: "absolute",
              top: tokens.islandTop,
              left: "50%",
              width: tokens.islandWidth,
              height: tokens.islandHeight,
              transform: "translateX(-50%)",
              borderRadius: tokens.islandHeight,
              bgcolor: "#0B0709",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};
