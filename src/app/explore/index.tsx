import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  RefreshControl,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";

import { fetchDiscoverBooks, type SearchBook, searchBooks } from "@/api";
import { BrandHeader } from "@/components/brand-header";
import { Palette } from "@/constants/palette";
import { BottomTabInset } from "@/constants/theme";

type DiscoverSection = {
  title: string;
  subject: string;
  books: SearchBook[];
};

const DISCOVER_CATEGORIES = [
  { title: "Science Fiction", subject: "science_fiction" },
  { title: "Fantasy", subject: "fantasy" },
  { title: "Nonfiction", subject: "nonfiction" },
  { title: "Mystery", subject: "mystery" },
  { title: "Romance", subject: "romance" },
  { title: "Horror", subject: "horror" },
];

export default function ExploreScreen() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<SearchBook[]>([]);
  const [discoverSections, setDiscoverSections] = useState<DiscoverSection[]>(
    [],
  );
  const [showingSearchResults, setShowingSearchResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();

  const loadDiscoverSections = useCallback(async () => {
    // Load every genre at the same time instead of one after another, so the
    // page appears faster. One genre failing doesn't hide the others.
    const results = await Promise.allSettled(
      DISCOVER_CATEGORIES.map(async (category) => {
        // Randomly choose 0, 10, 20, ... 90.
        const randomOffset = Math.floor(Math.random() * 10) * 10;
        const books = await fetchDiscoverBooks(category.subject, randomOffset);
        return { ...category, books };
      }),
    );

    const loadedSections = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    setError(
      loadedSections.length === 0
        ? "Could not load books to discover. Please try again."
        : "",
    );
    setDiscoverSections(loadedSections);
  }, []);

  useEffect(() => {
    async function loadFirstTime() {
      await loadDiscoverSections();
      setLoading(false);
    }

    loadFirstTime();
  }, [loadDiscoverSections]);

  // Pull down on the genre list to get a fresh set of books.
  async function handleRefresh() {
    setRefreshing(true);
    await loadDiscoverSections();
    setRefreshing(false);
  }

  async function handleSearch() {
    const trimmedQuery = query.trim();

    // An empty search returns the user to the Discover sections.
    if (!trimmedQuery) {
      setShowingSearchResults(false);
      return;
    }

    Keyboard.dismiss();
    setError("");
    setLoading(true);
    setShowingSearchResults(true);
    setBooks([]);

    try {
      const searchResults = await searchBooks(trimmedQuery);
      setBooks(searchResults);
    } catch {
      setError("Failed to search books. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setQuery("");
    setShowingSearchResults(false);
    setError("");
  }

  function openBookDetails(book: SearchBook) {
    const workId = book.open_library_id.replace("/works/", "");

    router.push({
      pathname: "/explore/[workId]",
      params: { workId },
    });
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* The header stays put so the search bar is always in reach. */}
      <BrandHeader title="Search">
        <View style={styles.searchRow}>
          <TextInput
            value={query}
            onChangeText={(text) => {
              setQuery(text);

              // Clearing the search box returns to the genre sections.
              if (!text.trim()) {
                setShowingSearchResults(false);
              }
            }}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            placeholder="Search by title or author"
            placeholderTextColor={Palette.muted}
            style={styles.searchInput}
            accessibilityLabel="Search books"
          />
          <Pressable
            style={({ pressed }) => [
              styles.searchButton,
              pressed && styles.pressed,
            ]}
            onPress={handleSearch}
            accessibilityRole="button"
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </Pressable>
        </View>
      </BrandHeader>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: BottomTabInset + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={
          showingSearchResults ? undefined : (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Palette.red}
              colors={[Palette.red]}
            />
          )
        }
      >
        {loading && (
          <ActivityIndicator
            size="large"
            color={Palette.red}
            style={styles.loader}
          />
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!loading && !error && showingSearchResults && (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.sectionTitle}>
                {books.length} {books.length === 1 ? "result" : "results"}
              </Text>
              <Pressable onPress={clearSearch} accessibilityRole="button">
                <Text style={styles.linkText}>Clear search</Text>
              </Pressable>
            </View>

            {books.length === 0 ? (
              <Text style={styles.mutedText}>
                No books matched that search.
              </Text>
            ) : (
              books.map((book) => (
                <Pressable
                  key={book.open_library_id}
                  style={styles.resultCard}
                  onPress={() => openBookDetails(book)}
                  accessibilityRole="button"
                  accessibilityLabel={`${book.title} by ${book.author}`}
                >
                  <BookCover book={book} style={styles.resultCover} />

                  <View style={styles.resultDetails}>
                    <Text style={styles.resultTitle} numberOfLines={2}>
                      {book.title}
                    </Text>
                    <Text style={styles.mutedText} numberOfLines={1}>
                      By {book.author}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </>
        )}

        {!loading &&
          !error &&
          !showingSearchResults &&
          discoverSections.map((section) => (
            <View key={section.subject} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>

              {section.books.length === 0 ? (
                <Text style={styles.mutedText}>No books found.</Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.shelf}
                  contentContainerStyle={styles.shelfContent}
                >
                  {section.books.map((book) => (
                    <Pressable
                      key={book.open_library_id}
                      style={styles.shelfBook}
                      onPress={() => openBookDetails(book)}
                      accessibilityRole="button"
                      accessibilityLabel={`${book.title} by ${book.author}`}
                    >
                      <BookCover book={book} style={styles.shelfCover} />
                      <Text style={styles.shelfTitle} numberOfLines={2}>
                        {book.title}
                      </Text>
                      <Text style={styles.shelfAuthor} numberOfLines={1}>
                        {book.author}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

function BookCover({
  book,
  style,
}: {
  book: SearchBook;
  style: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.cover, style]}>
      {book.cover_url ? (
        <Image
          source={{ uri: book.cover_url }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <Text style={styles.coverInitials}>
          {book.title.slice(0, 2).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const CONTENT_PADDING = 20;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.page,
  },
  searchRow: {
    alignSelf: "stretch",
    gap: 8,
    marginTop: 10,
  },
  searchInput: {
    backgroundColor: Palette.tile,
    color: Palette.text,
    fontSize: 15,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  searchButton: {
    backgroundColor: Palette.red,
    alignItems: "center",
    paddingVertical: 11,
    borderRadius: 12,
  },
  searchButtonText: {
    color: Palette.text,
    fontSize: 15,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.7,
  },
  content: {
    paddingHorizontal: CONTENT_PADDING,
  },
  loader: {
    marginTop: 48,
  },
  errorText: {
    color: Palette.error,
    fontSize: 15,
    marginTop: 24,
    textAlign: "center",
  },
  mutedText: {
    color: Palette.muted,
    fontSize: 14,
  },
  linkText: {
    color: Palette.red,
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    paddingTop: 18,
    paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.divider,
  },
  sectionTitle: {
    color: Palette.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  // Lets the covers scroll edge to edge while the title stays padded.
  shelf: {
    marginHorizontal: -CONTENT_PADDING,
  },
  shelfContent: {
    gap: 10,
    paddingHorizontal: CONTENT_PADDING,
  },
  shelfBook: {
    width: 96,
  },
  cover: {
    backgroundColor: Palette.tile,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.divider,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  coverInitials: {
    color: Palette.text,
    fontSize: 20,
    fontWeight: "700",
  },
  shelfCover: {
    width: 96,
    height: 144,
  },
  shelfTitle: {
    color: Palette.text,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
  },
  shelfAuthor: {
    color: Palette.muted,
    fontSize: 12,
    marginTop: 2,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 18,
  },
  resultCard: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: Palette.card,
    padding: 10,
    borderRadius: 14,
    marginBottom: 10,
  },
  resultCover: {
    width: 64,
    height: 96,
  },
  resultDetails: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  resultTitle: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: "700",
  },
});
