import { useState } from "react";
import { FileText, Download, MoreHorizontal, Pencil, Trash2, Check, X } from "lucide-react";
import Avatar from "./Avatar";
import ConfirmModal from "./ConfirmModal";
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
  // Normalize URL and file_type mapping from different database/payload structures
  const fileUrl = attachment.url || attachment.file_url;
  const fileType = attachment.file_type || attachment.fileType || "";
  const fileName = attachment.file_name || attachment.fileName || "attachment";

  const isImage = fileType.startsWith("image/");
  const isAudio = fileType.startsWith("audio/") || fileType.includes("webm") || fileName.includes("voice-note");

  if (isImage) {
    return (
      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block mt-1">
        <img
          src={fileUrl}
          alt={fileName}
          className="max-w-[240px] max-h-[240px] rounded-xl object-cover border border-black/5"
          loading="lazy"
        />
      </a>
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

export default function MessageBubble({ message, showSender = true, onReact, onEdit, onDelete }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isMe = message.sender?.id === user?.id || message.sender_id === user?.id;
  const hasText = message.content && message.content.trim().length > 0;
  
  // Robust attachment resolution supporting array collections or flat inline fields
  const attachments = Array.isArray(message.attachments) && message.attachments.length > 0 
    ? message.attachments 
    : (message.file_url || message.url)
      ? [{ id: message.id || "inline", url: message.file_url || message.url, file_type: message.file_type || message.fileType, file_name: message.file_name || message.fileName }] 
      : [];

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

  const actionMenu = isMe && !editing && (onEdit || onDelete) && (
    <div key="action-menu" className="relative">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
      >
        <MoreHorizontal size={15} className="text-gray-400" />
      </button>
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg py-1 z-20">
            {hasText && onEdit && (
              <button
                onClick={startEdit}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Pencil size={13} /> Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDeleteClick}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Trash2 size={13} /> Delete
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

  if (!showSender) {
    return (
      <div key={message.id || "bubble-nosender"}>
        <div className={`flex group ${isMe ? "justify-end" : "justify-start"}`}>
          {isMe && <div className="mr-1 self-center">{actionMenu}</div>}
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
                <span className={`text-[11px] mt-1 text-gray-400 ${isMe ? "text-right" : ""}`}>
                  {formatTime(message.created_at)}
                  {message.edited_at && " · edited"}
                </span>
              </>
            )}
          </div>
        </div>
        {deleteModal}
      </div>
    );
  }

  return (
    <div key={message.id || "bubble-sender"}>
      <div className={`flex gap-3 group ${isMe ? "flex-row-reverse" : ""}`}>
        <Avatar name={message.sender?.full_name} color={message.sender?.avatar_color} size={9} />
        <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
          <div className={`flex items-baseline gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
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