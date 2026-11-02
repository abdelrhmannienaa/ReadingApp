import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");

  async function signIn() {
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Enter both your email and password.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      // This always runs, whether sign-in worked or failed.
      setLoading(false);
    }
  }
  async function signUp() {
    setErrorMessage("");
    setMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Enter both your email and password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) {
        setErrorMessage(error.message);
      } else if (!data.session) {
        setMessage("Please check your email to confirm your account.");
      } else {
        setMessage("Account created successfully.");
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>WELCOME TO READEMPTION</Text>
      <Text style={styles.label}>Email:</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email address"
        placeholderTextColor="#A78BFA"
      />
      <Text style={styles.label}>Password:</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password"
        placeholderTextColor="#A78BFA"
      />
      <View style={styles.buttonGroup}>
        <Button
          title={loading ? "Please wait..." : "Sign In"}
          color="#A78BFA"
          onPress={signIn}
          disabled={loading}
        />

        <Button
          title="Create Account"
          color="#A78BFA"
          onPress={signUp}
          disabled={loading}
        />
      </View>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060606",
    padding: 24,
    justifyContent: "center",
  },
  label: {
    color: "#f9f7fe",
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1E1E1E",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  title: {
    color: "#f7f7f7",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  error: {
    color: "#FCA5A5",
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
  buttonGroup: {
    gap: 12,
    marginTop: 4,
  },
  message: {
    color: "#A78BFA",
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
});
