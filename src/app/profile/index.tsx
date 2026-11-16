import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { fetchMyLibrary, fetchUserStatistics } from "@/api";
import { BrandHeader } from "@/components/brand-header";
import LibraryTab from "@/components/profile/library-tab";
import RecentTab from "@/components/profile/recent-tab";
import StatisticsTab from "@/components/profile/statistics-tab";
import { Palette } from "@/constants/palette";
import { BottomTabInset } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

const TABS = ["Recent", "Library", "Statistics"] as const;
type Tab = (typeof TABS)[number];

async function handleSignOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    Alert.alert("Could not log out", error.message);
  }
}

export default function ProfileScreen() {
  const [selectedTab, setSelectedTab] = useState<Tab>("Recent");
  const [username, setUsername] = useState("");
  const [booksInLibrary, setBooksInLibrary] = useState(0);
  const [booksRead, setBooksRead] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  // Changing this remounts the selected tab so it loads fresh data.
  const [refreshKey, setRefreshKey] = useState(0);

  // Tabs stay mounted, so reload every time the Profile tab is opened. This
  // picks up books added, finished or removed on other screens.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadProfile() {
        try {
          const [statistics, library] = await Promise.all([
            fetchUserStatistics(),
            fetchMyLibrary(),
          ]);
          if (!active) return;

          const {
            data: { user },
          } = await supabase.auth.getUser();

          setUsername(
            statistics?.username || user?.email?.split("@")[0] || "Reader",
          );
          setBooksInLibrary(library.length);
          setBooksRead(
            library.filter((entry) => entry.status === "finished").length,
          );
          setCurrentStreak(statistics?.current_streak ?? 0);
        } catch (error) {
          console.error("Could not load your profile:", error);
        }
      }

      void loadProfile();
      setRefreshKey((key) => key + 1);

      return () => {
        active = false;
      };
    }, []),
  );

  function renderTabContent() {
    switch (selectedTab) {
      case "Recent":
        return <RecentTab />;
      case "Library":
        return <LibraryTab />;
      case "Statistics":
        return <StatisticsTab />;
    }
  }

  const stats = [
    { label: "In Library", value: booksInLibrary },
    { label: "Books Read", value: booksRead },
    { label: "Day Streak", value: currentStreak },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: BottomTabInset + 32 }}
      >
        <BrandHeader title={username || " "}>
          <View style={styles.identity}>
            <Image
              source={require("../../../assets/images/icon.png")}
              style={styles.avatar}
            />
          </View>

          <View style={styles.statsRow}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.stat}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </BrandHeader>

        <View style={styles.content}>
          <View style={styles.tabBar} accessibilityRole="tablist">
            {TABS.map((tab) => {
              const selected = selectedTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setSelectedTab(tab)}
                  style={[styles.tab, selected && styles.tabActive]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[styles.tabText, selected && styles.tabTextActive]}
                  >
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View key={refreshKey} style={styles.tabContent}>
            {renderTabContent()}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
            onPress={handleSignOut}
            accessibilityRole="button"
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.page,
  },
  identity: {
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: Palette.divider,
  },
  username: {
    color: Palette.text,
    fontSize: 20,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    alignSelf: "stretch",
    marginTop: 16,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    color: Palette.text,
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    color: Palette.muted,
    fontSize: 13,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 20,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.divider,
    marginTop: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: Palette.red,
  },
  tabText: {
    color: Palette.muted,
    fontSize: 15,
    fontWeight: "600",
  },
  tabTextActive: {
    color: Palette.text,
  },
  tabContent: {
    paddingTop: 16,
  },
  logoutButton: {
    alignItems: "center",
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.red,
    marginTop: 24,
  },
  logoutText: {
    color: Palette.red,
    fontSize: 16,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.65,
  },
});
