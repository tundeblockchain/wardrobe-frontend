import type { ReactNode } from "react";
import { StatusCard } from "../StatusCard";
import { DashboardNarrowContent } from "./DashboardNarrowContent";

export type ResourceEmptyStateProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export const ResourceEmptyState = ({
  title,
  description,
  children,
}: ResourceEmptyStateProps) => {
  return (
    <DashboardNarrowContent>
      <StatusCard title={title} description={description} />
      {children}
    </DashboardNarrowContent>
  );
};
