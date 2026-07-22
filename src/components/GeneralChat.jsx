import { useEffect, useRef, useState } from "react";
import { Hash, Users, Menu } from "lucide-react";
import { useRealtimeMessages } from "../hooks/useRealtimeMessages";
import { usePresence } from "../hooks/usePresence";
import { api } from "../lib/api";
import MessageBubble from "./MessageBubble";
import Composer from "./Composer";

const GENERAL_CHANNEL_SLUG = "general";

export default function GeneralChat({ onOpenMobileSidebar, onToggleRightPanel }) {
  const [channel, setChannel] = useState(null);
  const scrollRef = useRef(null);
  const onlineUsers = usePresence();

  useEffect(() => {
    api.get(`/channels/${GENERAL_CHANNEL_SLUG}`).then(setChannel).catch(console.error);
  }, []);

  const { messages, loading, sendMessage, editMessage, deleteMessage } = useRealtimeMessages(channel?.id);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleReact(messageId, emoji) {
    try {
      await api.post(`/messages/${channel.id}/${messageId}/react`, { emoji });
    } catch (err) {
      console.error(err);
    }
  }

  const onlineCount = onlineUsers.filter((u) => u.status === "online").length;

  return (
    // min-h-0 is required here: without it, this flex column refuses to shrink
    // below its content's natural height, so the message list below never gets
    // a bounded height to scroll within -- the whole page grows instead.
    <div className="flex flex-col flex-1 min-w-0 min-h-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <button className="lg:hidden" onClick={onOpenMobileSidebar}>
          <Menu size={22} className="text-gray-700 dark:text-gray-200" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Hash size={18} className="text-gray-500" />
        </div>
        <div>
          <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">General Chat</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {onlineCount} member{onlineCount === 1 ? "" : "s"} online
          </div>
        </div>
        <button
          onClick={onToggleRightPanel}
          className="ml-auto p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 xl:hidden"
        >
          <Users size={18} className="text-gray-500" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-8">
            No messages yet. Say hello 👋
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            onReact={handleReact}
            onEdit={editMessage}
            onDelete={deleteMessage}
          />
        ))}
      </div>

      <Composer onSend={sendMessage} disabled={!channel} />
    </div>
  );
}