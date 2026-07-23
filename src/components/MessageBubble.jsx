import { useState } from "react";
import { FileText, Download, MoreHorizontal, Pencil, Trash2, Check, X, Reply, Share2 } from "lucide-react";
import Avatar from "./Avatar";
import ConfirmModal from "./ConfirmModal";
import ImageModal from "./ImageModal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function AttachmentView({ attachment }) {
  const fileUrl = attachment.url || attachment.file_url;
  const fileType = attachment.file_type || attachment.fileType || "";
  const fileName = attachment.file_name || attachment.fileName || "attachment";

  const isImage = fileType.startsWith("image/");
  const isAudio = fileType.startsWith("audio/") || fileType.includes("webm") || fileName.includes("voice-note");
  const [imageModalOpen, setImageModalOpen] = useState(false);

  if (isImage) {
    return (
      <>
        <button
          onClick={() => setImageModalOpen(true)}
          className="block mt-1 cursor-pointer"
        >
          <img
            src={fileUrl}
            alt={fileName}
            className="max-w-[240px] max-h-[240px] rounded-xl object-cover border border-black/5 hover:opacity-90 transition-opacity"
            loading="lazy"
          />
        </button>
        {imageModalOpen && (
          <ImageModal 
            imageUrl={fileUrl} 
            onClose={() => setImageModalOpen(false)} 
          />
        )}
      </>
    );
  }

  if (isAudio) {
    return (
      <audio controls src={fileUrl} className="mt-1 max-w-[240px] h-10">
        Your browser doesn't support audio playback.
      </audio>
    );
  }

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      download
      className="mt-1 flex items-center gap-2 bg-white/10 dark:bg-black/20 rounded-xl px-3 py-2 max-w-[240px]"
    >
      <FileText size={18} className="flex-shrink-0" />
      <span className="text-sm truncate flex-1">{fileName}</span>
      <Download size={15} className="flex-shrink-0 opacity-70" />
    </a>
  );
}

export default function MessageBubble({ 
  message, 
  showSender = true, 
  onReact, 
  onEdit, 
  onDelete,
  onReply,
  onShare 
}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isMe = message.sender?.id === user?.id || message.sender_id === user?.id;
  const hasText = message.content && message.content.trim().length > 0;
  
  const directUrl = message.file_url || message.url || message.media_url || message.image_url;
  const directType = message.file_type || message.fileType || (directUrl ? "image/" : "");
  const directName = message.file_name || message.fileName || "attachment";

  const rawAttachments = Array.isArray(message.attachments) && message.attachments.length > 0 
    ? message.attachments 
    : directUrl
      ? [{ id: message.id || "inline", url: directUrl, file_type: directType, file_name: directName }] 
      : [];

  const attachments = Array.from(
    new Map(rawAttachments.map(a => [a.url || a.file_url, a])).values()
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content || "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const reactionCounts = (message.reactions || []).reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  const bubbleColor = isMe
    ? "bg-indigo-600 text-white"
    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100";

  function startEdit() {
    setDraft(message.content || "");
    setEditing(true);
    setMenuOpen(false);
  }

  async function saveEdit() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === message.content) {
      setEditing(false);
      return;
    }
    try {
      await onEdit?.(message.id, trimmed);
      setEditing(false);
      showToast("Message edited", "success");
    } catch (err) {
      console.error("Failed to edit message:", err);
      showToast("Couldn't edit message", "error");
    }
  }

  function handleDeleteClick() {
    setMenuOpen(false);
    setConfirmingDelete(true);
  }

  async function confirmDelete() {
    try {
      await onDelete?.(message.id);
      showToast("Message deleted", "success");
    } catch (err) {
      console.error("Failed to delete message:", err);
      showToast("Couldn't delete message", "error");
    }
    setConfirmingDelete(false);
  }

  function handleReply() {
    setMenuOpen(false);
    if (onReply) {
      onReply(message);
    }
  }

  async function handleShare() {
    setMenuOpen(false);
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Message',
          text: message.content || 'Check out this message',
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        const text = message.content || 'Check out this message';
        await navigator.clipboard.writeText(text);
        showToast("Message copied to clipboard", "success");
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Share failed:", err);
        showToast("Couldn't share message", "error");
      }
    }
  }

  const editControls = (
    <div key="edit-controls" className="flex flex-col gap-1.5 mt-1 w-full max-w-[280px]">
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            saveEdit();
          }
          if (e.key === "Escape") setEditing(false);
        }}
        rows={2}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setEditing(false)}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
        >
          <X size={14} />
        </button>
        <button
          onClick={saveEdit}
          className="p-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Check size={14} />
        </button>
      </div>
    </div>
  );

  const actionMenu = !editing && (onEdit || onDelete || onReply || onShare) && (
    <div key="action-menu" className="relative inline-block">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        aria-label="Message actions"
      >
        <MoreHorizontal size={15} className="text-gray-400" />
      </button>
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div className={`absolute ${isMe ? 'right-0' : 'left-0'} mt-1 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg py-1 z-20`}>
            {/* Reply - available for all messages */}
            {onReply && (
              <button
                onClick={handleReply}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Reply size={14} /> Reply
              </button>
            )}
            
            {/* Share - available for all messages */}
            {onShare && (
              <button
                onClick={handleShare}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Share2 size={14} /> Share
              </button>
            )}
            
            {/* Edit - only for own messages */}
            {isMe && hasText && onEdit && (
              <button
                onClick={startEdit}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Pencil size={14} /> Edit
              </button>
            )}
            
            {/* Delete - only for own messages */}
            {isMe && onDelete && (
              <button
                onClick={handleDeleteClick}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );

  const deleteModal = (
    <ConfirmModal
      key="delete-modal"
      open={confirmingDelete}
      title="Delete message?"
      message="This can't be undone."
      confirmLabel="Delete"
      danger
      onConfirm={confirmDelete}
      onCancel={() => setConfirmingDelete(false)}
    />
  );

  // For messages without sender info (like in DM view)
  if (!showSender) {
    return (
      <div key={message.id || "bubble-nosender"}>
        <div className={`flex group ${isMe ? "justify-end" : "justify-start"} items-start gap-1`}>
          <div className="max-w-[75%] flex flex-col">
            {editing ? (
              editControls
            ) : (
              <>
                <div className={`px-3.5 py-2 rounded-2xl text-sm whitespace-pre-line ${bubbleColor}`}>
                  {hasText && <div>{message.content}</div>}
                  {attachments.map((a, idx) => (
                    <AttachmentView key={a.id || `att-${message.id}-${idx}`} attachment={a} />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[11px] text-gray-400 ${isMe ? "text-right" : ""}`}>
                    {formatTime(message.created_at)}
                    {message.edited_at && " · edited"}
                  </span>
                  {actionMenu}
                </div>
              </>
            )}
          </div>
        </div>
        {deleteModal}
      </div>
    );
  }

  // For messages with sender info (like in General Chat)
  return (
    <div key={message.id || "bubble-sender"}>
      <div className={`flex gap-3 group ${isMe ? "flex-row-reverse" : ""}`}>
        <Avatar 
          name={message.sender?.full_name} 
          color={message.sender?.avatar_color} 
          size={9}
          imageUrl={message.sender?.avatar_url}
        />
        <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
          <div className={`flex items-center gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {isMe ? "You" : (message.sender?.full_name || message.sender?.username || "User")}
            </span>
            <span className="text-[11px] text-gray-400">
              {formatTime(message.created_at)}
              {message.edited_at && " · edited"}
            </span>
            {actionMenu}
          </div>

          {editing ? (
            editControls
          ) : (
            <>
              <div
                onDoubleClick={() => onReact?.(message.id, "❤️")}
                className={`px-3.5 py-2 rounded-2xl text-sm whitespace-pre-line cursor-pointer ${bubbleColor}`}
                title="Double-click to react ❤️"
              >
                {hasText && <div>{message.content}</div>}
                {attachments.map((a, idx) => (
                  <AttachmentView key={a.id || `att-${message.id}-${idx}`} attachment={a} />
                ))}
              </div>
              {Object.keys(reactionCounts).length > 0 && (
                <div className="mt-1 flex gap-1 flex-wrap">
                  {Object.entries(reactionCounts).map(([emoji, count]) => (
                    <span
                      key={emoji}
                      className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5 text-xs text-gray-700 dark:text-gray-200"
                    >
                      {emoji} {count}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {deleteModal}
    </div>
  );
}