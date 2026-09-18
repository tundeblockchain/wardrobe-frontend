import { Apple, Shop } from "@mui/icons-material";
import { Button, Stack } from "@mui/material";
import {
  getStoreCtas,
  isStoreCtaAvailable,
  type StoreKind,
} from "../../config/storeCtas";

export type StoreCtaButtonsProps = {
  appStoreUrl: string | undefined;
  playStoreUrl: string | undefined;
};

const storeIcons: Record<StoreKind, typeof Apple> = {
  appStore: Apple,
  playStore: Shop,
};

export const StoreCtaButtons = ({
  appStoreUrl,
  playStoreUrl,
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
            sx={{ px: 2.5 }}
          >
            {storeCta.label}
          </Button>
        );
      })}
    </Stack>
  );
};
