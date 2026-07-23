import { useRef, useState } from "react";
import { Plus, Smile, Image as ImageIcon, Send, X, FileText, Mic, Square, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";

function formatSeconds(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function Composer({ onSend, disabled }) {
  const [text, setText] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { recording, seconds, start, stop, cancel } = useVoiceRecorder();

  async function uploadFile(file, fileNameOverride) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file, fileNameOverride || file.name);

      const { data: { session } } = await supabase.auth.getSession();

      // FIXED: Added /api prefix to match standard backend route mounting (/api/upload)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Upload failed (${res.status}): ${errorText}`);
      }
      return await res.json();
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
      onSend("", {
        url: uploaded.url,
        fileName: uploaded.fileName,
        fileType: uploaded.fileType,
      });
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
  }

  if (recording) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
        <button
          onClick={() => cancel()}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-red-500 flex-shrink-0"
          title="Cancel recording"
        >
          <Trash2 size={19} />
        </button>
        <div className="flex-1 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          <span className="truncate">Recording... {formatSeconds(seconds)}</span>
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
      {pendingFile && (
        <div className="px-4 pt-3 flex items-center gap-2">
          <div className="relative flex-shrink-0">
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

      <form onSubmit={handleSubmit} className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-3">
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
          title="Attach a file"
        >
          <Plus size={19} className="text-gray-500" />
        </button>

        <div className="flex-1 flex items-center bg-gray-100 dark:bg-gray-800 rounded-full pl-3 pr-2 py-1.5 min-w-0">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) handleSubmit(e);
            }}
            placeholder={uploading ? "Uploading..." : "Type a message..."}
            disabled={uploading}
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 min-w-0"
          />
          <button type="button" className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0">
            <Smile size={18} />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
          >
            <ImageIcon size={18} />
          </button>
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