import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getScreenshotSources } from "../../content/screenshotSlots";
import { renderWithProviders } from "../../test/renderWithProviders";
import { IPhoneFrame } from "./IPhoneFrame";

describe("IPhoneFrame", () => {
  it("renders an image source with accessible alt text", () => {
    renderWithProviders(
      <IPhoneFrame
        src="/screenshots/try-on-rust-floral-780.jpg"
        alt="Pocket Closet Virtual Try On showing a rust floral maxi dress on the user's profile photo"
      />,
    );

    expect(
      screen.getByRole("img", {
        name: "Pocket Closet Virtual Try On showing a rust floral maxi dress on the user's profile photo",
      }),
    ).toHaveAttribute("src", "/screenshots/try-on-rust-floral-780.jpg");
  });

  it("renders children instead of an image when both are provided", () => {
    renderWithProviders(
      <IPhoneFrame
        src="/screenshots/home-780.jpg"
        alt="Should not render"
        size="thumbnail"
      >
        <p>Framed screen</p>
      </IPhoneFrame>,
    );

    expect(screen.getByText("Framed screen")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("applies the hero and thumbnail size variants", () => {
    const { rerender } = renderWithProviders(
      <IPhoneFrame src="/screenshots/home-780.jpg" alt="Home" size="hero" />,
    );

    expect(document.querySelector('[data-device="iphone"]')).toHaveAttribute(
      "data-size",
      "hero",
    );

    rerender(
      <IPhoneFrame
        src="/screenshots/home-780.jpg"
        alt="Home"
        size="thumbnail"
      />,
    );

    expect(document.querySelector('[data-device="iphone"]')).toHaveAttribute(
      "data-size",
      "thumbnail",
    );
  });

  it("lazy-loads thumbnails and eager-loads the hero image", () => {
    const { rerender } = renderWithProviders(
      <IPhoneFrame
        src="/screenshots/home-780.jpg"
        alt="Home"
        size="thumbnail"
      />,
    );

    expect(screen.getByRole("img", { name: "Home" })).toHaveAttribute(
      "loading",
      "lazy",
    );

    rerender(
      <IPhoneFrame
        src="/screenshots/try-on-rust-floral-780.jpg"
        alt="Virtual Try On"
        size="hero"
        eager
      />,
    );

    const heroImage = screen.getByRole("img", { name: "Virtual Try On" });
    expect(heroImage).toHaveAttribute("loading", "eager");
    expect(heroImage).toHaveAttribute("fetchpriority", "high");
  });

  it("emits a picture srcset when responsive sources are provided", () => {
    const sources = getScreenshotSources("try-on-rust-floral");

    renderWithProviders(
      <IPhoneFrame
        src="/screenshots/try-on-rust-floral-780.jpg"
        sources={sources}
        alt="Virtual Try On"
        eager
      />,
    );

    const avifSource = document.querySelector('source[type="image/avif"]');
    const webpSource = document.querySelector('source[type="image/webp"]');
    const image = screen.getByRole("img", { name: "Virtual Try On" });

    expect(avifSource).toHaveAttribute("srcset", sources.avif);
    expect(webpSource).toHaveAttribute("srcset", sources.webp);
    expect(image).toHaveAttribute("srcset", sources.jpg);
    expect(image).toHaveAttribute("width", "390");
    expect(image).toHaveAttribute("height", "844");
  });

  it("keeps empty alt decorative for compact thumbs", () => {
    renderWithProviders(
      <IPhoneFrame
        src="/screenshots/home-780.jpg"
        alt=""
        size="thumbnail"
        maxWidth={88}
      />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      document.querySelector('img[src="/screenshots/home-780.jpg"]'),
    ).toHaveAttribute("alt", "");
  });
});
