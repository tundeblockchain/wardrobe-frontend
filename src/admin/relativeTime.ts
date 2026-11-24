const UNITS: ReadonlyArray<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> =
  [
    { unit: "year", ms: 1000 * 60 * 60 * 24 * 365 },
    { unit: "month", ms: 1000 * 60 * 60 * 24 * 30 },
    { unit: "week", ms: 1000 * 60 * 60 * 24 * 7 },
    { unit: "day", ms: 1000 * 60 * 60 * 24 },
    { unit: "hour", ms: 1000 * 60 * 60 },
    { unit: "minute", ms: 1000 * 60 },
    { unit: "second", ms: 1000 },
  ];

const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export const formatRelativeTime = (
  isoDate: string,
  nowMs: number = Date.now(),
): string => {
  const parsed = Date.parse(isoDate);
  if (!Number.isFinite(parsed)) {
    return isoDate;
  }

  const deltaMs = parsed - nowMs;
  const absDelta = Math.abs(deltaMs);

  for (const { unit, ms } of UNITS) {
    if (absDelta >= ms || unit === "second") {
      return formatter.format(Math.round(deltaMs / ms), unit);
    }
  }

  return formatter.format(0, "second");
};
