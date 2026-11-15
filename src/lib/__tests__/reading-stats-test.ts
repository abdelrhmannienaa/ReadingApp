import {
  buildHabitGrid,
  getCurrentStreak,
  getDayStatus,
  goalOn,
  sumMinutesByDay,
} from "../reading-stats";

describe("reading statistics", () => {
  test("uses the latest goal that was active on a date", () => {
    const goals = [
      { starts_on: "2026-01-01", minutes: 20 },
      { starts_on: "2026-02-01", minutes: 30 },
    ];

    expect(goalOn("2025-12-31", goals)).toBe(20);
    expect(goalOn("2026-01-31", goals)).toBe(20);
    expect(goalOn("2026-02-01", goals)).toBe(30);
  });

  test.each([
    [0, "unmet"],
    [10, "partial"],
    [30, "met"],
    [45, "exceeded"],
  ] as const)("labels %i minutes as %s for a 30-minute goal", (minutes, status) => {
    expect(getDayStatus(minutes, 30)).toBe(status);
  });

  test("adds sessions on the same day before calculating a streak", () => {
    const minutesByDay = sumMinutesByDay([
      { read_on: "2026-11-13", minutes: 10 },
      { read_on: "2026-11-13", minutes: 20 },
      { read_on: "2026-11-14", minutes: 30 },
      { read_on: "2026-11-15", minutes: 12 },
    ]);

    expect(getCurrentStreak(new Date(2026, 10, 15), minutesByDay, [
      { starts_on: "2026-01-01", minutes: 30 },
    ])).toBe(2);
  });

  test("marks days after today as future in the habit grid", () => {
    const grid = buildHabitGrid(
      new Date(2026, 10, 11),
      new Map([["2026-11-11", 30]]),
      [{ starts_on: "2026-01-01", minutes: 30 }],
      1,
    );

    expect(grid.map((row) => row[0].isFuture)).toEqual([
      false,
      false,
      false,
      true,
      true,
      true,
      true,
    ]);
  });
});
