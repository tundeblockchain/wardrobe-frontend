import type { KeyboardEvent, MouseEvent } from "react";
import { Link } from "@mui/material";

type SkipLinkProps = {
  targetId: string;
};

export const SkipLink = ({ targetId }: SkipLinkProps) => {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(targetId);
    if (!target) {
      return;
    }

    event.preventDefault();
    target.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    const target = document.getElementById(targetId);
    if (!target) {
      return;
    }

    target.focus();
  };

  return (
    <Link
      href={`#${targetId}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Skip to main content"
      underline="none"
      sx={{
        position: "absolute",
        left: 16,
        top: -48,
        zIndex: (theme) => theme.zIndex.tooltip,
        px: 2,
        py: 1,
        bgcolor: "background.paper",
        color: "text.primary",
        borderRadius: 1,
        boxShadow: 2,
        "&:focus": {
          top: 16,
        },
      }}
    >
      Skip to main content
    </Link>
  );
};
