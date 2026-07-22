import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { api } from "../lib/api";

export function usePresence() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get("/profiles").then(setUsers).catch(() => {});

    const channelName = `profiles-status-${Math.random().toString(36).slice(2)}`;

    const subscription = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          setUsers((prev) =>
            prev.map((u) => (u.id === payload.new.id ? { ...u, ...payload.new } : u))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return users;
}