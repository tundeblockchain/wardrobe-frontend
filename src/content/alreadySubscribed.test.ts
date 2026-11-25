import { describe, expect, it } from "vitest";
import {
  alreadySubscribedCopy,
  getStripeAlreadySubscribedMessage,
  isStripeAlreadySubscribedMessage,
} from "./alreadySubscribed";

describe("alreadySubscribed copy", () => {
  it("builds the Stripe Settings sentence exactly", () => {
    expect(getStripeAlreadySubscribedMessage()).toBe(
      "You already have a plan. Go to Manage subscription in Settings to change it.",
    );
    expect(isStripeAlreadySubscribedMessage(getStripeAlreadySubscribedMessage())).toBe(
      true,
    );
    expect(
      isStripeAlreadySubscribedMessage(alreadySubscribedCopy.ios),
    ).toBe(false);
    expect(alreadySubscribedCopy.comp).toBe(
      "This account already has complimentary Premium.",
    );
    expect(alreadySubscribedCopy.comp).not.toMatch(/App Store|Google Play|Stripe/i);
    expect(alreadySubscribedCopy.comp).not.toMatch(/\bAI\b/);
  });
});
