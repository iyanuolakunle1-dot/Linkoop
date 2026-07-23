import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Phone, Video, MoreHorizontal } from "lucide-react";
import { useRealtimeDM } from "../hooks/useRealtimeDM";
import { api } from "../lib/api";
import Avatar from "./Avatar";
import MessageBubble from "./MessageBubble";
import Composer from "./Composer";

export default function DirectMessage({ threadId, otherUserId, onBack, onToggleRightPanel }) {
  const [otherUser, setOtherUser] = useState(null);
  const scrollRef = useRef(null);
  const { messages, loading, sendMessage, editMessage, deleteMessage } = useRealtimeDM(threadId);

  useEffect(() => {
    if (!otherUserId) return;
    api.get(`/profiles/${otherUserId}`).then(setOtherUser).catch(console.error);
  }, [otherUserId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!threadId) return;

    api.patch(`/dm/threads/${threadId}/read`)
      .then(() => window.dispatchEvent(new Event("threads:refresh")))
      .catch((err) => console.error("Failed to mark thread as read:", err));
  }, [threadId, messages.length]);

  // Handle sending message along with attachments/files correctly
  const handleSendMessage = async (content, attachmentFile) => {
    if (!sendMessage) return;
    try {
      await sendMessage(content, attachmentFile);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  if (!threadId) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
        Select a conversation to start chatting
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <button className="lg:hidden" onClick={onBack}>
          <ArrowLeft size={20} className="text-gray-700 dark:text-gray-200" />
        </button>
        <Avatar name={otherUser?.full_name} color={otherUser?.avatar_color} size={9} status={otherUser?.status} />
        <div className="min-w-0">
          <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            {otherUser?.full_name || "Loading..."}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{otherUser?.status}</div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 hidden sm:block">
            <Phone size={17} className="text-indigo-500" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 hidden sm:block">
            <Video size={17} className="text-indigo-500" />
          </button>
          <button
            onClick={onToggleRightPanel}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <MoreHorizontal size={17} className="text-gray-500" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
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
            showSender={false}
            onEdit={editMessage}
            onDelete={deleteMessage}
          />
        ))}
      </div>

      <Composer 
        onSend={handleSendMessage} 
        enableVoiceNotes={true} 
        showAttachments={true} 
      />
    </div>
  );
}