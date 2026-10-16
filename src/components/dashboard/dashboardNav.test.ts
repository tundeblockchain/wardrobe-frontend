import { describe, expect, it } from "vitest";
import { appPaths } from "../../routes/paths";
import { dashboardNavItems } from "./dashboardNav";

describe("dashboardNavItems", () => {
  it("includes an Upgrade tab that routes to the signed-in pricing page", () => {
    const upgradeItem = dashboardNavItems.find((item) => item.id === "upgrade");

    expect(upgradeItem).toMatchObject({
      id: "upgrade",
      label: "Upgrade",
      path: appPaths.appPricing,
    });
    expect(upgradeItem?.path).toBe("/app/pricing");
  });
});
