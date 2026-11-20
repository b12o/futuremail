// Formatter instances are cached: they were previously rebuilt on every
// call, and these run per row on every tick of the transit board.
const shortDateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const fullDateFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatShortDate(iso: string): string {
  return shortDateFmt.format(new Date(iso));
}

export function formatFullDate(iso: string): string {
  return fullDateFmt.format(new Date(iso));
}
