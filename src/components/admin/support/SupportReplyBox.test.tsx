import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SupportReplyBox } from "./SupportReplyBox";

describe("SupportReplyBox", () => {
  it("validates empty and overlong replies", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<SupportReplyBox onSend={onSend} />);

    await user.click(screen.getByRole("button", { name: "Send reply" }));
    expect(screen.getByText("Enter a reply.")).toBeInTheDocument();
    expect(onSend).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Reply"), {
      target: { value: "x".repeat(5001) },
    });
    await user.click(screen.getByRole("button", { name: "Send reply" }));
    expect(
      screen.getByText("Reply must be 5000 characters or fewer."),
    ).toBeInTheDocument();
    expect(onSend).not.toHaveBeenCalled();
  });

  it("shows a character counter and sends a trimmed reply", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(<SupportReplyBox onSend={onSend} />);

    await user.type(screen.getByLabelText("Reply"), "  Thanks  ");
    expect(screen.getByText("10/5000")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Send reply" }));
    expect(onSend).toHaveBeenCalledWith("Thanks");
  });

  it("does not send a second reply while the first request is in flight", async () => {
    const onSend = vi.fn().mockReturnValue(new Promise(() => undefined));
    render(<SupportReplyBox onSend={onSend} />);

    fireEvent.change(screen.getByLabelText("Reply"), {
      target: { value: "Thanks" },
    });
    const sendButton = screen.getByRole("button", { name: "Send reply" });
    fireEvent.click(sendButton);
    fireEvent.click(sendButton);

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith("Thanks");
  });
});
