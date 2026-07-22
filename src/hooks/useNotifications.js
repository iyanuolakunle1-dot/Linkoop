import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api.get("/notifications")
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const suffix = Math.random().toString(36).slice(2);

    const sub = supabase
      .channel(`notifications:${user.id}:${suffix}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const { data: actor } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_color")
            .eq("id", payload.new.actor_id)
            .single();

          setNotifications((prev) => [{ ...payload.new, actor }, ...prev]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [user]);

  const markRead = useCallback(async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.patch("/notifications/read-all");
    } catch {}
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, loading, unreadCount, markRead, markAllRead };
}