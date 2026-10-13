export const SIDEBAR_WIDTH = 260;
export const SIDEBAR_WIDTH_COLLAPSED = 72;
export const SIDEBAR_COLLAPSED_STORAGE_KEY = "pocket-closet.sidebarCollapsed";

export const readSidebarCollapsed = (): boolean => {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

export const writeSidebarCollapsed = (collapsed: boolean): void => {
  try {
    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      String(collapsed),
    );
  } catch {
    // Ignore quota errors and private-mode access failures.
  }
};
