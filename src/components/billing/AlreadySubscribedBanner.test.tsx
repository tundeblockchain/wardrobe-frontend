import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  alreadySubscribedCopy,
  getStripeAlreadySubscribedMessage,
} from "../../content/alreadySubscribed";
import { appPaths } from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import { AlreadySubscribedBanner } from "./AlreadySubscribedBanner";

describe("AlreadySubscribedBanner", () => {
  it("renders nothing when the message is empty", () => {
    renderWithProviders(<AlreadySubscribedBanner message="" />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("links Stripe subscribers to Settings", () => {
    const message = getStripeAlreadySubscribedMessage();
    renderWithProviders(<AlreadySubscribedBanner message={message} />);

    const banner = screen.getByRole("status", { name: message });
    expect(banner).toHaveTextContent(message);
    expect(
      within(banner).getByRole("link", {
        name: alreadySubscribedCopy.stripeLink,
      }),
    ).toHaveAttribute("href", appPaths.appSettings);
  });

  it("keeps App Store and Google Play banners as plain text", () => {
    const { unmount } = renderWithProviders(
      <AlreadySubscribedBanner message={alreadySubscribedCopy.ios} />,
    );

    expect(
      screen.getByRole("status", { name: alreadySubscribedCopy.ios }),
    ).toHaveTextContent(alreadySubscribedCopy.ios);
    expect(
      screen.queryByRole("link", { name: alreadySubscribedCopy.stripeLink }),
    ).not.toBeInTheDocument();
    unmount();

    renderWithProviders(
      <AlreadySubscribedBanner message={alreadySubscribedCopy.android} />,
    );

    expect(
      screen.getByRole("status", { name: alreadySubscribedCopy.android }),
    ).toHaveTextContent(alreadySubscribedCopy.android);
    expect(
      screen.queryByRole("link", { name: alreadySubscribedCopy.stripeLink }),
    ).not.toBeInTheDocument();
  });
});
