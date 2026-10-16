import React, { useEffect, useRef, useState } from "react";
import { Check, CheckCheck, Loader2, MessageCircle, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import { getBranchMessagesApi, sendBranchMessageApi } from "../services/branchadminmessages";

/* Same display-font pairing used across the branch admin pages
   (Fraunces headings, Inter body). No-op if already injected. */
const useDisplayFonts = () => {
  useEffect(() => {
    if (document.getElementById("ba-attendance-fonts")) return;
    const link = document.createElement("link");
    link.id = "ba-attendance-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
};

/* Page-scoped motion. Disabled for users who prefer reduced motion. */
const PAGE_CSS = `
@keyframes ba-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ba-bubble-in { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes ba-dot { 0%,60%,100% { transform: translateY(0); opacity: .5; } 30% { transform: translateY(-3px); opacity: 1; } }
@keyframes ba-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
.ba-fade   { animation: ba-fade .4s ease both; }
.ba-bubble { animation: ba-bubble-in .32s cubic-bezier(.2,.7,.2,1) both; }
.ba-press  { transition: transform .15s ease, opacity .2s ease, background-color .2s ease; }
.ba-press:hover:not(:disabled) { transform: translateY(-1px); }
.ba-press:active:not(:disabled) { transform: translateY(0) scale(.97); }
.ba-skeleton {
  background: linear-gradient(90deg, #f1ede4 25%, #f8f5ee 37%, #f1ede4 63%);
  background-size: 800px 100%;
  animation: ba-shimmer 1.4s linear infinite;
}
.ba-typing-dot { animation: ba-dot 1.1s ease-in-out infinite; }
.ba-scroll::-webkit-scrollbar { width: 8px; }
.ba-scroll::-webkit-scrollbar-thumb { background: #e3ddd0; border-radius: 999px; }
.ba-scroll::-webkit-scrollbar-track { background: transparent; }
@media (prefers-reduced-motion: reduce) {
  .ba-fade, .ba-bubble, .ba-typing-dot { animation: none !important; opacity: 1 !important; }
  .ba-press { transition: none !important; }
  .ba-press:hover:not(:disabled), .ba-press:active:not(:disabled) { transform: none; }
}
`;

const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#9c6b2e]/40";
const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };

const formatMessageDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))
    : "";

/* Groups consecutive messages by day, using the same "day" label style
   throughout ("Today", "Yesterday", or a short date). */
const formatDayLabel = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
};

const ChatSkeleton = () => (
  <div className="space-y-5 px-4 py-6 sm:px-7" aria-busy="true" aria-label="Loading conversation">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
        <div className={`ba-skeleton h-14 rounded-2xl ${i % 2 ? "w-2/5 rounded-br-md" : "w-1/2 rounded-bl-md"}`} />
      </div>
    ))}
  </div>
);

const BranchAdminMessages = () => {
  useDisplayFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const hasScrolledOnLoad = useRef(false);

  const scrollToBottom = (behavior = "auto") => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior });
  };

  const loadMessages = async (showLoader = true) => {
    if (!token) return;
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);
      setError("");
      const data = await getBranchMessagesApi(token);
      setConversationId(data.conversation_id ?? null);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (err) {
      setError(err.message || "Failed to load messages.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [token]);

  /* Poll in the background so read receipts and new messages stay current
     without the person having to hit "Refresh" themselves. Runs quietly —
     no loading/refreshing spinner — and pauses while the tab isn't visible. */
  const pollMessages = async () => {
    if (!token || document.hidden) return;
    try {
      const data = await getBranchMessagesApi(token);
      setConversationId(data.conversation_id ?? null);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch {
      // Silent: a background poll failing shouldn't interrupt the person
      // or overwrite whatever error state a foreground action already set.
    }
  };

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(pollMessages, 5000);
    const onVisible = () => {
      if (!document.hidden) pollMessages();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token]);

  /* Jump straight to the latest message the moment the conversation first
     renders, with no visible scroll animation — so the thread opens already
     showing the newest messages, not the first one. */
  useEffect(() => {
    if (loading || hasScrolledOnLoad.current || messages.length === 0) return;
    hasScrolledOnLoad.current = true;
    scrollToBottom("auto");
  }, [loading, messages.length]);

  /* Smoothly follow along for anything sent or received after that. */
  useEffect(() => {
    if (!hasScrolledOnLoad.current) return;
    scrollToBottom("smooth");
  }, [messages.length]);

  const autoResize = () => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 140)}px`;
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !token || sending) return;

    try {
      setSending(true);
      setError("");
      const data = await sendBranchMessageApi(trimmedMessage, token);
      setConversationId(data.conversation_id ?? conversationId);
      if (data.data) setMessages((current) => [...current, data.data]);
      else await loadMessages(false);
      setMessage("");
      requestAnimationFrame(autoResize);
    } catch (err) {
      setError(err.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  /* Build day-separated groups so we can show a single centered date
     divider before each new day's messages. */
  const groupedMessages = messages.reduce((groups, item) => {
    const label = formatDayLabel(item.created_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
    return groups;
  }, []);

  return (
    <div className="h-screen overflow-hidden md:flex" style={{ ...sans, background: "#faf8f4", color: "#1c1a17" }}>
      <style>{PAGE_CSS}</style>
      <BranchAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        openCreate={() => navigate("/branch-admin/courses", { state: { openCreate: true } })}
        activePage="messages"
      />

      <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* ---- Header ---- */}
        <header
          className="ba-fade flex flex-col gap-4 px-6 pb-7 pt-10 sm:flex-row sm:items-end sm:justify-between sm:px-10"
          style={{ borderBottom: "1px solid #e3ddd0" }}
        >
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em]" style={{ color: "#9c6b2e" }}>
              Support channel
            </p>
            <h1
              className="text-[2.1rem] leading-none tracking-tight sm:text-[2.5rem]"
              style={{ ...serif, fontWeight: 500, color: "#17140f" }}
            >
              Messages
            </h1>
            <p className="mt-2 max-w-lg text-[0.95rem]" style={{ color: "#8a8175" }}>
              Talk directly with the super admin about your branch.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadMessages(false)}
            disabled={refreshing}
            className={`ba-press flex items-center gap-2 self-start rounded-lg px-3.5 py-2.5 text-sm disabled:opacity-60 sm:self-auto ${FOCUS_RING}`}
            style={{ border: "1px solid #e3ddd0", background: "#ffffff", color: "#5b5346" }}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} style={{ color: "#9c6b2e" }} />
            Refresh
          </button>
        </header>

        <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-8 sm:py-8">
          {error && (
            <div
              role="alert"
              className="ba-fade mb-5 rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "#f8eae5", color: "#7c3324", border: "1px solid #eccec4" }}
            >
              {error}
            </div>
          )}

          {/* ---- Conversation card ----
              The page root is a fixed h-screen now, so this card just fills
              whatever space flex leaves it (header + composer stay put,
              only the thread below scrolls). */}
          <section
            className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl"
            style={{
              background: "#ffffff",
              border: "1px solid #e3ddd0",
              boxShadow: "0 24px 60px -40px rgba(23,20,15,.5)",
            }}
          >
            {/* Conversation header */}
            <div
              className="flex items-center justify-between gap-3 px-5 py-4 sm:px-7"
              style={{ borderBottom: "1px solid #e3ddd0", background: "#ffffff" }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="relative flex h-11 w-11 items-center justify-center rounded-full"
                  style={{ background: "#17140f", color: "#f4b942" }}
                >
                  <ShieldCheck className="h-5 w-5" />
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full"
                    style={{ background: "#5c7a5a", border: "2px solid #ffffff" }}
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <h2 className="text-base leading-tight" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
                    Super admin
                  </h2>
                  <p className="text-xs" style={{ color: "#a39a8c" }}>
                    {conversationId ? `Conversation #${conversationId}` : "Ready to start"}
                  </p>
                </div>
              </div>
              {refreshing && <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#9c6b2e" }} />}
            </div>

            {/* Thread */}
            <div
              ref={scrollRef}
              className="ba-scroll min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-7"
              style={{ background: "#faf8f4" }}
            >
              {loading ? (
                <ChatSkeleton />
              ) : messages.length === 0 ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                  <span
                    className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ background: "#f1ede4", color: "#a39a8c" }}
                  >
                    <MessageCircle className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-medium" style={{ color: "#5b5346" }}>
                    No messages yet
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "#a39a8c" }}>
                    Send a message to start the conversation.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedMessages.map((group) => (
                    <div key={group.label + group.items[0].id} className="space-y-3">
                      <div className="flex items-center justify-center">
                        <span
                          className="rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-wider"
                          style={{ background: "#f1ede4", color: "#a39a8c" }}
                        >
                          {group.label}
                        </span>
                      </div>
                      {group.items.map((item) => {
                        const isBranchAdminMessage =
                          String(item.sender_role || "").toLowerCase() === "branch_admin";
                        const isMine = isBranchAdminMessage || String(item.sender_id) === String(user?.id);
                        const isRead = item.is_read === true || item.is_read === "true" || item.is_read === 1;
                        return (
                          <div key={item.id} className={`ba-bubble flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <div className={`min-w-0 max-w-[85%] sm:max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>
                              <div
                                className={`mb-1 px-1 text-[10px] font-medium uppercase tracking-wider ${
                                  isMine ? "text-right" : ""
                                }`}
                                style={{ color: isMine ? "#9c6b2e" : "#6d8b63" }}
                              >
                                {isMine ? "You" : "Super admin"}
                              </div>
                              <div
                                className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                                style={
                                  isMine
                                    ? {
                                        borderBottomRightRadius: "6px",
                                        background: "linear-gradient(135deg, #201a12, #17140f)",
                                        color: "#faf8f4",
                                        boxShadow: "0 8px 20px -12px rgba(23,20,15,.55)",
                                        overflowWrap: "anywhere",
                                        wordBreak: "break-word",
                                      }
                                    : {
                                        borderBottomLeftRadius: "6px",
                                        background: "#eef2ea",
                                        color: "#304a32",
                                        border: "1px solid #d3e0cd",
                                        overflowWrap: "anywhere",
                                        wordBreak: "break-word",
                                      }
                                }
                              >
                                {item.message}
                              </div>
                              <div
                                className={`mt-1 flex items-center gap-1 px-1 text-[10px] ${isMine ? "justify-end" : ""}`}
                                style={{ color: "#a39a8c" }}
                              >
                                {formatMessageDate(item.created_at)}
                                {isBranchAdminMessage && (
                                  isRead ? (
                                    <span className="inline-flex items-center gap-1 font-medium" style={{ color: "#5e9b68" }}>
                                      <CheckCheck className="h-3.5 w-3.5" aria-label="Read" title="Read" /> Read
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 font-medium" style={{ color: "#c2603f" }}>
                                      <Check className="h-3.5 w-3.5" aria-label="Not read" title="Not read" /> Not read
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Composer */}
            <form onSubmit={sendMessage} className="px-4 py-4 sm:px-5" style={{ borderTop: "1px solid #e3ddd0", background: "#ffffff" }}>
              <div
                className="flex items-end gap-3 rounded-xl p-2 transition-colors focus-within:border-[#9c6b2e]"
                style={{ border: "1px solid #e3ddd0", background: "#faf8f4" }}
              >
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    autoResize();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage(event);
                    }
                  }}
                  rows={1}
                  maxLength={2000}
                  placeholder="Write a message…"
                  className="min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
                  style={{ color: "#1c1a17" }}
                  aria-label="Message"
                />
                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className={`ba-press flex h-10 w-10 shrink-0 items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING}`}
                  style={{ background: "#17140f", color: "#f4b942" }}
                  aria-label="Send message"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2 text-right text-[10px]" style={{ color: "#a39a8c" }}>
                {message.length}/2000
              </p>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
};

export default BranchAdminMessages;