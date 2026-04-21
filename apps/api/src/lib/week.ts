const CUSTOM_WEEK_START_MS = Date.parse("2026-04-18T17:00:00.000Z");
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function getCurrentWeekId(timestamp = Date.now()) {
  const elapsedWeeks = Math.floor((timestamp - CUSTOM_WEEK_START_MS) / WEEK_MS);
  return Math.max(1, elapsedWeeks + 1);
}
