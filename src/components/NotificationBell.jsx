import { useState } from "react";
import { Bell, MessageSquare } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import Avatar from "./Avatar";

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function NotificationBell({ onOpenThread }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  function handleClickNotification(n) {
    if (!n.read) markRead(n.id);
    setOpen(false);
    if (n.type === "dm_message" && n.thread_id) {
      onOpenThread(n.thread_id, n.actor?.id);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 relative hidden sm:block"
      >
        <Bell size={18} className="text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg z-20">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-indigo-500 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-400">You're all caught up 🎉</div>
            )}

            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClickNotification(n)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  !n.read ? "bg-indigo-50/50 dark:bg-indigo-500/10" : ""
                }`}
              >
                <Avatar 
                  name={n.actor?.full_name} 
                  color={n.actor?.avatar_color} 
                  size={8}
                  imageUrl={n.actor?.avatar_url}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    <span className="font-medium">{n.actor?.full_name}</span>{" "}
                    <span className="text-gray-500 dark:text-gray-400">sent you a message</span>
                  </div>
                  {n.message_preview && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {n.message_preview}
                    </div>
                  )}
                  <div className="text-[11px] text-gray-400 mt-0.5">{timeAgo(n.created_at)}</div>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}