export type ProfessionalStatus = "active" | "suspended" | "inactive";

export type DatedSubscription = {
  canceled_at: string | null;
  created_at: string;
  current_period_end: string;
  current_period_start: string;
  status: string;
};

const activeSubscriptionStatuses = new Set(["active", "trialing"]);
const currentSubscriptionStatuses = new Set(["active", "trialing", "past_due", "incomplete"]);

function parseDate(value: string | null) {
  return value ? new Date(value) : null;
}

export function isSubscriptionCurrentAt(subscription: DatedSubscription, at: Date) {
  const startsAt = parseDate(subscription.current_period_start);
  const endsAt = parseDate(subscription.current_period_end);
  const canceledAt = parseDate(subscription.canceled_at);

  return Boolean(
    startsAt &&
      endsAt &&
      startsAt <= at &&
      endsAt >= at &&
      currentSubscriptionStatuses.has(subscription.status) &&
      (!canceledAt || canceledAt > at),
  );
}

export function isSubscriptionActiveAt(subscription: DatedSubscription, at: Date) {
  return isSubscriptionCurrentAt(subscription, at) && activeSubscriptionStatuses.has(subscription.status);
}

export function latestSubscriptionForPartner<TSubscription extends DatedSubscription>(
  subscriptions: TSubscription[],
  at: Date,
) {
  const currentSubscriptions = subscriptions
    .filter((subscription) => isSubscriptionCurrentAt(subscription, at))
    .sort((left, right) => parseDate(right.created_at)!.getTime() - parseDate(left.created_at)!.getTime());

  if (currentSubscriptions[0]) return currentSubscriptions[0];

  return [...subscriptions].sort((left, right) => parseDate(right.created_at)!.getTime() - parseDate(left.created_at)!.getTime())[0];
}

export function effectiveProfessionalStatus(
  profileStatus: string | undefined,
  subscription: DatedSubscription | undefined,
  at: Date,
): ProfessionalStatus {
  if (profileStatus === "suspended") {
    return "suspended";
  }

  if (subscription && isSubscriptionActiveAt(subscription, at)) {
    return "active";
  }

  if (
    subscription &&
    isSubscriptionCurrentAt(subscription, at) &&
    (subscription.status === "past_due" || subscription.status === "incomplete")
  ) {
    return "suspended";
  }

  return "inactive";
}
