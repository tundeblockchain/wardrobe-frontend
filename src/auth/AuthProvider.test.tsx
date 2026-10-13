import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../test/renderWithProviders";
import { useAuth } from "./useAuth";

const AuthStateProbe = () => {
  const { user, loading } = useAuth();
  return (
    <p>
      {loading ? "loading" : "ready"}:{user?.id ?? "signed-out"}
    </p>
  );
};

describe("AuthProvider", () => {
  it("defaults to a signed-out, idle auth state", () => {
    renderWithProviders(<AuthStateProbe />);

    expect(screen.getByText("ready:signed-out")).toBeInTheDocument();
  });

  it("accepts a mocked signed-in user", () => {
    renderWithProviders(<AuthStateProbe />, {
      auth: { user: { id: "user-1" } },
    });

    expect(screen.getByText("ready:user-1")).toBeInTheDocument();
  });
});
