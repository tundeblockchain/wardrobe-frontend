import { useMemo } from "react";
import { Chip, List, ListItem, ListItemText, Stack } from "@mui/material";
import type { ResourceApi } from "../../api/resourceApi";
import { useResourceApi } from "../../api/useResourceApi";
import { DashboardPage } from "../../components/dashboard/DashboardPage";
import { ResourceEmptyState } from "../../components/dashboard/ResourceEmptyState";
import { ResourceErrorState } from "../../components/dashboard/ResourceErrorState";
import { ResourceLoadingState } from "../../components/dashboard/ResourceLoadingState";
import { dashboardCopy } from "../../content/dashboardCopy";
import { useResourceQuery } from "../../hooks/useResourceQuery";

export type InboxPageProps = {
  resourceApi?: ResourceApi;
};

const copy = dashboardCopy.inbox;

const getEventPrimary = (title: string | undefined, type: string): string => {
  const trimmedTitle = title?.trim();
  if (trimmedTitle) {
    return trimmedTitle;
  }

  return type;
};

export const InboxPage = ({
  resourceApi: resourceApiProp,
}: InboxPageProps) => {
  const defaultResourceApi = useResourceApi();
  const resourceApi = resourceApiProp ?? defaultResourceApi;
  const loadInbox = useMemo(
    () => () => resourceApi.listJobEvents({ unreadOnly: false }),
    [resourceApi],
  );
  const query = useResourceQuery("inbox", loadInbox);

  if (query.status === "loading") {
    return (
      <DashboardPage
        headingId="inbox-heading"
        title={copy.title}
        description={copy.description}
      >
        <ResourceLoadingState label={copy.loadingLabel} />
      </DashboardPage>
    );
  }

  if (query.status === "error") {
    return (
      <DashboardPage
        headingId="inbox-heading"
        title={copy.title}
        description={copy.description}
      >
        <ResourceErrorState
          title={copy.errorTitle}
          description={copy.errorDescription}
          retryLabel={copy.retryLabel}
          onRetry={query.handleRetry}
        />
      </DashboardPage>
    );
  }

  if (query.data.events.length === 0) {
    return (
      <DashboardPage
        headingId="inbox-heading"
        title={copy.title}
        description={copy.description}
      >
        <ResourceEmptyState
          title={copy.emptyTitle}
          description={copy.emptyDescription}
        />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      headingId="inbox-heading"
      title={copy.title}
      description={copy.description}
    >
      <Stack spacing={2}>
        {query.data.unreadCount > 0 ? (
          <Chip
            color="primary"
            size="small"
            label={`${query.data.unreadCount} ${copy.unreadLabel}`}
            aria-label={`${query.data.unreadCount} ${copy.unreadLabel}`}
          />
        ) : null}
        <List disablePadding>
          {query.data.events.map((event) => {
            return (
              <ListItem key={event.eventId} disableGutters>
                <ListItemText
                  primary={getEventPrimary(event.title, event.type)}
                  secondary={event.message?.trim() || event.createdAt}
                />
              </ListItem>
            );
          })}
        </List>
      </Stack>
    </DashboardPage>
  );
};
