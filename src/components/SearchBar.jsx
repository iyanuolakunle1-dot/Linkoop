import { Search, X, Hash, MessageSquare } from "lucide-react";
import { useSearch } from "../hooks/useSearch";
import Avatar from "./Avatar";

function highlightSnippet(text, query) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, 60);
  const start = Math.max(0, idx - 20);
  const end = Math.min(text.length, idx + query.length + 30);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}

export default function SearchBar({ onSelectUser, onSelectChannelMessage, onSelectDmMessage }) {
  const { query, setQuery, results, loading, open, setOpen, clear } = useSearch();
  const hasResults =
    results.users.length > 0 || results.channelMessages.length > 0 || results.dmMessages.length > 0;

  return (
    <div className="relative flex-1 max-w-md hidden sm:block">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        placeholder="Search messages, users..."
        className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 rounded-full pl-9 pr-8 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {query && (
        <button onClick={clear} className="absolute right-2.5 top-1/2 -translate-y-1/2">
          <X size={15} className="text-gray-400" />
        </button>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 mt-2 max-h-96 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg z-20">
            {loading && (
              <div className="p-4 text-center text-sm text-gray-400">Searching...</div>
            )}

            {!loading && !hasResults && (
              <div className="p-4 text-center text-sm text-gray-400">No results for "{query}"</div>
            )}

            {!loading && results.users.length > 0 && (
              <div className="py-2">
                <div className="px-3 pb-1 text-xs font-semibold text-gray-400">PEOPLE</div>
                {results.users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSelectUser(u.id);
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                  >
                    <Avatar name={u.full_name} color={u.avatar_color} size={7} status={u.status} />
                    <div className="min-w-0">
                      <div className="text-sm text-gray-900 dark:text-gray-100 truncate">{u.full_name}</div>
                      <div className="text-xs text-gray-400">@{u.username}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loading && results.channelMessages.length > 0 && (
              <div className="py-2 border-t border-gray-100 dark:border-gray-800">
                <div className="px-3 pb-1 text-xs font-semibold text-gray-400">GENERAL CHAT</div>
                {results.channelMessages.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectChannelMessage();
                      setOpen(false);
                    }}
                    className="w-full flex items-start gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                  >
                    <Hash size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500">{m.sender?.full_name}</div>
                      <div className="text-sm text-gray-800 dark:text-gray-200 truncate">
                        {highlightSnippet(m.content, query)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loading && results.dmMessages.length > 0 && (
              <div className="py-2 border-t border-gray-100 dark:border-gray-800">
                <div className="px-3 pb-1 text-xs font-semibold text-gray-400">DIRECT MESSAGES</div>
                {results.dmMessages.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectDmMessage(m.thread_id, m.sender?.id);
                      setOpen(false);
                    }}
                    className="w-full flex items-start gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                  >
                    <MessageSquare size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500">{m.sender?.full_name}</div>
                      <div className="text-sm text-gray-800 dark:text-gray-200 truncate">
                        {highlightSnippet(m.content, query)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}