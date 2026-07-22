import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { api } from "../lib/api";

export function useThreads() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadThreads = useCallback(async () => {
    try {
      const data = await api.get("/dm/threads");
      setThreads(data);
    } catch (err) {
      console.error("Failed to load DM threads:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();

    const suffix = Math.random().toString(36).slice(2);
    const sub = supabase
      .channel(`dm-threads-${suffix}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dm_messages" },
        () => loadThreads()
      )
      .subscribe();

    // Fired manually (see DirectMessage.jsx) whenever a thread is marked as
    // read, so Sidebar/DMList badges clear immediately without waiting on
    // a new message to trigger the realtime listener above.
    function handleManualRefresh() {
      loadThreads();
    }
    window.addEventListener("threads:refresh", handleManualRefresh);

    return () => {
      supabase.removeChannel(sub);
      window.removeEventListener("threads:refresh", handleManualRefresh);
    };
  }, [loadThreads]);

  return { threads, loading, reload: loadThreads };
}