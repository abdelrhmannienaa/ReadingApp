import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  addBookToLibrary,
  type BookDetails,
  fetchBookDetails,
  fetchMyLibraryEntry,
  type MyLibraryEntry,
  type ReadingStatus,
  removeBookFromLibrary,
  updateBookStatus,
} from "@/api";
import { Palette } from "@/constants/palette";

// Long descriptions are cut to this many lines until the user taps "Show more".
const DESCRIPTION_PREVIEW_LINES = 6;

const STATUS_OPTIONS: { label: string; value: ReadingStatus }[] = [
  { label: "Want to Read", value: "want_to_read" },
  { label: "Currently Reading", value: "reading" },
  { label: "Completed", value: "finished" },
];

function getStatusLabel(status: ReadingStatus) {
  return (
    STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    "Want to Read"
  );
}

export default function BookDetailsScreen() {
  const { workId } = useLocalSearchParams<{ workId: string }>();

  const [book, setBook] = useState<BookDetails | null>(null);
  const [libraryEntry, setLibraryEntry] = useState<MyLibraryEntry | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [addingToLibrary, setAddingToLibrary] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [removingFromLibrary, setRemovingFromLibrary] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [libraryMessage, setLibraryMessage] = useState("");
  const [showFullDescription, setShowFullDescription] = useState(false);

  const isInLibrary = libraryEntry !== null;

  useEffect(() => {
    async function loadBookDetails() {
      setLoading(true);
      setError("");
      setLibraryMessage("");
      setLibraryEntry(null);
      setShowStatusMenu(false);
      setShowFullDescription(false);

      try {
        const details = await fetchBookDetails(workId);

        // Get this user's personal library row, if they saved this book.
        const entry = await fetchMyLibraryEntry(details.open_library_id);

        setBook(details);
        setLibraryEntry(entry);
      } catch {
        setError("Could not fetch book details.");
      } finally {
        setLoading(false);
      }
    }

    loadBookDetails();
  }, [workId]);

  async function handleAddToLibrary() {
    if (!book || isInLibrary) return;

    setLibraryMessage("");
    setAddingToLibrary(true);

    try {
      await addBookToLibrary(book);

      // Fetch the newly-created user_books row so status controls can appear.
      const entry = await fetchMyLibraryEntry(book.open_library_id);

      if (!entry) {
        throw new Error(
          "The book was added, but its library entry was not found.",
        );
      }

      setLibraryEntry(entry);
      setLibraryMessage("Added to your library!");
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("user_books_user_id_book_id_key")
      ) {
        // If another request already added it, refresh its personal entry.
        const entry = await fetchMyLibraryEntry(book.open_library_id);
        setLibraryEntry(entry);
        setLibraryMessage("This book is already in your library.");
      } else {
        setLibraryMessage(
          "Could not add this book to your library. Please try again.",
        );
      }
    } finally {
      setAddingToLibrary(false);
    }
  }

  async function handleStatusChange(status: ReadingStatus) {
    if (!libraryEntry) return;

    setUpdatingStatus(true);
    setLibraryMessage("");

    try {
      await updateBookStatus(libraryEntry.user_book_id, status);

      // Update the local screen immediately after the database succeeds.
      setLibraryEntry({
        ...libraryEntry,
        status,
      });

      setShowStatusMenu(false);
      setLibraryMessage(`Status changed to ${getStatusLabel(status)}.`);
    } catch {
      setLibraryMessage("Could not update this book's status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleRemoveFromLibrary() {
    if (!libraryEntry) return;

    setRemovingFromLibrary(true);
    setLibraryMessage("");

    try {
      // Only removes this user's user_books row, not the shared books row.
      await removeBookFromLibrary(libraryEntry.user_book_id);

      setLibraryEntry(null);
      setShowStatusMenu(false);
      setLibraryMessage("Removed from your library.");
    } catch {
      setLibraryMessage("Could not remove this book from your library.");
    } finally {
      setRemovingFromLibrary(false);
    }
  }

  function confirmRemoveFromLibrary() {
    if (!book) return;

    // Alert.alert does nothing on web, so use the browser's confirm box there.
    if (Platform.OS === "web") {
      if (globalThis.confirm(`Remove "${book.title}" from your library?`)) {
        void handleRemoveFromLibrary();
      }
      return;
    }

    Alert.alert(
      "Remove from library?",
      `Remove "${book.title}" from your library?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void handleRemoveFromLibrary();
          },
        },
      ],
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Book Details",
          headerStyle: { backgroundColor: Palette.header },
          headerTintColor: Palette.text,
          headerTitleStyle: { color: Palette.text },
          headerShadowVisible: false,
        }}
      />

      {loading && (
        <ActivityIndicator
          size="large"
          color={Palette.red}
          style={styles.loader}
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && !error && book && (
        <>
          <View style={styles.bookHeader}>
            {book.cover_url ? (
              <Image
                source={{ uri: book.cover_url }}
                style={styles.cover}
                accessibilityLabel={`Cover of ${book.title}`}
              />
            ) : (
              <View style={[styles.cover, styles.coverPlaceholder]}>
                <Text style={styles.coverText}>
                  {book.title.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.bookMeta}>
              <Text style={styles.title}>{book.title}</Text>
              <Text style={styles.author}>By {book.author}</Text>

              <Text style={styles.pageCount}>
                {book.page_count !== null
                  ? `${book.page_count} pages`
                  : "Page count unavailable"}
              </Text>
            </View>
          </View>

          {/* Only show Add when this book has no user_books row. */}
          {!isInLibrary ? (
            <Pressable
              style={[
                styles.addButton,
                addingToLibrary && styles.buttonDisabled,
              ]}
              onPress={handleAddToLibrary}
              disabled={addingToLibrary}
              accessibilityRole="button"
            >
              <Text style={styles.addButtonText}>
                {addingToLibrary ? "Adding..." : "Add to Library"}
              </Text>
            </Pressable>
          ) : (
            <>
              {/* Only visible when this book belongs to the signed-in user. */}
              <Pressable
                style={[
                  styles.statusButton,
                  updatingStatus && styles.buttonDisabled,
                ]}
                onPress={() => setShowStatusMenu(!showStatusMenu)}
                disabled={updatingStatus || removingFromLibrary}
                accessibilityRole="button"
                accessibilityState={{ expanded: showStatusMenu }}
              >
                <Text style={styles.statusButtonText}>
                  {updatingStatus
                    ? "Saving..."
                    : `Status: ${getStatusLabel(libraryEntry.status)} ▼`}
                </Text>
              </Pressable>

              {showStatusMenu ? (
                <View style={styles.statusMenu}>
                  {STATUS_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.statusOption,
                        libraryEntry.status === option.value &&
                          styles.activeStatusOption,
                      ]}
                      onPress={() => handleStatusChange(option.value)}
                      disabled={updatingStatus || removingFromLibrary}
                      accessibilityRole="button"
                      accessibilityState={{
                        selected: libraryEntry.status === option.value,
                      }}
                    >
                      <Text style={styles.statusOptionText}>
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <Pressable
                style={[
                  styles.removeButton,
                  removingFromLibrary && styles.buttonDisabled,
                ]}
                onPress={confirmRemoveFromLibrary}
                disabled={removingFromLibrary || updatingStatus}
                accessibilityRole="button"
              >
                <Text style={styles.removeButtonText}>
                  {removingFromLibrary ? "Removing..." : "Remove from Library"}
                </Text>
              </Pressable>
            </>
          )}

          {libraryMessage ? (
            <Text style={styles.libraryMessage}>{libraryMessage}</Text>
          ) : null}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Description</Text>
          </View>
          <Text
            style={styles.description}
            numberOfLines={
              showFullDescription ? undefined : DESCRIPTION_PREVIEW_LINES
            }
          >
            {book.description}
          </Text>
          {book.description.length > 300 ? (
            <Pressable
              onPress={() => setShowFullDescription(!showFullDescription)}
              accessibilityRole="button"
              style={styles.showMore}
            >
              <Text style={styles.showMoreText}>
                {showFullDescription ? "Show less" : "Show more"}
              </Text>
            </Pressable>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: Palette.page,
  },
  loader: {
    marginTop: 48,
  },
  bookHeader: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 20,
  },
  cover: {
    width: 120,
    height: 180,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.divider,
    backgroundColor: Palette.tile,
    resizeMode: "cover",
  },
  coverPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  coverText: {
    color: Palette.text,
    fontSize: 28,
    fontWeight: "700",
  },
  bookMeta: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  title: {
    color: Palette.text,
    fontSize: 24,
    fontWeight: "700",
  },
  author: {
    color: Palette.muted,
    fontSize: 16,
  },
  pageCount: {
    color: Palette.muted,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: Palette.red,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  addButtonText: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: "700",
  },
  statusButton: {
    backgroundColor: Palette.red,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  statusButtonText: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: "700",
  },
  statusMenu: {
    backgroundColor: Palette.card,
    borderRadius: 12,
    padding: 6,
    marginBottom: 10,
    gap: 4,
  },
  statusOption: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  activeStatusOption: {
    backgroundColor: Palette.tile,
  },
  statusOptionText: {
    color: Palette.text,
    fontSize: 15,
    fontWeight: "600",
  },
  removeButton: {
    borderWidth: 1,
    borderColor: Palette.red,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  removeButtonText: {
    color: Palette.red,
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  libraryMessage: {
    color: Palette.muted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  sectionHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.divider,
    paddingBottom: 6,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: Palette.text,
    fontSize: 18,
    fontWeight: "700",
  },
  description: {
    color: Palette.text,
    fontSize: 15,
    lineHeight: 23,
  },
  showMore: {
    alignSelf: "flex-start",
    paddingVertical: 8,
  },
  showMoreText: {
    color: Palette.red,
    fontSize: 14,
    fontWeight: "600",
  },
  error: {
    color: Palette.error,
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
});
