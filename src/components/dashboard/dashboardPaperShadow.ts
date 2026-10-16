export const DASHBOARD_PAPER_LIGHT_SHADOW = "0 1px 6px rgba(42, 18, 28, 0.12)";
export const DASHBOARD_PAPER_DARK_SHADOW = "0 1px 6px rgba(0, 0, 0, 0.45)";
export const DASHBOARD_PAPER_LIGHT_EMPHASIS_SHADOW =
  "0 6px 20px rgba(42, 18, 28, 0.22)";
export const DASHBOARD_PAPER_DARK_EMPHASIS_SHADOW =
  "0 6px 20px rgba(0, 0, 0, 0.7)";

export const getDashboardPaperBoxShadow = (
  mode: "light" | "dark",
  emphasized = false,
): string => {
  if (mode === "dark") {
    return emphasized
      ? DASHBOARD_PAPER_DARK_EMPHASIS_SHADOW
      : DASHBOARD_PAPER_DARK_SHADOW;
  }

  return emphasized
    ? DASHBOARD_PAPER_LIGHT_EMPHASIS_SHADOW
    : DASHBOARD_PAPER_LIGHT_SHADOW;
};
