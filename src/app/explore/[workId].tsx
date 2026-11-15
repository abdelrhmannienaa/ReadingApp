import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
} from "../../api";

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

  const isInLibrary = libraryEntry !== null;

  useEffect(() => {
    async function loadBookDetails() {
      setLoading(true);
      setError("");
      setLibraryMessage("");
      setLibraryEntry(null);
      setShowStatusMenu(false);

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
          headerStyle: { backgroundColor: "#121212" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { color: "#FFFFFF" },
        }}
      />

      {loading && <ActivityIndicator size="large" color="#A78BFA" />}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && !error && book && (
        <>
          <View style={styles.bookHeader}>
            {book.cover_url ? (
              <Image source={{ uri: book.cover_url }} style={styles.cover} />
            ) : (
              <View style={[styles.cover, styles.coverPlaceholder]}>
                <Text style={styles.coverText}>
                  {book.title.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.bookMeta}>
              <Text style={styles.title}>{book.title}</Text>
              <Text style={styles.author}>by {book.author}</Text>

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

          <Text style={styles.header}>Description</Text>
          <Text style={styles.description}>{book.description}</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#121212",
  },
  bookHeader: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
  },
  cover: {
    width: 130,
    height: 195,
    borderRadius: 8,
    resizeMode: "contain",
  },
  coverPlaceholder: {
    backgroundColor: "#5B21B6",
    alignItems: "center",
    justifyContent: "center",
  },
  coverText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
  bookMeta: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 35,
    fontWeight: "bold",
  },
  author: {
    color: "#A78BFA",
    fontSize: 18,
    marginTop: 10,
  },
  pageCount: {
    color: "#A1A1AA",
    fontSize: 16,
    marginTop: 8,
  },
  addButton: {
    backgroundColor: "#A78BFA",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  addButtonText: {
    color: "#121212",
    fontSize: 16,
    fontWeight: "700",
  },
  statusButton: {
    backgroundColor: "#5B21B6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  statusButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  statusMenu: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 8,
    marginBottom: 10,
    gap: 6,
  },
  statusOption: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  activeStatusOption: {
    backgroundColor: "#5B21B6",
  },
  statusOptionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  removeButton: {
    backgroundColor: "#7F1D1D",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  removeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  libraryMessage: {
    color: "#A78BFA",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  header: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
  },
  description: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  error: {
    color: "#FCA5A5",
    fontSize: 16,
    marginTop: 16,
  },
});
