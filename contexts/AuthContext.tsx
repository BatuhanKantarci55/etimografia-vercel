import { Session, User } from "@supabase/supabase-js";
import { router, useSegments } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  banner_index: number;
  avatar_index: number;
  created_at: string;
  updated_at: string;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  initialized: boolean;
  signUp: (email: string, password: string, username: string) => Promise<any>;
  signIn: (emailOrUsername: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  updateProfile: (updates: Partial<Profile>) => Promise<any>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  initialized: false,
  signUp: async () => ({}),
  signIn: async () => ({}),
  signOut: async () => {},
  resetPassword: async () => ({}),
  updateProfile: async () => ({}),
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Yardımcı: email formatı mı?
const isEmail = (str: string) => /\S+@\S+\.\S+/.test(str);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) {
        console.log("Profil getirilemedi:", error.message);
        return;
      }
      setProfile(data);
    } catch (error) {
      console.error("Profil bilgileri alınamadı:", error);
    }
  };

  const createOrUpdateProfile = async (user: User) => {
    try {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      const profileData = {
        id: user.id,
        email: user.email,
        username:
          user.user_metadata?.username ||
          user.email?.split("@")[0] ||
          "kullanici",
        full_name: null,
        bio: null,
        banner_index: 0,
        avatar_index: 0,
        updated_at: new Date(),
      };

      if (!existingProfile) {
        await supabase.from("profiles").insert({
          ...profileData,
          created_at: new Date(),
        });
      } else {
        await supabase
          .from("profiles")
          .update({
            email: user.email,
            username: user.user_metadata?.username || user.email?.split("@")[0],
            updated_at: new Date(),
          })
          .eq("id", user.id);
      }
      await fetchProfile(user.id);
    } catch (error) {
      console.error("Profil işlemi sırasında hata:", error);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) await fetchProfile(user.id);
  };

  // İlk yükleme ve auth state dinleyicisi
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (mounted) {
          if (session) {
            setSession(session);
            setUser(session.user);
            fetchProfile(session.user.id);
          }
        }
      } catch (error) {
        console.error("Session yüklenirken hata:", error);
      } finally {
        if (mounted) {
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      // Bazı durumlarda getSession'dan önce bu tetiklenirse UI'yi hazırla
      if (event === "INITIAL_SESSION") {
        setInitialized(true);
      }

      if (event === "SIGNED_IN" && session?.user) {
        createOrUpdateProfile(session.user);
      }
      if (event === "SIGNED_OUT") {
        setProfile(null);
      }
      if (event === "USER_UPDATED" && session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Expo Router'ın Resmi Rota (Auth) Yönlendirme Mantığı
  useEffect(() => {
    // Uygulama henüz yüklenmediyse bekle
    if (!initialized) return;

    // Bulunduğumuz klasör "(auth)" grubu mu?
    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      // Kullanıcı çıkış yapmış/yoksa ama uygulamada geziniyorsa girişe geri at
      router.replace("/(auth)");
    } else if (user && inAuthGroup) {
      // Kullanıcı varsa ama giriş ekranındaysa ana ekrana geri at
      if (user.email_confirmed_at) {
        router.replace("/(tabs)");
      } else {
        router.replace("/verify-email");
      }
    }
  }, [user, initialized, segments]);

  // Kullanıcı adı veya email ile giriş
  const signIn = async (emailOrUsername: string, password: string) => {
    let email = emailOrUsername;
    // Eğer email formatında değilse, username'e göre email ara
    if (!isEmail(emailOrUsername)) {
      const { data, error } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", emailOrUsername)
        .single();
      if (error || !data?.email) {
        return { data: null, error: { message: "Kullanıcı adı bulunamadı" } };
      }
      email = data.email;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data?.session) {
      await createOrUpdateProfile(data.user);
    }
    return { data, error };
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: "etimografia://auth/callback",
      },
    });

    if (!error && data?.user) {
      if (data.user.identities && data.user.identities.length === 0) {
        return { data, error: { message: "Bu email zaten kayıtlı" } };
      }
      await createOrUpdateProfile(data.user);
    }
    return { data, error };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Çıkış yapılırken hata:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "etimografia://auth/callback",
    });
    return { data, error };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user?.id) return { error: { message: "Kullanıcı bulunamadı" } };
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date() })
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error("Profil güncellenirken hata:", error);
      return { data: null, error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        initialized,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
