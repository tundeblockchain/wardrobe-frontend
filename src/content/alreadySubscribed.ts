export const alreadySubscribedCopy = {
  ios: "You already have a plan from the App Store.",
  android: "You already have a plan from Google Play.",
  unknown: "You already have a plan from the App Store / Google Play.",
  stripeBeforeLink: "You already have a plan. Go to ",
  stripeLink: "Manage subscription in Settings",
  stripeAfterLink: " to change it.",
} as const;

export const getStripeAlreadySubscribedMessage = (): string => {
  return `${alreadySubscribedCopy.stripeBeforeLink}${alreadySubscribedCopy.stripeLink}${alreadySubscribedCopy.stripeAfterLink}`;
};

export const isStripeAlreadySubscribedMessage = (message: string): boolean => {
  return message === getStripeAlreadySubscribedMessage();
};
