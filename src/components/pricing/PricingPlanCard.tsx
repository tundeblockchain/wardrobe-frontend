import type { KeyboardEvent, ReactNode } from "react";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import type { PricingPlanFeature } from "../../content/pricingCopy";

export const PRICING_PLAN_CARD_TEST_ID = "pricing-plan-card";

export type PricingPlanCardAction = {
  label: string;
  ariaLabel: string;
  disabled?: boolean;
  to?: string;
  onClick?: () => void;
};

export type PricingPlanCardProps = {
  name: string;
  headingId: string;
  priceLabel: string;
  priceHint?: string;
  summary?: string;
  features: readonly PricingPlanFeature[];
  isCurrent?: boolean;
  currentPlanLabel: string;
  currentPlanAriaLabel: string;
  action?: PricingPlanCardAction;
  extra?: ReactNode;
};

export const PricingPlanCard = ({
  name,
  headingId,
  priceLabel,
  priceHint,
  summary,
  features,
  isCurrent = false,
  currentPlanLabel,
  currentPlanAriaLabel,
  action,
  extra,
}: PricingPlanCardProps) => {
  const handleClick = () => {
    if (!action || action.disabled || action.to) {
      return;
    }

    action.onClick?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    if (action?.to) {
      return;
    }

    event.preventDefault();
    handleClick();
  };

  return (
    <Paper
      component="article"
      elevation={0}
      data-testid={PRICING_PLAN_CARD_TEST_ID}
      data-plan={name.toLowerCase()}
      aria-labelledby={headingId}
      aria-current={isCurrent ? "true" : undefined}
      sx={(theme) => ({
        width: "100%",
        minWidth: 0,
        height: "100%",
        boxSizing: "border-box",
        p: { xs: 2.5, sm: 3 },
        border: 2,
        borderColor: isCurrent ? theme.palette.primary.main : theme.palette.divider,
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        display: "flex",
        flexDirection: "column",
      })}
    >
      <Stack spacing={2} sx={{ flex: 1 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Typography
            id={headingId}
            variant="h3"
            component="h2"
            sx={(theme) => ({ color: theme.palette.text.primary })}
          >
            {name}
          </Typography>
          {isCurrent ? (
            <Chip
              size="small"
              color="primary"
              label={currentPlanLabel}
              aria-label={currentPlanAriaLabel}
            />
          ) : null}
        </Stack>
        <Box>
          <Typography
            variant="h2"
            component="p"
            sx={(theme) => ({ color: theme.palette.text.primary })}
          >
            {priceLabel}
          </Typography>
          {priceHint ? (
            <Typography variant="body2" color="text.secondary">
              {priceHint}
            </Typography>
          ) : null}
          {summary ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {summary}
            </Typography>
          ) : null}
        </Box>
        <Box component="ul" sx={{ m: 0, pl: 0, flex: 1, listStyle: "none" }}>
          {features.map((feature) => (
            <Stack
              key={feature.label}
              component="li"
              direction="row"
              spacing={1}
              sx={{ alignItems: "flex-start", mb: 1 }}
              aria-label={
                feature.included
                  ? `${feature.label} included`
                  : `${feature.label} not included`
              }
            >
              {feature.included ? (
                <CheckOutlined
                  fontSize="small"
                  aria-hidden
                  sx={(theme) => ({
                    mt: "2px",
                    color: theme.palette.primary.main,
                  })}
                />
              ) : (
                <CloseOutlined
                  fontSize="small"
                  aria-hidden
                  sx={(theme) => ({
                    mt: "2px",
                    color: theme.palette.text.disabled,
                  })}
                />
              )}
              <Typography
                variant="body2"
                color={feature.included ? "text.primary" : "text.secondary"}
              >
                {feature.label}
              </Typography>
            </Stack>
          ))}
        </Box>
        {extra}
        {action ? (
          action.to ? (
            <Button
              component={RouterLink}
              to={action.to}
              variant={isCurrent ? "outlined" : "contained"}
              color="primary"
              fullWidth
              disabled={action.disabled}
              tabIndex={0}
              aria-label={action.ariaLabel}
            >
              {action.label}
            </Button>
          ) : (
            <Button
              type="button"
              variant={isCurrent ? "outlined" : "contained"}
              color="primary"
              fullWidth
              onClick={handleClick}
              onKeyDown={handleKeyDown}
              disabled={action.disabled}
              tabIndex={0}
              aria-label={action.ariaLabel}
            >
              {action.label}
            </Button>
          )
        ) : null}
      </Stack>
    </Paper>
  );
};
