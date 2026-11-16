import { type CurrentRead, type DashboardData, fetchDashboard } from "@/api";
import { BrandHeader } from "@/components/brand-header";
import { GoalRing } from "@/components/dashboard/goal-ring";
import { GoalSheet } from "@/components/dashboard/goal-sheet";
import { HabitGrid } from "@/components/dashboard/habit-grid";
import { LogReadingSheet } from "@/components/dashboard/log-reading-sheet";
import { Palette } from "@/components/dashboard/palette";
import { BottomTabInset } from "@/constants/theme";
import {
  buildHabitGrid,
  getCurrentStreak,
  getGoalMessage,
  goalOn,
  sumMinutesByDay,
  toDateKey,
} from "@/lib/reading-stats";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

const SHELF_PREVIEW_COUNT = 3;

export default function DashboardScreen() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [logging, setLogging] = useState(false);
  const [showAllBooks, setShowAllBooks] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);

  const loadDashboard = useCallback(async () => {
    setError("");
    try {
      setData(await fetchDashboard());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load your dashboard.",
      );
    }
  }, []);

  // Tabs stay mounted, so useEffect would only run once. This reloads whenever
  // the tab is opened, which picks up a book just added on the Explore tab.
  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  const today = new Date();
  const minutesByDay = sumMinutesByDay(data?.sessions ?? []);
  const minutesToday = minutesByDay.get(toDateKey(today)) ?? 0;
  const goals = data?.goals ?? [];
  const goalToday = goalOn(toDateKey(today), goals);
  const streak = getCurrentStreak(today, minutesByDay, goals);

  const books = data?.books ?? [];
  const activeBook =
    books.find((book) => book.book_id === selectedBookId) ?? books[0];
  const shelfBooks = showAllBooks ? books : books.slice(0, SHELF_PREVIEW_COUNT);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: BottomTabInset + 32 }}
      >
        <BrandHeader>
          <Text style={styles.welcome}>
            Welcome back{data ? `, ${data.displayName}` : ""}.
          </Text>
        </BrandHeader>

        {!data && !error && (
          <ActivityIndicator
            size="large"
            color={Palette.red}
            style={styles.loader}
          />
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={loadDashboard} accessibilityRole="button">
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {data && (
          <View style={styles.content}>
            <SectionHeader title="Continue Reading" />
            {activeBook ? (
              <View style={styles.continueRow}>
                <BookCover book={activeBook} style={styles.continueCover} />

                <View style={styles.continueDetails}>
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {activeBook.title}
                  </Text>
                  <Text style={styles.bookAuthor} numberOfLines={1}>
                    By {activeBook.author}
                  </Text>
                  <BookProgress book={activeBook} />
                  <Pressable
                    style={styles.logButton}
                    onPress={() => setLogging(true)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.logButtonText}>Log Reading</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.mutedText}>
                  Add a book to start tracking your reading.
                </Text>
                <Pressable
                  style={styles.logButton}
                  onPress={() => router.push("/explore")}
                  accessibilityRole="button"
                >
                  <Text style={styles.logButtonText}>Find a Book</Text>
                </Pressable>
              </View>
            )}

            <SectionHeader title="Recent Activity" />
            {goalToday === null ? (
              <View style={styles.goalPrompt}>
                <Text style={styles.goalTitle}>Set a daily reading goal</Text>
                <Text style={styles.mutedText}>
                  Choose how many minutes you want to read each day to start
                  tracking your streak.
                </Text>
                <Pressable
                  style={styles.logButton}
                  onPress={() => setEditingGoal(true)}
                  accessibilityRole="button"
                >
                  <Text style={styles.logButtonText}>Set Goal</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Pressable
                  style={styles.goalRow}
                  onPress={() => setEditingGoal(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Change your daily reading goal"
                >
                  <GoalRing minutes={minutesToday} goal={goalToday} />
                  <View style={styles.goalText}>
                    <Text style={styles.goalTitle}>Today&apos;s Goal</Text>
                    <Text style={styles.goalTitle}>
                      {minutesToday} out of {goalToday} minutes read today.
                    </Text>
                    <Text style={styles.mutedText}>
                      {getGoalMessage(minutesToday, goalToday, streak)}
                    </Text>
                    <Text style={styles.editHint}>Tap to change goal</Text>
                  </View>
                </Pressable>
                <HabitGrid rows={buildHabitGrid(today, minutesByDay, goals)} />
              </>
            )}

            <SectionHeader title="Current Reads" />
            {books.length === 0 ? (
              <Text style={styles.mutedText}>Nothing on your shelf yet.</Text>
            ) : (
              <View style={styles.shelf}>
                {shelfBooks.map((book) => (
                  <Pressable
                    key={book.book_id}
                    style={[
                      styles.shelfTile,
                      showAllBooks && styles.shelfTileExpanded,
                    ]}
                    onPress={() => setSelectedBookId(book.book_id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Continue reading ${book.title}`}
                    accessibilityState={{
                      selected: book.book_id === activeBook?.book_id,
                    }}
                  >
                    <BookCover
                      book={book}
                      style={[
                        styles.shelfCover,
                        book.book_id === activeBook?.book_id &&
                          styles.shelfCoverActive,
                      ]}
                    />
                  </Pressable>
                ))}

                {books.length > SHELF_PREVIEW_COUNT && (
                  <Pressable
                    style={styles.viewAll}
                    onPress={() => setShowAllBooks(!showAllBooks)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.viewAllText}>
                      {showAllBooks ? "Show Less" : "View All"}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {editingGoal ? (
        <GoalSheet
          currentGoal={goalToday}
          onClose={() => setEditingGoal(false)}
          onSaved={() => {
            setEditingGoal(false);
            loadDashboard();
          }}
        />
      ) : null}

      {logging && activeBook ? (
        <LogReadingSheet
          book={activeBook}
          onClose={() => setLogging(false)}
          onLogged={() => {
            setLogging(false);
            loadDashboard();
          }}
        />
      ) : null}
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function BookCover({
  book,
  style,
}: {
  book: CurrentRead;
  style: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.cover, style]}>
      {book.cover_url ? (
        <Image
          source={{ uri: book.cover_url }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityLabel={`Cover of ${book.title}`}
        />
      ) : (
        <Text style={styles.coverInitials}>
          {book.title.slice(0, 2).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

function BookProgress({ book }: { book: CurrentRead }) {
  // Without a page count we can show your place, but not a percentage.
  if (!book.page_count) {
    return <Text style={styles.pageText}>Page {book.current_page}</Text>;
  }

  const percent = Math.min((book.current_page / book.page_count) * 100, 100);

  return (
    <View style={styles.progressRow}>
      <Text style={styles.pageText}>
        Page {book.current_page}/{book.page_count}
      </Text>
      <View
        style={styles.progressTrack}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(percent) }}
      >
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.page,
  },
  welcome: {
    color: Palette.text,
    fontSize: 16,
    marginTop: 2,
  },
  loader: {
    marginTop: 48,
  },
  errorBox: {
    padding: 24,
    gap: 12,
    alignItems: "center",
  },
  errorText: {
    color: Palette.error,
    fontSize: 15,
    textAlign: "center",
  },
  retryText: {
    color: Palette.text,
    fontSize: 15,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.divider,
    paddingBottom: 6,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    color: Palette.text,
    fontSize: 18,
    fontWeight: "700",
  },
  continueRow: {
    flexDirection: "row",
    gap: 14,
  },
  cover: {
    backgroundColor: Palette.tile,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  coverInitials: {
    color: Palette.text,
    fontSize: 20,
    fontWeight: "700",
  },
  continueCover: {
    width: 96,
    height: 148,
    borderWidth: 1,
    borderColor: Palette.divider,
  },
  continueDetails: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  bookTitle: {
    color: Palette.text,
    fontSize: 17,
    fontWeight: "700",
  },
  bookAuthor: {
    color: Palette.muted,
    fontSize: 14,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pageText: {
    color: Palette.text,
    fontSize: 14,
    fontWeight: "600",
  },
  progressTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: Palette.barTrack,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: Palette.red,
  },
  logButton: {
    backgroundColor: Palette.red,
    alignItems: "center",
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 6,
  },
  logButtonText: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: "700",
  },
  emptyBox: {
    gap: 8,
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  goalText: {
    flex: 1,
    gap: 3,
  },
  goalTitle: {
    color: Palette.text,
    fontSize: 15,
    fontWeight: "600",
  },
  mutedText: {
    color: Palette.muted,
    fontSize: 14,
  },
  shelf: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  shelfTile: {
    width: "24%",
  },
  shelfTileExpanded: {
    width: "31%",
  },
  shelfCover: {
    width: "100%",
    aspectRatio: 2 / 3,
  },
  shelfCoverActive: {
    borderWidth: 2,
    borderColor: Palette.red,
  },
  viewAll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  viewAllText: {
    color: Palette.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  editHint: {
    color: Palette.red,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  goalPrompt: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
});
