import { useState, useRef, useEffect } from "react";
import { Menu, Plus, MessageCircle, Search, X } from "lucide-react";
import Avatar from "./Avatar";
import { useThreads } from "../hooks/useThreads";
import { api } from "../lib/api";

export default function DMList({ onOpenMobileSidebar, onSelectThread, allUsers, currentUserId }) {
  const { threads, loading } = useThreads();
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef(null);

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers([]);
      return;
    }

    setSearching(true);
    const query = searchQuery.toLowerCase().trim();
    const filtered = allUsers.filter((u) => {
      if (u.id === currentUserId) return false;
      const fullName = (u.full_name || "").toLowerCase();
      const username = (u.username || "").toLowerCase();
      return fullName.includes(query) || username.includes(query);
    });
    setFilteredUsers(filtered);
    setSearching(false);
  }, [searchQuery, allUsers, currentUserId]);

  // Focus search input when modal opens
  useEffect(() => {
    if (showNewMessage && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [showNewMessage]);

  async function startNewDM(userId) {
    try {
      const response = await api.post(`/api/dm/threads/${userId}`, {});
      if (response && response.threadId) {
        setShowNewMessage(false);
        setSearchQuery("");
        setFilteredUsers([]);
        onSelectThread(response.threadId, userId);
      }
    } catch (err) {
      console.error("Failed to start DM thread:", err);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <button className="lg:hidden" onClick={onOpenMobileSidebar}>
          <Menu size={22} className="text-gray-700 dark:text-gray-200" />
        </button>
        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Direct Messages</span>
        <div className="relative ml-auto">
          <button
            onClick={() => setShowNewMessage((v) => !v)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            title="New message"
          >
            <Plus size={19} className="text-indigo-500" />
          </button>
          
          {showNewMessage && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => {
                setShowNewMessage(false);
                setSearchQuery("");
                setFilteredUsers([]);
              }} />
              <div className="absolute right-0 mt-1 w-64 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-80 overflow-y-auto">
                {/* Search input */}
                <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or username..."
                      className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <X size={14} className="text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Results */}
                <div className="max-h-48 overflow-y-auto">
                  {searching && (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {!searching && searchQuery.trim() && filteredUsers.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">
                      No users found for "{searchQuery}"
                    </div>
                  )}

                  {!searching && filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => startNewDM(u.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
                    >
                      <Avatar 
                        name={u.full_name} 
                        color={u.avatar_color} 
                        size={7} 
                        status={u.status}
                        imageUrl={u.avatar_url}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-gray-800 dark:text-gray-100 truncate">
                          {u.full_name}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          @{u.username}
                        </div>
                      </div>
                    </button>
                  ))}

                  {!searching && !searchQuery.trim() && (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">
                      Type a name or username to search
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && threads.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-400 flex flex-col items-center gap-3">
            <MessageCircle size={28} />
            <div>
              No conversations yet.
              <br />
              Tap <Plus size={13} className="inline" /> above to start one.
            </div>
          </div>
        )}

        {threads.map((t) => {
          const hasUnread = t.unreadCount > 0;
          return (
            <button
              key={t.threadId}
              onClick={() => onSelectThread(t.threadId, t.otherUser?.id)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Avatar
                name={t.otherUser?.full_name || "?"}
                color={t.otherUser?.avatar_color}
                size={11}
                status={t.otherUser?.status}
                imageUrl={t.otherUser?.avatar_url}
              />
              <div className="min-w-0 flex-1">
                <div className={`text-sm truncate ${hasUnread ? "font-bold text-gray-900 dark:text-gray-100" : "font-medium text-gray-900 dark:text-gray-100"}`}>
                  {t.otherUser?.full_name || "Unknown"}
                </div>
                <div className={`text-xs truncate ${hasUnread ? "text-gray-700 dark:text-gray-200 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                  {t.lastMessage?.content || "Say hello 👋"}
                </div>
              </div>
              {hasUnread && (
                <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-600 text-white text-[11px] font-semibold flex items-center justify-center">
                  {t.unreadCount > 99 ? "99+" : t.unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}