import { Box, Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import type { AppNavLink } from "./landingNav";

type AppNavLinksProps = {
  ariaLabel: string;
  links: AppNavLink[];
  justifyContent?: "center" | "flex-start";
  fontSize?: { xs: string; sm: string } | string;
};

export const AppNavLinks = ({
  ariaLabel,
  links,
  justifyContent = "flex-start",
  fontSize = "0.875rem",
}: AppNavLinksProps) => {
  return (
    <Box
      component="nav"
      aria-label={ariaLabel}
      sx={{
        display: "flex",
        gap: { xs: 1.5, sm: 2.5 },
        flexWrap: "wrap",
        justifyContent,
      }}
    >
      {links.map((navLink) => {
        if (navLink.kind === "route") {
          return (
            <Link
              key={navLink.to}
              component={RouterLink}
              to={navLink.to}
              color="inherit"
              underline="hover"
              tabIndex={0}
              aria-label={navLink.ariaLabel}
              sx={{ fontWeight: 500, fontSize }}
            >
              {navLink.label}
            </Link>
          );
        }

        return (
          <Link
            key={navLink.href}
            href={navLink.href}
            color="inherit"
            underline="hover"
            tabIndex={0}
            aria-label={navLink.ariaLabel}
            sx={{ fontWeight: 500, fontSize }}
          >
            {navLink.label}
          </Link>
        );
      })}
    </Box>
  );
};
