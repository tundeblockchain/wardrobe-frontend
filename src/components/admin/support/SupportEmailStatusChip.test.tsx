import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SupportEmailStatusChip } from "./SupportEmailStatusChip";

describe("SupportEmailStatusChip", () => {
  it("renders sent, failed, and skipped chips and ignores a missing status", () => {
    const { rerender } = render(<SupportEmailStatusChip status="sent" />);
    expect(screen.getByLabelText("Email sent")).toBeInTheDocument();

    rerender(<SupportEmailStatusChip status="failed" />);
    expect(screen.getByLabelText("Email failed")).toBeInTheDocument();

    rerender(<SupportEmailStatusChip status="skipped" />);
    expect(screen.getByLabelText("Email skipped")).toBeInTheDocument();

    rerender(<SupportEmailStatusChip status={null} />);
    expect(screen.queryByLabelText("Email sent")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Email failed")).not.toBeInTheDocument();
  });
});
