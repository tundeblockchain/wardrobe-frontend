import { createContext, useContext } from "react";

export const DashboardPaperContext = createContext(false);

export const useDashboardPaper = (): boolean => {
  return useContext(DashboardPaperContext);
};
