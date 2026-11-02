import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchBooks, type Book } from "../api";

export default function ProfileScreen() {

    return(
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.header}>
                    <Text style={styles.title}>*UserName*</Text>
                </View>
                <View style={styles.centerContainer}>
                    <Image 
                        source={require('../../assets/images/icon.png')} 
                         style={styles.circularImage} 
                    />
                    <View style={styles.rowContainer}>
                        <View>
                            <Text style={styles.subtitle}>Books In Progress</Text>
                            <View style={styles.centerContainer}>
                              <Text style={styles.subtitle}>3</Text>
                            </View>
                        </View>
                        <View>
                            <Text style={styles.subtitle}>Books Read</Text>
                            <View style={styles.centerContainer}>
                              <Text style={styles.subtitle}>25</Text>
                            </View>
                        </View>
                        <View>
                            <Text style={styles.subtitle}>Books Reviewed</Text>
                            <View style={styles.centerContainer}>
                              <Text style={styles.subtitle}>8</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.equalWidthRowContainer}>
                      <Pressable 
                        onPress={() => Alert.alert('Button Tapped!')}
                        //style={styles.}
                      >
                      <Text style={styles.subtitle}>Recent</Text>
                      </Pressable>
                      
                      <Pressable 
                        onPress={() => Alert.alert('Button Tapped!')}
                        //style={styles.} 
                      >
                      <Text style={styles.subtitle}>Library</Text>
                      </Pressable>
                      
                      <Pressable 
                        onPress={() => Alert.alert('Button Tapped!')}
                        // style={styles.} 
                      >
                      <Text style={styles.subtitle}>Statistics</Text>
                      </Pressable>

                      <Pressable 
                        onPress={() => Alert.alert('Button Tapped!')}
                        //style={styles.}
                      ></Pressable>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>





    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 15, //was 24
  },
  centerContainer:{
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 15,
    alignItems: 'center'
  },
  rowContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#121212",
    paddingHorizontal: 24,
    gap: 12,
  },
  equalWidthRowContainer:{
    flex: 1,
    width: '100%',
    alignItems: 'stretch',
    flexDirection: "row",
    backgroundColor: "#121212",
    paddingHorizontal: 24,
    gap: 12,
  },
  header: {
    marginTop: 24,
    marginBottom: 40,
  },
  eyebrow: {
    color: "#A78BFA",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#A1A1AA",
    fontSize: 16,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 14,
  },
  loader: {
    marginTop: 32,
  },
  bookCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    gap: 16,
  },
  coverPlaceholder: {
    width: 64,
    height: 92,
    borderRadius: 8,
    backgroundColor: "#5B21B6",
    alignItems: "center",
    justifyContent: "center",
  },
  coverText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  bookDetails: {
    flex: 1,
    justifyContent: "center",
  },
  bookTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "600",
    marginBottom: 4,
  },
  author: {
    color: "#A1A1AA",
    fontSize: 14,
    marginBottom: 14,
  },
  pageCount: {
    color: "#D4D4D8",
    fontSize: 13,
  },
  emptyText: {
    color: "#A1A1AA",
    fontSize: 15,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 15,
  },
  localImage: {
     width: 100, 
     height: 100 
    },
  circularImage: {
    width: 100, 
    height: 100,
    borderRadius: 60, 
    overflow: 'hidden'
  }
});
