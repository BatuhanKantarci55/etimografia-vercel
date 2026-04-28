import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = "https://pskqmfyotlrdewdrpwjy.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBza3FtZnlvdGxyZGV3ZHJwd2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDEzMDQsImV4cCI6MjA4Nzc3NzMwNH0.CXjY1VLoHGbeG1Ly8UMJvFm2Xc8FTaOg9kvI78G_rus";

// Platforma göre storage belirleme
const getStorage = () => {
  if (Platform.OS === "web") {
    return localStorage;
  }
  return AsyncStorage;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
