import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import { usePresence } from "../hooks/usePresence";
import { api } from "../lib/api";

export default function RightPanel({ mode, otherUserId, mobileOpen, onClose }) {
  const onlineUsers = usePresence();
  const [otherUser, setOtherUser] = useState(null);

  useEffect(() => {
    if (mode === "dm" && otherUserId) {
      api.get(`/profiles/${otherUserId}`).then(setOtherUser).catch(() => {});
    }
  }, [mode, otherUserId]);

  const content =
    mode === "dm" && otherUser ? (
      <div className="p-5">
        <div className="text-xs font-semibold text-gray-400 mb-3">ABOUT</div>
        <div className="flex flex-col items-center text-center">
          <Avatar 
            name={otherUser.full_name} 
            color={otherUser.avatar_color} 
            size={22} 
            status={otherUser.status}
            imageUrl={otherUser.avatar_url}
          />
          <div className="mt-3 font-semibold text-gray-900 dark:text-gray-100">{otherUser.full_name}</div>
          <div className="text-xs text-gray-500 capitalize">{otherUser.status}</div>
        </div>
        {otherUser.role && (
          <div className="mt-5 text-sm text-gray-600 dark:text-gray-300">{otherUser.role}</div>
        )}
        {otherUser.bio && (
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{otherUser.bio}</div>
        )}
      </div>
    ) : (
      <div className="p-5">
        <div className="text-xs font-semibold text-gray-400 mb-3">
          ONLINE USERS ({onlineUsers.filter((u) => u.status === "online").length})
        </div>
        <div className="space-y-3">
          {onlineUsers.map((u) => (
            <div key={u.id} className="flex items-center gap-3">
              <Avatar 
                name={u.full_name} 
                color={u.avatar_color} 
                size={8} 
                status={u.status}
                imageUrl={u.avatar_url}
              />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                  {u.full_name}
                </div>
                <div className="text-xs text-gray-500 capitalize">{u.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  return (
    <>
      <div className="hidden xl:flex flex-col w-72 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0 overflow-y-auto">
        {content}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 shadow-xl overflow-y-auto">
            {content}
          </div>
        </div>
      )}
    </>
  );
}