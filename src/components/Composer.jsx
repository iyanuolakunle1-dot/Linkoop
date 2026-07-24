import { useRef, useState, useEffect } from "react";
import { Plus, Image as ImageIcon, Send, X, FileText, Mic, Square, Trash2, Smile } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import EmojiPicker from "./EmojiPicker";

function formatSeconds(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function Composer({ 
  onSend, 
  disabled, 
  replyTo = null, 
  onCancelReply = null 
}) {
  const [text, setText] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);
  const { recording, seconds, start, stop, cancel } = useVoiceRecorder();

  useEffect(() => {
    if (replyTo && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [replyTo]);

  async function uploadFile(file, fileNameOverride) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file, fileNameOverride || file.name);

      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      return data;
    } finally {
      setUploading(false);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploaded = await uploadFile(file);
      setPendingFile({
        url: uploaded.url,
        fileName: uploaded.fileName,
        fileType: uploaded.fileType,
        previewUrl: uploaded.fileType?.startsWith("image/") ? uploaded.url : null,
      });
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      e.target.value = "";
    }
  }

  async function handleMicClick() {
    if (!recording) {
      try {
        await start();
      } catch {
        alert("Couldn't access your microphone. Check browser permissions.");
      }
      return;
    }

    const blob = await stop();
    if (!blob || blob.size === 0) return;

    try {
      const uploaded = await uploadFile(blob, "voice-note.webm");
      
      // Send the voice note immediately
      await onSend("", {
        url: uploaded.url,
        fileName: uploaded.fileName,
        fileType: uploaded.fileType,
      });
      
      // Clear any pending file state
      setPendingFile(null);
    } catch (err) {
      console.error("Voice note upload failed:", err);
    }
  }

  function handleSubmit(e) {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && !pendingFile) return;
    if (disabled || uploading) return;

    onSend(trimmed, pendingFile);
    setText("");
    setPendingFile(null);
    
    if (onCancelReply) {
      onCancelReply();
    }
  }

  function insertEmoji(emoji) {
    const input = textInputRef.current;

    if (!input) {
      setText((t) => t + emoji);
      return;
    }

    const start = input.selectionStart ?? text.length;
    const end = input.selectionEnd ?? text.length;
    const newText = text.slice(0, start) + emoji + text.slice(end);
    setText(newText);

    requestAnimationFrame(() => {
      const pos = start + emoji.length;
      input.focus();
      input.setSelectionRange(pos, pos);
    });
  }

  if (recording) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
        <button
          onClick={() => cancel()}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-red-500"
          title="Cancel recording"
        >
          <Trash2 size={19} />
        </button>
        <div className="flex-1 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          Recording... {formatSeconds(seconds)}
        </div>
        <button
          onClick={handleMicClick}
          className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex-shrink-0"
          title="Stop and send"
        >
          <Square size={16} fill="white" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
      {replyTo && (
        <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/30 border-b border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 min-w-0">
            <span className="font-medium text-indigo-600 dark:text-indigo-400 flex-shrink-0">Replying to:</span>
            <span className="text-gray-500 dark:text-gray-400 truncate">
              {replyTo.sender?.full_name || "Someone"}: {replyTo.content || "Message"}
            </span>
          </div>
          <button
            onClick={() => {
              if (onCancelReply) onCancelReply();
              if (textInputRef.current) textInputRef.current.focus();
            }}
            className="p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex-shrink-0 ml-2"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>
      )}

      {pendingFile && (
        <div className="px-4 pt-3 flex items-center gap-2">
          <div className="relative">
            {pendingFile.previewUrl ? (
              <img src={pendingFile.previewUrl} alt="" className="w-14 h-14 object-cover rounded-lg" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <FileText size={20} className="text-gray-400" />
              </div>
            )}
            <button
              onClick={() => setPendingFile(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center"
            >
              <X size={12} />
            </button>
          </div>
          <span className="text-xs text-gray-500 truncate max-w-[160px]">{pendingFile.fileName}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 sm:px-4 py-3">
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
          title="Attach an image or file"
        >
          <ImageIcon size={19} className="text-gray-500" />
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0 hidden sm:block"
          title="Attach a file"
        >
          <Plus size={19} className="text-gray-500" />
        </button>

        <div className="flex-1 flex items-center bg-gray-100 dark:bg-gray-800 rounded-full pl-4 pr-2 py-1.5">
          <input
            ref={textInputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) handleSubmit(e);
            }}
            placeholder={replyTo ? "Type your reply..." : (uploading ? "Uploading..." : "Type a message...")}
            disabled={uploading}
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />

          <div className="relative">
            <button
              type="button"
              onClick={() => setEmojiOpen((v) => !v)}
              className="p-1.5"
            >
              <Smile size={18} className="text-gray-400" />
            </button>

            {emojiOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setEmojiOpen(false)} />
                <div className="absolute bottom-full right-0 mb-2 z-20">
                  <EmojiPicker
                    onSelect={(emoji) => {
                      insertEmoji(emoji);
                      setEmojiOpen(false);
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {text.trim() || pendingFile ? (
          <button
            type="submit"
            disabled={disabled || uploading}
            className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex-shrink-0"
          >
            <Send size={17} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={uploading || disabled}
            className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex-shrink-0"
            title="Record a voice note"
          >
            <Mic size={17} />
          </button>
        )}
      </form>
    </div>
  );
}