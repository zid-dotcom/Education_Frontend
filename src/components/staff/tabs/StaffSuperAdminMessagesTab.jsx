import React, { useEffect, useState, useRef } from 'react';
import {
  ShieldCheck,
  Send,
  Loader2,
  RefreshCw,
  Clock,
  Check,
  CheckCheck,
  Building2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import {
  staffSendSuperAdminMessageApi,
  getStaffSuperAdminConversationApi,
  getStaffSuperAdminUnreadCountApi,
} from '../../../services/staffSuperAdminMessages';

const formatMessageTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return String(dateStr);
  }
};

const formatMessageDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    if (isToday) return 'Today';

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();
    if (isYesterday) return 'Yesterday';

    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateStr);
  }
};

const extractMessageText = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if (typeof val.message === 'string') return val.message;
    if (val.message && typeof val.message === 'object') return extractMessageText(val.message);
    if (typeof val.content === 'string') return val.content;
    if (val.content && typeof val.content === 'object') return extractMessageText(val.content);
    if (typeof val.text === 'string') return val.text;
    if (val.text && typeof val.text === 'object') return extractMessageText(val.text);
  }
  return '';
};

const StaffSuperAdminMessagesTab = ({ token, user }) => {
  const effectiveToken =
    token ||
    localStorage.getItem('token') ||
    localStorage.getItem('staffToken');

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const loadConversation = async (isBackground = false) => {
    if (!effectiveToken) return;
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    setError('');

    try {
      const [convoRes, unreadRes] = await Promise.allSettled([
        getStaffSuperAdminConversationApi(effectiveToken),
        getStaffSuperAdminUnreadCountApi(effectiveToken),
      ]);

      if (convoRes.status === 'fulfilled') {
        const data = convoRes.value;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.messages)
          ? data.messages
          : Array.isArray(data?.conversation?.messages)
          ? data.conversation.messages
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setMessages(list);
      } else {
        if (!isBackground) {
          setError(convoRes.reason?.message || 'Failed to load conversation.');
        }
      }

      if (unreadRes.status === 'fulfilled') {
        const uData = unreadRes.value;
        const count =
          typeof uData === 'number'
            ? uData
            : typeof uData?.unread_count === 'number'
            ? uData.unread_count
            : typeof uData?.count === 'number'
            ? uData.count
            : 0;
        setUnreadCount(count);
      }
    } catch (err) {
      if (!isBackground) {
        setError(err.message || 'Error connecting to messages.');
      }
    } finally {
      if (!isBackground) setLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    loadConversation();
    const interval = setInterval(() => {
      loadConversation(true);
    }, 9000);
    return () => clearInterval(interval);
  }, [effectiveToken]);

  useEffect(() => {
    scrollToBottom(messages.length <= 1 ? 'auto' : 'smooth');
  }, [messages]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError('');

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      message: trimmed,
      sender_role: 'staff',
      sender_id: user?.id,
      created_at: new Date().toISOString(),
      is_read: false,
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');

    try {
      await staffSendSuperAdminMessageApi(trimmed, effectiveToken);
      // Reload actual conversation to synchronize IDs and statuses
      await loadConversation(true);
      window.dispatchEvent(new Event('staff-messages-updated'));
    } catch (err) {
      setError(err.message || 'Failed to send message.');
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(trimmed);
    } finally {
      setSending(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isSuperAdminMsg = (msg) => {
    const role = (msg.sender_role || msg.sender_type || msg.role || msg.sender || '').toLowerCase();
    return (
      role === 'super_admin' ||
      role === 'superadmin' ||
      role === 'admin' ||
      Boolean(msg.is_super_admin) ||
      Boolean(msg.from_super_admin)
    );
  };

  const QUICK_PROMPTS = [
    'Inquiry regarding exam schedule updates',
    'Question about course curriculum guidelines',
    'Administrative approval request for batch verification',
    'Technical support request regarding student grading',
  ];

  return (
    <div className="space-y-4 font-sans">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-[#E3DDD0] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="h-12 w-12 rounded-2xl bg-[#17140F] text-[#F4B942] flex items-center justify-center shrink-0 border border-[#E3DDD0] shadow-sm">
            <ShieldCheck className="h-6 w-6 text-[#F4B942]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-[#17140F] tracking-tight">
                Super Admin Messages
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF8F4] border border-[#E3DDD0] px-2.5 py-0.5 text-[10px] font-bold text-[#9C6B2E]">
                <Building2 className="h-3 w-3" />
                Central Leadership
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-500 text-white font-extrabold text-[10px] px-2 py-0.5 animate-pulse">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-xs text-[#5B5346] mt-0.5 truncate">
              Direct, encrypted channel with AurumFx Central Leadership & Super Administration.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadConversation(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] px-4 py-2.5 text-xs font-bold text-[#17140F] hover:bg-[#F1EDE4] transition cursor-pointer self-start sm:self-auto shrink-0 disabled:opacity-50"
          title="Refresh Messages"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-[#9C6B2E] ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
        </button>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-3xl border border-[#E3DDD0] shadow-sm overflow-hidden flex flex-col h-[650px] max-h-[calc(100vh-220px)]">
        {/* Top Info Bar */}
        <div className="px-5 py-3.5 bg-[#FAF8F4] border-b border-[#E3DDD0] flex items-center justify-between text-xs text-[#5B5346]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-[#17140F]">AurumFx Super Admin Desk</span>
            <span className="text-slate-400">• Official Channel</span>
          </div>
          <div className="text-[11px] font-medium text-slate-400">
            {messages.length} message{messages.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span className="font-medium flex-1">{error}</span>
          </div>
        )}

        {/* Message Thread Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-[#FAF8F4]/40 to-white">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#9C6B2E]" />
              <p className="text-xs font-bold text-slate-500">Loading conversation with Super Admin...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
              <div className="h-16 w-16 rounded-3xl bg-[#FAF8F4] border border-[#E3DDD0] flex items-center justify-center mb-4 text-[#9C6B2E] shadow-xs">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="font-extrabold text-base text-[#17140F]">
                Start a Conversation with Super Admin
              </h3>
              <p className="text-xs text-[#5B5346] mt-2 leading-relaxed">
                This dedicated channel connects you directly with the Central Administration team.
                Send course queries, batch inquiries, or request administrative support anytime.
              </p>

              {/* Quick Prompt Suggestions */}
              <div className="w-full mt-6 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#9C6B2E] uppercase tracking-wider justify-center">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Suggested inquiries</span>
                </div>
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputText(prompt);
                      textareaRef.current?.focus();
                    }}
                    className="w-full text-left p-2.5 rounded-xl border border-[#E3DDD0] bg-white hover:bg-[#FAF8F4] hover:border-[#9C6B2E]/40 text-xs text-[#17140F] transition cursor-pointer flex items-center justify-between group"
                  >
                    <span>{prompt}</span>
                    <span className="text-[10px] text-[#9C6B2E] font-bold opacity-0 group-hover:opacity-100 transition">
                      Use prompt →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Channel Greeting Callout */}
              <div className="rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] p-4 text-center max-w-lg mx-auto">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#9C6B2E]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Direct Super Admin Connection</span>
                </div>
                <p className="text-[11px] text-[#5B5346] mt-1">
                  Messages sent here are received directly by AurumFx Super Administrators.
                </p>
              </div>

              {/* Messages list */}
              {messages.map((msg, idx) => {
                const isSuper = isSuperAdminMsg(msg);
                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                const currentDate = formatMessageDate(msg.created_at);
                const prevDate = prevMsg ? formatMessageDate(prevMsg.created_at) : null;
                const showDateDivider = currentDate && currentDate !== prevDate;
                const text = extractMessageText(msg) || '';

                const isRead = Boolean(
                  msg.is_read ??
                  msg.read ??
                  (msg.status === 'read') ??
                  (typeof msg.message === 'object' ? (msg.message?.is_read ?? msg.message?.read) : false)
                );

                return (
                  <React.Fragment key={msg.id || idx}>
                    {showDateDivider && (
                      <div className="flex items-center justify-center my-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#F1EDE4] text-[#5B5346] border border-[#E3DDD0]">
                          {currentDate}
                        </span>
                      </div>
                    )}

                    <div className={`flex flex-col ${isSuper ? 'items-start' : 'items-end'}`}>
                      {/* Sender label */}
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        {isSuper ? (
                          <>
                            <div className="h-4 w-4 rounded-full bg-[#17140F] text-[#F4B942] flex items-center justify-center text-[9px] font-black">
                              <ShieldCheck className="h-2.5 w-2.5" />
                            </div>
                            <span className="text-[11px] font-bold text-[#17140F]">Super Admin</span>
                          </>
                        ) : (
                          <span className="text-[11px] font-semibold text-[#8A8175]">You (Staff)</span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {formatMessageTime(msg.created_at)}
                        </span>
                      </div>

                      {/* Bubble */}
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs whitespace-pre-wrap break-words ${
                          isSuper
                            ? 'bg-white text-[#17140F] border border-[#E3DDD0] rounded-tl-xs'
                            : 'bg-[#17140F] text-white rounded-tr-xs border border-[#17140F]'
                        }`}
                      >
                        {text}
                      </div>

                      {/* Read status (for staff sent messages) */}
                      {!isSuper && (
                        <div className="flex items-center gap-1 text-[10px] mt-1 px-1">
                          {msg._optimistic ? (
                            <span className="text-slate-400">Sending…</span>
                          ) : isRead ? (
                            <span className="flex items-center gap-1 text-[#9C6B2E] font-medium">
                              <CheckCheck className="h-3 w-3 text-[#9C6B2E]" />
                              <span>Read</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-400 font-medium">
                              <Check className="h-3 w-3 text-slate-400" />
                              <span>Not read</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3.5 sm:p-4 bg-white border-t border-[#E3DDD0] flex flex-col gap-2"
        >
          <div className="flex items-end gap-2.5 bg-[#FAF8F4] rounded-2xl border border-[#E3DDD0] p-2 focus-within:ring-2 focus-within:ring-[#9C6B2E]/20 focus-within:border-[#9C6B2E] transition">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message to Super Admin… (Press Enter to send)"
              className="flex-1 bg-transparent border-0 outline-none resize-none text-xs text-[#17140F] placeholder-slate-400 p-1.5 focus:ring-0 leading-relaxed max-h-32"
              disabled={sending}
            />

            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="h-10 px-4 rounded-xl bg-[#9C6B2E] hover:bg-[#855923] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-[#9C6B2E]/20 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
            <span>Shift + Enter for a new line</span>
            <span>Messages are confidential and routed to AurumFx HQ</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffSuperAdminMessagesTab;
