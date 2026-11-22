"use client";

import { useEffect, useRef, useState } from "react";
import { getAdminSocket } from "@/lib/socket.client";
import type { ConversationRow, MessageRow } from "@/lib/socket.types";

interface Props {
  initialConversations: ConversationRow[];
  adminId: string;
  adminName: string;
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = (name || "?")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const palette = [
    ["#dbeafe", "#2563eb"],
    ["#dcfce7", "#16a34a"],
    ["#fce7f3", "#db2777"],
    ["#fef3c7", "#d97706"],
    ["#ede9fe", "#7c3aed"],
    ["#ffedd5", "#ea580c"],
  ];
  const [bg, fg] = palette[(name || "?").charCodeAt(0) % palette.length];
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36, background: bg, color: fg }}
    >
      {initials}
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "এখনই";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const STATUS_FILTERS = [
  { key: "all", label: "সব" },
  { key: "open", label: "খোলা" },
  { key: "pending", label: "অপেক্ষারত" },
  { key: "closed", label: "বন্ধ" },
] as const;

export default function InboxClient({ initialConversations, adminId, adminName }: Props) {
  const [conversations, setConversations] = useState<ConversationRow[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "pending" | "closed">("all");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIdRef = useRef<string | null>(null);

  const socket = getAdminSocket();

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("conversation:new", (conv) => {
      setConversations((prev) => [conv, ...prev]);
    });

    socket.on("conversation:updated", (data) => {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === data.conversationId
            ? {
                ...c,
                lastMessage: data.lastMessage,
                lastMessageAt: data.lastMessageAt,
                unreadByAdmin: data.unreadByAdmin
                  ? activeIdRef.current === c._id ? 0 : c.unreadByAdmin + 1
                  : c.unreadByAdmin,
              }
            : c,
        ),
      );
    });

    socket.on("conversation:status_changed", ({ conversationId, status }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId ? { ...c, status: status as ConversationRow["status"] } : c,
        ),
      );
    });

    socket.on("new_message", (msg) => {
      if (msg.conversationId === activeIdRef.current) {
        setMessages((prev) => {
          // deduplicate optimistic
          if (prev.find((m) => m._id === msg._id)) return prev;
          return [...prev.filter((m) => !m._id.startsWith("opt-")), msg];
        });
      }
    });

    socket.on("customer:typing", (convId) => {
      if (convId === activeIdRef.current) {
        setTyping(true);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTyping(false), 3000);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("conversation:new");
      socket.off("conversation:updated");
      socket.off("conversation:status_changed");
      socket.off("new_message");
      socket.off("customer:typing");
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  async function openConversation(convId: string) {
    if (convId === activeId) return;
    setLoading(true);
    setMessages([]);
    if (activeId) socket.emit("admin:leave_conversation", activeId);
    socket.emit("admin:join_conversation", convId);
    socket.emit("admin:mark_read", convId);
    activeIdRef.current = convId;
    setActiveId(convId);
    setTyping(false);
    setConversations((prev) =>
      prev.map((c) => (c._id === convId ? { ...c, unreadByAdmin: 0 } : c)),
    );

    try {
      const res = await fetch(`/api/admin/messages/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function sendMessage() {
    if (!input.trim() || !activeId || sending) return;
    setSending(true);
    socket.emit("admin:send_message", {
      conversationId: activeId,
      content: input.trim(),
      adminName,
      adminId,
    });
    const optimistic: MessageRow = {
      _id: `opt-${Date.now()}`,
      conversationId: activeId,
      senderType: "admin",
      senderName: adminName,
      content: input.trim(),
      isRead: true,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setSending(false);
  }

  function closeConversation() {
    if (!activeId) return;
    socket.emit("admin:close_conversation", activeId);
  }

  const activeConv = conversations.find((c) => c._id === activeId);
  const filtered = conversations.filter((c) => filter === "all" || c.status === filter);
  const totalUnread = conversations.reduce((s, c) => s + c.unreadByAdmin, 0);

  return (
    <div
      className="flex overflow-hidden rounded-2xl border"
      style={{
        borderColor: "var(--line)",
        height: "calc(100vh - 11rem)",
        minHeight: 480,
        background: "var(--surface)",
      }}
    >
      {/* ── LEFT: Conversation sidebar ─────────────────────────── */}
      <div
        className="w-72 lg:w-80 flex-shrink-0 flex flex-col border-r"
        style={{ borderColor: "var(--line)" }}
      >
        {/* Sidebar header */}
        <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm">Messages</h2>
              {totalUnread > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: "#ef4444", color: "#fff" }}
                >
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: connected ? "#22c55e" : "#6b7280" }}
              />
              <span className="text-xs" style={{ color: "var(--mute)" }}>
                {connected ? "Live" : "Offline"}
              </span>
            </div>
          </div>

          {/* Filter pills */}
          <div
            className="flex gap-1 p-1 rounded-lg"
            style={{ background: "color-mix(in srgb,var(--line) 50%,var(--surface))" }}
          >
            {STATUS_FILTERS.map((f) => {
              const count =
                f.key === "all"
                  ? conversations.length
                  : conversations.filter((c) => c.status === f.key).length;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="flex-1 text-xs py-1 rounded-md font-medium transition-all"
                  style={{
                    background: filter === f.key ? "var(--surface)" : "transparent",
                    color: filter === f.key ? "var(--ink)" : "var(--mute)",
                    boxShadow: filter === f.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {f.label}
                  {count > 0 && (
                    <span className="ml-1 opacity-60">({count})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
              <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
              </svg>
              <p className="text-sm" style={{ color: "var(--mute)" }}>
                কোনো কথোপকথন নেই
              </p>
            </div>
          )}

          {filtered.map((conv) => {
            const isActive = conv._id === activeId;
            return (
              <button
                key={conv._id}
                onClick={() => openConversation(conv._id)}
                className="w-full text-left px-3 py-3 border-b transition-all"
                style={{
                  borderColor: "var(--line)",
                  background: isActive
                    ? "color-mix(in srgb,var(--ink) 6%,var(--surface))"
                    : "transparent",
                  borderLeft: isActive ? "3px solid var(--ink)" : "3px solid transparent",
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar name={conv.guestName} size={38} />
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                      style={{
                        borderColor: "var(--surface)",
                        background:
                          conv.status === "open"
                            ? "#22c55e"
                            : conv.status === "pending"
                              ? "#f59e0b"
                              : "#9ca3af",
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: isActive ? "var(--ink)" : "var(--ink)" }}
                      >
                        {conv.guestName}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {conv.unreadByAdmin > 0 && (
                          <span
                            className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: "#ef4444", color: "#fff" }}
                          >
                            {conv.unreadByAdmin > 9 ? "9+" : conv.unreadByAdmin}
                          </span>
                        )}
                        <span className="text-[10px]" style={{ color: "var(--mute)" }}>
                          {timeAgo(conv.lastMessageAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs truncate" style={{ color: "var(--mute)" }}>
                      {conv.lastMessage || "কথোপকথন শুরু হয়েছে"}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: Chat area ───────────────────────────────────── */}
      {!activeId ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ background: "var(--bg)" }}>
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: "color-mix(in srgb,var(--line) 60%,var(--surface))" }}
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.3} viewBox="0 0 24 24" style={{ color: "var(--mute)" }}>
              <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-semibold text-base" style={{ color: "var(--ink)" }}>
              একটি কথোপকথন বেছে নিন
            </p>
            <p className="text-sm mt-1.5" style={{ color: "var(--mute)" }}>
              বাম দিকের তালিকা থেকে শুরু করুন
            </p>
          </div>
          {totalUnread > 0 && (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
              style={{ background: "color-mix(in srgb,#ef4444 10%,transparent)", color: "#dc2626" }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
              {totalUnread} অপঠিত বার্তা
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0" style={{ background: "var(--bg)" }}>
          {/* Chat header */}
          <div
            className="flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0"
            style={{ borderColor: "var(--line)", background: "var(--surface)" }}
          >
            <div className="flex items-center gap-3">
              <Avatar name={activeConv?.guestName || "?"} size={40} />
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
                  {activeConv?.guestName}
                </p>
                <p className="text-xs" style={{ color: "var(--mute)" }}>
                  {activeConv?.guestEmail || "Guest"}
                  {typing && (
                    <span className="ml-2" style={{ color: "#22c55e" }}>
                      • টাইপ করছে…
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  background:
                    activeConv?.status === "open"
                      ? "color-mix(in srgb,#22c55e 12%,transparent)"
                      : activeConv?.status === "pending"
                        ? "color-mix(in srgb,#f59e0b 12%,transparent)"
                        : "color-mix(in srgb,#6b7280 12%,transparent)",
                  color:
                    activeConv?.status === "open"
                      ? "#15803d"
                      : activeConv?.status === "pending"
                        ? "#b45309"
                        : "#4b5563",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background:
                      activeConv?.status === "open"
                        ? "#22c55e"
                        : activeConv?.status === "pending"
                          ? "#f59e0b"
                          : "#9ca3af",
                  }}
                />
                {activeConv?.status === "open"
                  ? "খোলা"
                  : activeConv?.status === "pending"
                    ? "অপেক্ষারত"
                    : "বন্ধ"}
              </span>
              {activeConv?.status !== "closed" && (
                <button
                  onClick={closeConversation}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: "color-mix(in srgb,#ef4444 10%,transparent)",
                    color: "#dc2626",
                    border: "1px solid color-mix(in srgb,#ef4444 20%,transparent)",
                  }}
                >
                  বন্ধ করুন
                </button>
              )}
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
            {loading && (
              <div className="flex justify-center py-8">
                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: "var(--mute)" }}>
                  <circle className="opacity-25" cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                </svg>
              </div>
            )}
            {!loading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm" style={{ color: "var(--mute)" }}>
                  এখনো কোনো বার্তা নেই
                </p>
              </div>
            )}
            {!loading && messages.map((msg, i) => {
              const isAdmin = msg.senderType === "admin";
              const prev = messages[i - 1];
              const showDate =
                !prev ||
                new Date(msg.createdAt).toDateString() !==
                  new Date(prev.createdAt).toDateString();

              return (
                <div key={msg._id}>
                  {showDate && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: "var(--surface)",
                          color: "var(--mute)",
                          border: "1px solid var(--line)",
                        }}
                      >
                        {new Date(msg.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                      <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
                    </div>
                  )}
                  <div className={`flex items-end gap-2 ${isAdmin ? "justify-end" : "justify-start"}`}>
                    {!isAdmin && (
                      <Avatar name={msg.senderName} size={28} />
                    )}
                    <div
                      className="max-w-[65%] px-4 py-2.5 text-sm shadow-sm"
                      style={{
                        background: isAdmin ? "var(--ink)" : "var(--surface)",
                        color: isAdmin ? "var(--bg)" : "var(--ink)",
                        borderRadius: isAdmin
                          ? "1.25rem 1.25rem 0.3rem 1.25rem"
                          : "1.25rem 1.25rem 1.25rem 0.3rem",
                        border: isAdmin ? "none" : "1px solid var(--line)",
                        opacity: msg._id.startsWith("opt-") ? 0.7 : 1,
                      }}
                    >
                      <p style={{ lineHeight: 1.5 }}>{msg.content}</p>
                      <p
                        className="text-[10px] mt-1"
                        style={{ opacity: 0.5 }}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {isAdmin && msg._id.startsWith("opt-") && " · sending…"}
                      </p>
                    </div>
                    {isAdmin && (
                      <Avatar name={adminName} size={28} />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {typing && (
              <div className="flex items-end gap-2">
                <Avatar name={activeConv?.guestName || "?"} size={28} />
                <div
                  className="px-4 py-3 rounded-2xl rounded-bl-sm"
                  style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
                >
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{
                          background: "var(--mute)",
                          animationDelay: `${i * 150}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          {activeConv?.status !== "closed" ? (
            <div
              className="flex items-center gap-3 px-4 py-3 border-t flex-shrink-0"
              style={{ borderColor: "var(--line)", background: "var(--surface)" }}
            >
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="বার্তা লিখুন…"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-shadow"
                  style={{
                    background: "var(--bg)",
                    border: "1.5px solid var(--line)",
                    color: "var(--ink)",
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = "var(--ink)";
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = "var(--line)";
                  }}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                style={{ background: "var(--ink)", color: "var(--bg)" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.3} viewBox="0 0 24 24">
                  <path d="m22 2-11 11M22 2 15 22l-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          ) : (
            <div
              className="px-4 py-3 text-center text-sm border-t flex-shrink-0"
              style={{ borderColor: "var(--line)", color: "var(--mute)", background: "var(--surface)" }}
            >
              এই কথোপকথন বন্ধ হয়ে গেছে
            </div>
          )}
        </div>
      )}
    </div>
  );
}
