import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { api } from "../lib/api";
import { useIdleStatus } from "../hooks/useIdleStatus";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useIdleStatus(!!session);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }

    api.get("/profiles/me")
      .then(setProfile)
      .catch((err) => console.error("Failed to load profile:", err));

    api.patch("/profiles/me/status", { status: "online" }).catch(() => {});

    const handleUnload = () => {
      navigator.sendBeacon &&
        navigator.sendBeacon(
          `${import.meta.env.VITE_API_URL}/profiles/me/status`,
          JSON.stringify({ status: "offline" })
        );
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [session]);

  async function signUp({ email, password, fullName, username }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, username } },
    });
    if (error) throw error;
    return data;
  }

  async function verifySignupOtp(email, token) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });
    if (error) throw error;
    return data;
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    try {
      await api.patch("/profiles/me/status", { status: "offline" });
    } catch {}
    await supabase.auth.signOut();
  }

  const value = {
    session,
    user: session?.user || null,
    profile,
    setProfile,
    loading,
    signUp,
    verifySignupOtp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}