import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function useThreads() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadThreads() {
      try {
        const data = await api.get("/api/dm/threads");
        setThreads(data);
      } catch (error) {
        console.error("Failed to load DM threads:", error);
      } finally {
        setLoading(false);
      }
    }

    loadThreads();
  }, []);

  return {
    threads,
    loading,
  };
}