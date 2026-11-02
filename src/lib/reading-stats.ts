// Pure helpers for the dashboard: no React and no database, just dates and sums.

// There's no goal setting screen yet, so everyone shares this goal for now.
export const DAILY_GOAL_MINUTES = 30;

// A day counts as "exceeded" at 1.5x the goal. If any minute over the goal
// counted, "met" would only ever show on days of exactly 30 minutes.
const EXCEEDED_MULTIPLIER = 1.5;

export const GRID_WEEKS = 16;

export type DayStatus = "unmet" | "partial" | "met" | "exceeded";

export type GridDay = {
  key: string;
  minutes: number;
  status: DayStatus;
  isFuture: boolean;
};

// "YYYY-MM-DD" in the phone's time zone. toISOString() would give the UTC day,
// which puts evening reading in California on the wrong square.
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Build dates from calendar parts so daylight saving days don't throw this off.
function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function daysAgoKey(today: Date, days: number): string {
  return toDateKey(addDays(today, -days));
}

export function sumMinutesByDay(
  sessions: { read_on: string; minutes: number }[],
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const session of sessions) {
    totals.set(
      session.read_on,
      (totals.get(session.read_on) ?? 0) + session.minutes,
    );
  }
  return totals;
}

export function getDayStatus(minutes: number, goal: number): DayStatus {
  if (minutes <= 0) return "unmet";
  if (minutes < goal) return "partial";
  if (minutes < goal * EXCEEDED_MULTIPLIER) return "met";
  return "exceeded";
}

// Returns 7 rows (Monday to Sunday), each with one square per week. The last
// column is the current week, so days later this week are marked as future.
export function buildHabitGrid(
  today: Date,
  minutesByDay: Map<string, number>,
  goal: number,
  weeks: number = GRID_WEEKS,
): GridDay[][] {
  const mondayIndex = (today.getDay() + 6) % 7; // getDay() starts on Sunday
  const firstMonday = addDays(today, -mondayIndex - (weeks - 1) * 7);
  const todayKey = toDateKey(today);

  return Array.from({ length: 7 }, (_, row) =>
    Array.from({ length: weeks }, (_, column) => {
      const key = toDateKey(addDays(firstMonday, column * 7 + row));
      const minutes = minutesByDay.get(key) ?? 0;
      return {
        key,
        minutes,
        status: getDayStatus(minutes, goal),
        // These keys sort the same way as the dates they stand for.
        isFuture: key > todayKey,
      };
    }),
  );
}

// Days in a row that hit the goal. Today only adds to the streak once it's met,
// and not having met it yet doesn't break the streak, since the day isn't over.
export function getCurrentStreak(
  today: Date,
  minutesByDay: Map<string, number>,
  goal: number,
): number {
  const metOn = (date: Date) =>
    (minutesByDay.get(toDateKey(date)) ?? 0) >= goal;

  let streak = metOn(today) ? 1 : 0;
  let day = addDays(today, -1);
  while (metOn(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

export function getGoalMessage(
  minutes: number,
  goal: number,
  streak: number,
): string {
  const remaining = goal - minutes;
  if (remaining <= 0) {
    return `Goal met! You're on a ${streak}-day streak.`;
  }
  const unit = remaining === 1 ? "minute" : "minutes";
  return streak > 0
    ? `${remaining} more ${unit} to keep streak!`
    : `${remaining} more ${unit} to start a streak!`;
}
