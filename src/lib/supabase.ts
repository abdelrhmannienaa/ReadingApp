// Gives React Native the URL features that Supabase expects.
import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Read the public connection values from the mobile app's .env file.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Stop early with a clear message if the .env values are missing.
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables.");
}

// Create one reusable Supabase connection for the entire mobile app.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Save the login session on the device.
    storage: AsyncStorage,

    // Keep a user signed in when they reopen the app.
    persistSession: true,

    // Refresh an expiring login token automatically.
    autoRefreshToken: true,

    // This setting is for mobile apps rather than browser URL logins.
    detectSessionInUrl: false,
  },
});
