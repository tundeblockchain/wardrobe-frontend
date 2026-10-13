import { StatusCard } from "../StatusCard";

export type ResourceEmptyStateProps = {
  title: string;
  description: string;
};

export const ResourceEmptyState = ({
  title,
  description,
}: ResourceEmptyStateProps) => {
  return <StatusCard title={title} description={description} />;
};
