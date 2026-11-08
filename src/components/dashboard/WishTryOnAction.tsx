import { Button } from "@mui/material";
import { dashboardCopy } from "../../content/dashboardCopy";

export type WishTryOnActionProps = {
  isBusy?: boolean;
  onClick: () => void;
};

export const WishTryOnAction = ({
  isBusy = false,
  onClick,
}: WishTryOnActionProps) => {
  const copy = dashboardCopy.wishList;

  const handleClick = () => {
    if (isBusy) {
      return;
    }

    onClick();
  };

  return (
    <Button
      type="button"
      variant="outlined"
      color="primary"
      onClick={handleClick}
      tabIndex={0}
      aria-label={copy.virtualTryOnAriaLabel}
      disabled={isBusy}
    >
      {copy.virtualTryOnLabel}
    </Button>
  );
};
