import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { api } from "../lib/api";

export function useRealtimeDM(threadId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!threadId) return;
    setLoading(true);
    api.get(`/api/dm/threads/${threadId}/messages`)
      .then((data) => {
        // Ensure every message object has an array for attachments
        const normalized = (data || []).map((m) => ({
          ...m,
          attachments: m.attachments || []
        }));
        setMessages(normalized);
      })
      .catch((err) => console.error("Failed to load DM messages:", err))
      .finally(() => setLoading(false));
  }, [threadId]);

  useEffect(() => {
    if (!threadId) return;
    const suffix = Math.random().toString(36).slice(2);

    const msgSub = supabase
      .channel(`dm:${threadId}:${suffix}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dm_messages", filter: `thread_id=eq.${threadId}` },
        async (payload) => {
          const { data: sender } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_color")
            .eq("id", payload.new.sender_id)
            .single();

          setMessages((prev) => {
            const merged = new Map(prev.map((m) => [m.id, m]));
            // Preserve existing attachments if they were already populated locally
            const existing = merged.get(payload.new.id);
            merged.set(payload.new.id, { 
              ...payload.new, 
              sender, 
              attachments: existing?.attachments || [] 
            });
            return Array.from(merged.values());
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "dm_messages", filter: `thread_id=eq.${threadId}` },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "dm_messages" },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .subscribe();

    const attachSub = supabase
      .channel(`attachments:dm:${threadId}:${suffix}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attachments", filter: "message_type=eq.dm" },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.new.message_id
                ? { 
                    ...m, 
                    attachments: [...(m.attachments || []).filter(a => a.id !== payload.new.id), payload.new] 
                  }
                : m
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgSub);
      supabase.removeChannel(attachSub);
    };
  }, [threadId]);

  const sendMessage = useCallback(
    async (content, attachment) => {
      let textContent = content && content.trim() !== "" ? content : null;
      if (!textContent && attachment) {
        textContent = `Sent an attachment: ${attachment.fileName || "file"}`;
      }

      const msg = await api.post(`/api/dm/threads/${threadId}/messages`, { 
        content: textContent || "" 
      });

      let attachRecord = null;
      if (attachment) {
        try {
          attachRecord = await api.post("/api/upload/attach", {
            message_id: msg.id,
            message_type: "dm",
            url: attachment.url,
            file_type: attachment.fileType,
            file_name: attachment.fileName,
          });
        } catch (uploadErr) {
          console.error("Failed to save attachment record:", uploadErr);
        }
      }

      setMessages((prev) => {
        const merged = new Map(prev.map((m) => [m.id, m]));
        const currentAttachments = attachRecord ? [attachRecord] : [];
        merged.set(msg.id, { ...msg, attachments: currentAttachments });
        return Array.from(merged.values());
      });
    },
    [threadId]
  );

  const editMessage = useCallback(
    async (messageId, newContent) => {
      const updated = await api.patch(`/api/dm/threads/${threadId}/messages/${messageId}`, { content: newContent });
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...updated } : m)));
    },
    [threadId]
  );

  const deleteMessage = useCallback(
    async (messageId) => {
      await api.delete(`/api/dm/threads/${threadId}/messages/${messageId}`);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    },
    [threadId]
  );

  return { messages, loading, sendMessage, editMessage, deleteMessage };
}