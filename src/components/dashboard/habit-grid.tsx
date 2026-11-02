import { StyleSheet, Text, View } from "react-native";

import type { DayStatus, GridDay } from "@/lib/reading-stats";

import { Palette, StatusColors } from "./palette";

const ROW_LABELS = ["M", "", "W", "", "F", "", ""];

const LEGEND: { status: DayStatus; label: string }[] = [
  { status: "unmet", label: "Unmet" },
  { status: "partial", label: "Partial" },
  { status: "met", label: "Met" },
  { status: "exceeded", label: "Exceeded" },
];

export function HabitGrid({ rows }: { rows: GridDay[][] }) {
  const pastDays = rows.flat().filter((day) => !day.isFuture);
  const goalDays = pastDays.filter(
    (day) => day.status === "met" || day.status === "exceeded",
  ).length;

  return (
    <View style={styles.card}>
      <View
        style={styles.grid}
        accessible
        accessibilityLabel={`Reading goal met on ${goalDays} of the last ${pastDays.length} days`}
      >
        {rows.map((days, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            <Text style={styles.rowLabel}>{ROW_LABELS[rowIndex]}</Text>
            {days.map((day) => (
              <View
                key={day.key}
                style={[
                  styles.cell,
                  { backgroundColor: StatusColors[day.status] },
                  day.isFuture && styles.futureCell,
                ]}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        {LEGEND.map(({ status, label }) => (
          <View key={status} style={styles.legendItem}>
            <Text style={styles.legendLabel}>{label}</Text>
            <View
              style={[
                styles.legendSwatch,
                { backgroundColor: StatusColors[status] },
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  grid: {
    gap: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  rowLabel: {
    width: 18,
    color: Palette.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 3,
  },
  futureCell: {
    opacity: 0.35,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendLabel: {
    color: Palette.muted,
    fontSize: 12,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
});
