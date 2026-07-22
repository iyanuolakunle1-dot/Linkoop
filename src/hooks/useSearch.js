import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ users: [], channelMessages: [], dmMessages: [] });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults({ users: [], channelMessages: [], dmMessages: [] });
      setOpen(false);
      return;
    }

    setOpen(true);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      api.get(`/search?q=${encodeURIComponent(query.trim())}`)
        .then(setResults)
        .catch(() => setResults({ users: [], channelMessages: [], dmMessages: [] }))
        .finally(() => setLoading(false));
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function clear() {
    setQuery("");
    setResults({ users: [], channelMessages: [], dmMessages: [] });
    setOpen(false);
  }

  return { query, setQuery, results, loading, open, setOpen, clear };
}