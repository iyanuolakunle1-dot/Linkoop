import { useState } from "react";
import { Menu, Plus, MessageCircle } from "lucide-react";
import Avatar from "./Avatar";
import { useThreads } from "../hooks/useThreads";
import { api } from "../lib/api";

export default function DMList({ onOpenMobileSidebar, onSelectThread, allUsers, currentUserId }) {
  const { threads, loading } = useThreads();
  const [showNewMessage, setShowNewMessage] = useState(false);

  async function startNewDM(userId) {
    const { threadId } = await api.post(`/dm/threads/${userId}`, {});
    setShowNewMessage(false);
    onSelectThread(threadId, userId);
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
              <div className="fixed inset-0 z-10" onClick={() => setShowNewMessage(false)} />
              <div className="absolute right-0 mt-1 w-56 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                {allUsers
                  .filter((u) => u.id !== currentUserId)
                  .map((u) => (
                    <button
                      key={u.id}
                      onClick={() => startNewDM(u.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                    >
                      <Avatar name={u.full_name} color={u.avatar_color} size={7} status={u.status} />
                      <span className="text-sm text-gray-800 dark:text-gray-100">{u.full_name}</span>
                    </button>
                  ))}
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