import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import quarterOfYear from "dayjs/plugin/quarterOfYear";

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

export type DateRangePreset = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_QUARTER" | "THIS_YEAR" | "CUSTOM";

export type ResolvedDateRange = {
  from: Date;
  to: Date;
};

export function resolveDateRange(params: { preset: DateRangePreset; from?: Date; to?: Date }): ResolvedDateRange {
  const { preset, from, to } = params;

  if (preset === "CUSTOM") {
    return {
      from: dayjs(from ?? new Date()).startOf("day").toDate(),
      to: dayjs(to ?? new Date()).endOf("day").toDate()
    };
  }

  const now = dayjs();
  const end = now.endOf("day").toDate();

  switch (preset) {
    case "TODAY":
      return { from: now.startOf("day").toDate(), to: end };
    case "THIS_WEEK":
      return { from: now.startOf("isoWeek").toDate(), to: end };
    case "THIS_MONTH":
      return { from: now.startOf("month").toDate(), to: end };
    case "THIS_QUARTER":
      return { from: now.startOf("quarter").toDate(), to: end };
    case "THIS_YEAR":
      return { from: now.startOf("year").toDate(), to: end };
    default:
      return { from: now.startOf("month").toDate(), to: end };
  }
}

export const DAILY_GROUP_FORMAT = "%Y-%m-%d";
export const MONTHLY_GROUP_FORMAT = "%Y-%m";

// Same left-fill idea as fillDays below, but bucketed by calendar month -
// used by the Monthly Summary report so a month with zero activity still
// shows up as a 0 row instead of silently disappearing from the trend.
export function fillMonths<T extends { month: string; total: string | number }>(
  rows: T[],
  range: ResolvedDateRange
): { month: string; total: number }[] {
  const byMonth = new Map(rows.map(r => [r.month, Number(r.total)]));
  const result: { month: string; total: number }[] = [];

  let cursor = dayjs(range.from).startOf("month");
  const last = dayjs(range.to).startOf("month");
  let guard = 0;

  while (!cursor.isAfter(last) && guard < 120) {
    const key = cursor.format("YYYY-MM");

    result.push({ month: key, total: byMonth.get(key) ?? 0 });
    cursor = cursor.add(1, "month");
    guard += 1;
  }

  return result;
}

export function fillDays<T extends { day: string; total: string | number }>(
  rows: T[],
  range: ResolvedDateRange
): { day: string; total: number }[] {
  const byDay = new Map(rows.map(r => [r.day, Number(r.total)]));
  const result: { day: string; total: number }[] = [];

  let cursor = dayjs(range.from).startOf("day");
  const last = dayjs(range.to).startOf("day");
  let guard = 0;

  while (!cursor.isAfter(last) && guard < 366) {
    const key = cursor.format("YYYY-MM-DD");

    result.push({ day: key, total: byDay.get(key) ?? 0 });
    cursor = cursor.add(1, "day");
    guard += 1;
  }

  return result;
}