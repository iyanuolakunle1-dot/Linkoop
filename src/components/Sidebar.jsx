import { useEffect, useState } from "react";
import {
  Plus, Globe, MessageSquare, User as UserIcon, X, MessageCircle,
} from "lucide-react";
import Avatar from "./Avatar";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({
  activeView,
  onSelectGeneral,
  onSelectDM,
  onSelectProfile,
  selectedDMUserId,
  mobileOpen,
  onCloseMobile,
}) {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [threads, setThreads] = useState([]);
  const [showNewMessage, setShowNewMessage] = useState(false);

  // Fetch users and DM threads on mount
  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      try {
        const [usersData, threadsData] = await Promise.all([
          api.get("/api/profiles"),
          api.get("/api/dm/threads").catch(() => [])
        ]);
        if (isMounted) {
          setAllUsers(usersData || []);
          setThreads(threadsData || []);
        }
      } catch (err) {
        console.error("Failed to load sidebar data:", err);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  async function startNewDM(userId) {
    try {
      const response = await api.post(`/api/dm/threads/${userId}`, {});
      if (response && response.threadId) {
        setShowNewMessage(false);
        onSelectDM(response.threadId, userId);
      }
    } catch (err) {
      console.error("Failed to start DM thread:", err);
    }
  }

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 w-72">
      <div className="p-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <MessageSquare className="w-4.5 h-4.5 text-white" size={18} />
        </div>
        <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
          Link<span className="text-indigo-500">Up</span>
        </span>
        <button className="ml-auto lg:hidden" onClick={onCloseMobile}>
          <X size={20} className="text-gray-500" />
        </button>
      </div>

      <div className="px-3 pb-2">
        <div className="relative w-full">
          <button
            onClick={() => setShowNewMessage((v) => !v)}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl py-2.5 transition-colors"
          >
            <Plus size={16} /> New Message
          </button>

          {showNewMessage && (
            <div className="absolute left-0 right-0 mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-64 overflow-y-auto">
              {allUsers
                .filter((u) => u && u.id && u.id !== user?.id)
                .map((u) => (
                  <button
                    key={`user-${u.id}`}
                    onClick={() => startNewDM(u.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                  >
                    <Avatar name={u.full_name} color={u.avatar_color} size={7} status={u.status} />
                    <span className="text-sm text-gray-800 dark:text-gray-100">{u.full_name}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      <nav className="px-3 py-2 space-y-1">
        <button
          onClick={onSelectGeneral}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeView === "general"
              ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Globe size={18} /> General Chat
        </button>
        <button
          onClick={onSelectProfile}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeView === "profile"
              ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <UserIcon size={18} /> Profile
        </button>
      </nav>

      <div className="px-4 pt-3 pb-1 text-xs font-semibold tracking-wide text-gray-400">
        DIRECT MESSAGES
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {(!threads || threads.length === 0) && (
          <div className="px-3 py-6 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
            <MessageCircle size={22} />
            No conversations yet
          </div>
        )}
        {threads && threads.map((t) => {
          if (!t || !t.threadId) return null;
          const hasUnread = t.unreadCount > 0;
          return (
            <button
              key={`thread-${t.threadId}`}
              onClick={() => onSelectDM(t.threadId, t.otherUser?.id)}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-colors text-left ${
                selectedDMUserId === t.otherUser?.id
                  ? "bg-indigo-50 dark:bg-indigo-500/15"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Avatar
                name={t.otherUser?.full_name || "?"}
                color={t.otherUser?.avatar_color}
                size={9}
                status={t.otherUser?.status}
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
                <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-semibold flex items-center justify-center">
                  {t.unreadCount > 99 ? "99+" : t.unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:flex flex-col flex-shrink-0 border-r border-gray-200 dark:border-gray-800">
        {content}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div className="absolute inset-0 bg-black/40" onClick={onCloseMobile} />
          <div className="relative z-10 flex flex-col h-full shadow-xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}