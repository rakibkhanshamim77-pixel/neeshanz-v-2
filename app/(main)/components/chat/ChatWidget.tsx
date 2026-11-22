"use client";

import { useEffect, useRef, useState } from "react";
import { getCustomerSocket } from "@/lib/socket.client";
import type { MessageRow } from "@/lib/socket.types";

const GUEST_ID_KEY = "chat_guest_id";
const CONV_ID_KEY = "chat_conv_id";
const GUEST_NAME_KEY = "chat_guest_name";

function getOrCreateGuestId(): string {
  try {
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!id) {
      id = "g-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(GUEST_ID_KEY, id);
    }
    return id;
  } catch {
    return "g-" + Math.random().toString(36).slice(2);
  }
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full animate-bounce"
          style={{
            background: "#9ca3af",
            animationDelay: `${i * 150}ms`,
            animationDuration: "1s",
          }}
        />
      ))}
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [name, setName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [input, setInput] = useState("");
  const [adminTyping, setAdminTyping] = useState(false);
  const [closed, setClosed] = useState(false);
  const [unread, setUnread] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRef = useRef(false);

  const socket = getCustomerSocket();

  useEffect(() => {
    try {
      const savedName = localStorage.getItem(GUEST_NAME_KEY);
      const savedConv = localStorage.getItem(CONV_ID_KEY);
      if (savedName && savedConv) {
        setName(savedName);
        setConversationId(savedConv);
        setStarted(true);
      }
    } catch {}

    socket.connect();

    socket.on("customer:conversation_ready", ({ conversationId: id, status }) => {
      setConversationId(id);
      setClosed(status === "closed");
      setConnecting(false);
      try {
        localStorage.setItem(CONV_ID_KEY, id);
      } catch {}
    });

    socket.on("new_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (!openRef.current) setUnread((u) => u + 1);
    });

    socket.on("admin:typing", () => {
      setAdminTyping(true);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setAdminTyping(false), 3000);
    });

    socket.on("conversation:closed", () => setClosed(true));

    return () => {
      socket.off("customer:conversation_ready");
      socket.off("new_message");
      socket.off("admin:typing");
      socket.off("conversation:closed");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    openRef.current = open;
    if (open) {
      setUnread(0);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, adminTyping, open]);

  function startChat() {
    if (!nameInput.trim()) return;
    const n = nameInput.trim();
    setName(n);
    setStarted(true);
    setConnecting(true);
    try {
      localStorage.setItem(GUEST_NAME_KEY, n);
    } catch {}

    const guestId = getOrCreateGuestId();
    let savedConv: string | null = null;
    try {
      savedConv = localStorage.getItem(CONV_ID_KEY);
    } catch {}

    socket.emit("customer:start", {
      guestId,
      guestName: n,
      conversationId: savedConv || undefined,
    });
  }

  function sendMessage() {
    if (!input.trim() || !conversationId) return;
    socket.emit("customer:send_message", {
      conversationId,
      guestName: name,
      content: input.trim(),
    });
    const optimistic: MessageRow = {
      _id: `opt-${Date.now()}`,
      conversationId,
      senderType: "customer",
      senderName: name,
      content: input.trim(),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
  }

  function handleTyping() {
    if (conversationId) socket.emit("customer:typing", conversationId);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="লাইভ চ্যাট খুলুন"
        className="fixed z-50 flex items-center justify-center transition-all duration-300"
        style={{
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          background: "linear-gradient(135deg,#1a1a1a 0%,#333 100%)",
          color: "#fff",
          boxShadow: open
            ? "0 4px 20px rgba(0,0,0,0.25)"
            : "0 8px 32px rgba(0,0,0,0.3)",
          transform: open ? "scale(0.95)" : "scale(1)",
        }}
      >
        <span
          className="transition-all duration-300"
          style={{
            transform: open ? "rotate(45deg) scale(1.1)" : "rotate(0deg) scale(1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
          )}
        </span>
        {!open && unread > 0 && (
          <span
            className="absolute flex items-center justify-center rounded-full text-[10px] font-black"
            style={{
              top: -4,
              right: -4,
              minWidth: 20,
              height: 20,
              padding: "0 4px",
              background: "#ef4444",
              color: "#fff",
              boxShadow: "0 0 0 2px #fff",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="fixed z-50 flex flex-col overflow-hidden"
          style={{
            bottom: 92,
            right: 24,
            width: "min(384px, calc(100vw - 32px))",
            height: "min(520px, calc(100vh - 120px))",
            borderRadius: 20,
            background: "#fff",
            boxShadow: "0 24px 80px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-4 flex-shrink-0"
            style={{
              background: "linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%)",
              color: "#fff",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">Neeshanz Support</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#4ade80" }} />
                <p className="text-xs" style={{ opacity: 0.7 }}>
                  সাধারণত কয়েক মিনিটে জবাব দেই
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          {!started ? (
            /* Welcome screen */
            <div className="flex-1 flex flex-col px-5 pt-6 pb-5 gap-5" style={{ background: "#fafafa" }}>
              <div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "#1a1a1a" }}
                >
                  <svg className="w-7 h-7" fill="#fff" viewBox="0 0 24 24">
                    <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold" style={{ color: "#111" }}>
                  হ্যালো! 👋
                </h3>
                <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
                  আমাদের সাথে সরাসরি কথা বলুন। শুরু করতে আপনার নাম দিন।
                </p>
              </div>

              {/* Suggested topics */}
              <div className="flex flex-wrap gap-2">
                {["অর্ডার ট্র্যাক", "পণ্যের তথ্য", "রিটার্ন পলিসি"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setNameInput((v) => v)}
                    className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                    style={{
                      background: "#f3f4f6",
                      color: "#374151",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="space-y-3 mt-auto">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && startChat()}
                  placeholder="আপনার নাম লিখুন…"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "#fff",
                    border: "1.5px solid #e5e7eb",
                    color: "#111",
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = "#1a1a1a";
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = "#e5e7eb";
                  }}
                />
                <button
                  onClick={startChat}
                  disabled={!nameInput.trim()}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                  style={{
                    background: "#1a1a1a",
                    color: "#fff",
                  }}
                >
                  চ্যাট শুরু করুন →
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
                style={{ background: "#fafafa" }}
              >
                {/* Welcome message */}
                {messages.length === 0 && !connecting && (
                  <div className="flex items-start gap-2 mb-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: "#1a1a1a", color: "#fff" }}
                    >
                      N
                    </div>
                    <div
                      className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-sm max-w-[80%]"
                      style={{ background: "#fff", color: "#111", border: "1px solid #f0f0f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
                    >
                      হ্যালো {name}! আমরা এখানে আছি। কীভাবে সাহায্য করতে পারি? 😊
                    </div>
                  </div>
                )}

                {connecting && (
                  <div className="flex justify-center py-4">
                    <span className="text-xs" style={{ color: "#9ca3af" }}>সংযোগ করা হচ্ছে…</span>
                  </div>
                )}

                {messages.map((msg) => {
                  const isMe = msg.senderType === "customer";
                  return (
                    <div
                      key={msg._id}
                      className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      {!isMe && (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                          style={{ background: "#1a1a1a", color: "#fff" }}
                        >
                          N
                        </div>
                      )}
                      <div
                        className="max-w-[78%] px-3.5 py-2.5 text-sm"
                        style={{
                          background: isMe ? "#1a1a1a" : "#fff",
                          color: isMe ? "#fff" : "#111",
                          borderRadius: isMe
                            ? "1.1rem 1.1rem 0.3rem 1.1rem"
                            : "1.1rem 1.1rem 1.1rem 0.3rem",
                          boxShadow: isMe
                            ? "none"
                            : "0 1px 4px rgba(0,0,0,0.05)",
                          border: isMe ? "none" : "1px solid #f0f0f0",
                          opacity: msg._id.startsWith("opt-") ? 0.7 : 1,
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}

                {adminTyping && (
                  <div className="flex items-end gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: "#1a1a1a", color: "#fff" }}
                    >
                      N
                    </div>
                    <div
                      className="rounded-2xl rounded-tl-sm"
                      style={{
                        background: "#fff",
                        border: "1px solid #f0f0f0",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                      }}
                    >
                      <TypingDots />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {closed ? (
                <div
                  className="px-4 py-3 text-center text-xs flex-shrink-0"
                  style={{ background: "#fff", color: "#9ca3af", borderTop: "1px solid #f0f0f0" }}
                >
                  এই কথোপকথন বন্ধ হয়ে গেছে
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
                  style={{ background: "#fff", borderTop: "1px solid #f0f0f0" }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    onInput={handleTyping}
                    placeholder="বার্তা লিখুন…"
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "#f9fafb",
                      border: "1.5px solid #e5e7eb",
                      color: "#111",
                    }}
                    onFocus={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = "#1a1a1a";
                      (e.target as HTMLInputElement).style.background = "#fff";
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = "#e5e7eb";
                      (e.target as HTMLInputElement).style.background = "#f9fafb";
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || !conversationId}
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
                    style={{
                      background: "#1a1a1a",
                      color: "#fff",
                    }}
                    aria-label="পাঠান"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.3} viewBox="0 0 24 24">
                      <path d="m22 2-11 11M22 2 15 22l-4-9-9-4 20-7z" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
