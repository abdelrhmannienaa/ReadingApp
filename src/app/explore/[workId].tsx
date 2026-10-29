import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
} from "../../api";

export default function BookDetailsScreen() {
  // Reads the ID sent from Explore, such as "OL45804W".
  const { workId } = useLocalSearchParams<{ workId: string }>();

  // State for loading and displaying the selected book.
  const [book, setBook] = useState<BookDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Separate state for the Add to Library action.
  const [addingToLibrary, setAddingToLibrary] = useState(false);
  const [libraryMessage, setLibraryMessage] = useState("");

  // Load this book's details when this page opens.
  useEffect(() => {
    async function loadBookDetails() {
      setLoading(true);
      setError("");

      try {
        const details = await fetchBookDetails(workId);
        setBook(details);
      } catch {
        setError("Could not fetch book details.");
      } finally {
        setLoading(false);
      }
    }

    loadBookDetails();
  }, [workId]);

  // Runs only when the user taps Add to Library.
  async function handleAddToLibrary() {
    if (!book) {
      return;
    }

    setLibraryMessage("");
    setAddingToLibrary(true);

    try {
      await addBookToLibrary(book);
      setLibraryMessage("Added to your library!");
    } catch (error) {
      if (error instanceof Error) {
        setLibraryMessage(error.message);
      } else {
        setLibraryMessage("Could not add this book to your library.");
      }
    } finally {
      setAddingToLibrary(false);
    }
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
            ) : null}

            <View style={styles.bookMeta}>
              <Text style={styles.title}>{book.title}</Text>
              <Text style={styles.author}>by {book.author}</Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.addButton,
              addingToLibrary && styles.addButtonDisabled,
            ]}
            onPress={handleAddToLibrary}
            disabled={addingToLibrary}
          >
            <Text style={styles.addButtonText}>
              {addingToLibrary ? "Adding..." : "Add to Library"}
            </Text>
          </Pressable>

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
  addButton: {
    backgroundColor: "#A78BFA",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: "#121212",
    fontSize: 16,
    fontWeight: "700",
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
