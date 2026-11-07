import { StyleSheet, Text, View } from "react-native";

// Hardcoded placeholder data. Replace with real values from your API later.
const STATS = [
  { label: "Current Streak", value: "12 days" },
  { label: "Longest Streak", value: "47 days" },
  { label: "Books Read", value: "25" },
  { label: "Books Reviewed", value: "8" },
  { label: "Active Discussions", value: "4" },
  { label: "Pages Read", value: "7,842" },
];

export default function StatisticsTab() {
  return (
    <View style={styles.grid}>
      {STATS.map((stat) => (
        <View key={stat.label} style={styles.statCard}>
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  statValue: {
    color: "#A78BFA",
    fontSize: 26,
    fontWeight: "700",
  },
  statLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
});
