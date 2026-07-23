import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { api } from "../lib/api";

export function useRealtimeMessages(channelId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelId) return;
    setLoading(true);
    api.get(`/messages/${channelId}`)
      .then(setMessages)
      .catch((err) => console.error("Failed to load messages:", err))
      .finally(() => setLoading(false));
  }, [channelId]);

  useEffect(() => {
    if (!channelId) return;
    const suffix = Math.random().toString(36).slice(2);

    const msgSub = supabase
      .channel(`messages:${channelId}:${suffix}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` },
        async (payload) => {
          const { data: sender } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_color")
            .eq("id", payload.new.sender_id)
            .single();

          setMessages((prev) => {
            const merged = new Map(prev.map((m) => [m.id, m]));
            merged.set(payload.new.id, { ...payload.new, sender, reactions: [], attachments: [] });
            return Array.from(merged.values());
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .subscribe();

    const attachSub = supabase
      .channel(`attachments:channel:${channelId}:${suffix}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attachments", filter: "message_type=eq.channel" },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.new.message_id
                ? { ...m, attachments: [...(m.attachments || []), payload.new] }
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
  }, [channelId]);

  const sendMessage = useCallback(
    async (content, attachment) => {
      // Package the attachment into an array if it exists
      const attachmentsPayload = attachment ? [{
        url: attachment.url,
        file_type: attachment.fileType,
        file_name: attachment.fileName,
        message_type: "channel"
      }] : [];

      // Send content and attachments together in a single atomic request
      const msg = await api.post(`/messages/${channelId}`, { 
        content: content || "", 
        attachments: attachmentsPayload 
      });

      setMessages((prev) => {
        const merged = new Map(prev.map((m) => [m.id, m]));
        merged.set(msg.id, { ...msg, reactions: [], attachments: msg.attachments || [] });
        return Array.from(merged.values());
      });
    },
    [channelId]
  );

  const editMessage = useCallback(
    async (messageId, newContent) => {
      const updated = await api.patch(`/messages/${channelId}/${messageId}`, { content: newContent });
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...updated } : m)));
    },
    [channelId]
  );

  const deleteMessage = useCallback(
    async (messageId) => {
      await api.delete(`/messages/${channelId}/${messageId}`);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    },
    [channelId]
  );

  return { messages, loading, sendMessage, editMessage, deleteMessage };
}