const hexToSrgb = (hex: string): [number, number, number] => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    throw new Error(`Expected a 6-digit hex color, received ${hex}`);
  }

  const channel = (offset: number) =>
    Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255;

  return [channel(0), channel(2), channel(4)];
};

const linearize = (channel: number) =>
  channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

export const relativeLuminance = (hex: string): number => {
  const [red, green, blue] = hexToSrgb(hex).map(linearize);

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

export const contrastRatio = (foreground: string, background: string): number => {
  const lighter = Math.max(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );
  const darker = Math.min(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );

  return (lighter + 0.05) / (darker + 0.05);
};

export const hueDegrees = (hex: string): number => {
  const [red, green, blue] = hexToSrgb(hex);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  if (delta === 0) {
    return 0;
  }

  if (max === red) {
    return ((green - blue) / delta + (green < blue ? 6 : 0)) * 60;
  }

  if (max === green) {
    return ((blue - red) / delta + 2) * 60;
  }

  return ((red - green) / delta + 4) * 60;
};

export const isBurgundyPlumHue = (hex: string): boolean => {
  const [red, green, blue] = hexToSrgb(hex);
  const chroma = Math.max(red, green, blue) - Math.min(red, green, blue);
  if (chroma < 0.08) {
    return false;
  }

  const hue = hueDegrees(hex);
  return hue >= 320 || hue <= 20;
};
