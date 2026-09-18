import type { WardrobeGradients } from "./wardrobeGradients";

declare module "@mui/material/styles" {
  interface Theme {
    gradients: WardrobeGradients;
  }

  interface ThemeOptions {
    gradients?: WardrobeGradients;
  }
}

export {};
