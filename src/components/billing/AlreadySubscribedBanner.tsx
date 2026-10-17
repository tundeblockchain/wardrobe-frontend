import { Alert, Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import {
  alreadySubscribedCopy,
  isStripeAlreadySubscribedMessage,
} from "../../content/alreadySubscribed";
import { appPaths } from "../../routes/paths";

export type AlreadySubscribedBannerProps = {
  message: string;
};

export const AlreadySubscribedBanner = ({
  message,
}: AlreadySubscribedBannerProps) => {
  if (!message) {
    return null;
  }

  if (isStripeAlreadySubscribedMessage(message)) {
    return (
      <Alert
        severity="info"
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        {alreadySubscribedCopy.stripeBeforeLink}
        <Link
          component={RouterLink}
          to={appPaths.appSettings}
          color="inherit"
          underline="always"
          tabIndex={0}
          aria-label={alreadySubscribedCopy.stripeLink}
        >
          {alreadySubscribedCopy.stripeLink}
        </Link>
        {alreadySubscribedCopy.stripeAfterLink}
      </Alert>
    );
  }

  return (
    <Alert severity="info" role="status" aria-live="polite" aria-label={message}>
      {message}
    </Alert>
  );
};
