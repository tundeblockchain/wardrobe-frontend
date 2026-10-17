import {
  fetchBillingPlans,
  type BillingPlansResponse,
  type FetchBillingPlansFn,
} from "../api/billingPlans";
import {
  useResourceQuery,
  type UseResourceQueryResult,
} from "./useResourceQuery";

export const BILLING_PLANS_QUERY_KEY = "billing-plans";

export type UseBillingPlansOptions = {
  fetchPlans?: FetchBillingPlansFn;
};

export const useBillingPlans = (
  options: UseBillingPlansOptions = {},
): UseResourceQueryResult<BillingPlansResponse> => {
  const fetchPlans = options.fetchPlans ?? fetchBillingPlans;

  return useResourceQuery(BILLING_PLANS_QUERY_KEY, fetchPlans);
};
