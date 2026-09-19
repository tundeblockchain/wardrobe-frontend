import type { KeyboardEvent } from "react";
import { Apple, Shop } from "@mui/icons-material";
import { Button, Stack } from "@mui/material";
import {
  getStoreCtas,
  isStoreCtaAvailable,
  type StoreKind,
} from "../../config/storeCtas";
import {
  trackStoreCtaClick,
  type StoreCtaPlacement,
  type TrackingIds,
} from "../../config/tracking";

export type StoreCtaButtonsProps = {
  appStoreUrl: string | undefined;
  playStoreUrl: string | undefined;
  placement: StoreCtaPlacement;
  trackingIds?: TrackingIds;
};

const storeIcons: Record<StoreKind, typeof Apple> = {
  appStore: Apple,
  playStore: Shop,
};

export const StoreCtaButtons = ({
  appStoreUrl,
  playStoreUrl,
  placement,
  trackingIds,
}: StoreCtaButtonsProps) => {
  const storeCtas = getStoreCtas({ appStoreUrl, playStoreUrl });

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      useFlexGap
      sx={{ flexWrap: "wrap" }}
    >
      {storeCtas.map((storeCta, index) => {
        const Icon = storeIcons[storeCta.kind];
        const isAvailable = isStoreCtaAvailable(storeCta);
        const variant = index === 0 ? "contained" : "outlined";

        if (!isAvailable || !storeCta.href) {
          return (
            <Button
              key={storeCta.kind}
              variant={variant}
              color="primary"
              size="large"
              disabled
              aria-disabled="true"
              aria-label={storeCta.comingSoonLabel}
              title={storeCta.comingSoonLabel}
              startIcon={<Icon aria-hidden="true" />}
              sx={{ px: 2.5 }}
            >
              {storeCta.label}
            </Button>
          );
        }

        const handleStoreCtaClick = () => {
          trackStoreCtaClick(
            { store: storeCta.kind, placement },
            trackingIds ?? {
              gaMeasurementId: undefined,
              metaPixelId: undefined,
            },
          );
        };

        const handleStoreCtaKeyDown = (
          event: KeyboardEvent<HTMLAnchorElement>,
        ) => {
          if (event.key !== "Enter" && event.key !== " ") {
            return;
          }

          if (event.key === " ") {
            event.preventDefault();
            event.currentTarget.click();
          }
        };

        return (
          <Button
            key={storeCta.kind}
            component="a"
            href={storeCta.href}
            target="_blank"
            rel="noopener noreferrer"
            variant={variant}
            color="primary"
            size="large"
            tabIndex={0}
            aria-label={storeCta.label}
            title={storeCta.label}
            startIcon={<Icon aria-hidden="true" />}
            onClick={handleStoreCtaClick}
            onKeyDown={handleStoreCtaKeyDown}
            sx={{ px: 2.5 }}
          >
            {storeCta.label}
          </Button>
        );
      })}
    </Stack>
  );
};
