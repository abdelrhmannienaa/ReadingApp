import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { fetchUserStatistics, type UserStatistics } from "@/api";
import { Palette } from "@/constants/palette";

export default function StatisticsTab() {
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadStatistics() {
      try {
        const data = await fetchUserStatistics();
        if (active) setStatistics(data);
      } catch (error) {
        if (active) {
          const message =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred.";
          setError(`Could not load your statistics: ${message}`);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadStatistics();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color={Palette.red}
        accessibilityLabel="Loading statistics"
        style={styles.loader}
      />
    );
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  if (!statistics) {
    return (
      <Text style={styles.message}>
        No statistics are available for your signed-in account.
      </Text>
    );
  }

  const stats = [
    {
      label: "Current Streak",
      value: `${statistics.current_streak.toLocaleString()} ${statistics.current_streak === 1 ? "day" : "days"}`,
    },
    {
      label: "Longest Streak",
      value: `${statistics.highest_streak.toLocaleString()} ${statistics.highest_streak === 1 ? "day" : "days"}`,
    },
    { label: "Pages Read", value: statistics.pages_read.toLocaleString() },
    { label: "Minutes Read", value: statistics.minutes_read.toLocaleString() },
  ];

  return (
    <View style={styles.grid}>
      {stats.map((stat) => (
        <View key={stat.label} style={styles.statCard}>
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginVertical: 32,
  },
  message: {
    color: Palette.muted,
    fontSize: 15,
    textAlign: "center",
    marginVertical: 16,
  },
  error: {
    color: Palette.error,
    fontSize: 15,
    textAlign: "center",
    marginVertical: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: Palette.card,
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  statValue: {
    color: Palette.red,
    fontSize: 26,
    fontWeight: "700",
  },
  statLabel: {
    color: Palette.muted,
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
});
