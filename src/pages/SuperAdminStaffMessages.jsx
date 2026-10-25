import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Check,
  CheckCheck,
  ChevronLeft,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  User,
  Users,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import {
  getSuperAdminStaffInboxApi,
  getSuperAdminStaffUnreadCountApi,
  getSuperAdminStaffConversationApi,
  replySuperAdminStaffMessageApi,
} from '../services/staffSuperAdminMessages';

const PAGE_CSS = `
@keyframes sa-rise { from { opacity:0; transform:translateY(12px) scale(.98); } to { opacity:1; transform:translateY(0) scale(1); } }
@keyframes sa-fade { from { opacity:0; } to { opacity:1; } }
@keyframes sa-bubble-in { from { opacity: 0; transform: translateY(6px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
.sa-rise { animation: sa-rise .35s ease both; }
.sa-fade { animation: sa-fade .25s ease both; }
.sa-bubble { animation: sa-bubble-in .25s cubic-bezier(.2,.7,.2,1) both; }
.sa-scroll::-webkit-scrollbar { width: 6px; }
.sa-scroll::-webkit-scrollbar-thumb { background: #e3ddd0; border-radius: 999px; }
.sa-scroll::-webkit-scrollbar-track { background: transparent; }
`;

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#9c6b2e]/50';

const formatMessageDate = (value) => {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return String(value);
  }
};

const formatDayLabel = (value) => {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a, b) =>
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear();

    if (sameDay(date, today)) return 'Today';
    if (sameDay(date, yesterday)) return 'Yesterday';
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return String(value);
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

const SuperAdminStaffMessages = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Inbox & Conversations state
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // Active chat thread state
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeMobileView, setActiveMobileView] = useState('list'); // 'list' | 'chat'

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = (behavior = 'auto') => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior });
  };

  // Load Super Admin Inbox & Global Unread
  const loadInboxData = async (isBackground = false) => {
    if (!token) return;
    if (!isBackground) setConversationsLoading(true);
    else setRefreshing(true);

    try {
      const [inboxRes, unreadRes] = await Promise.allSettled([
        getSuperAdminStaffInboxApi(token),
        getSuperAdminStaffUnreadCountApi(token),
      ]);

      if (inboxRes.status === 'fulfilled') {
        const data = inboxRes.value;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.inbox)
          ? data.inbox
          : Array.isArray(data?.conversations)
          ? data.conversations
          : Array.isArray(data?.data)
          ? data.data
          : [];

        // Normalize conversations with robust fallbacks
        const normalized = list.map((item, idx) => {
          const convId = item.conversation_id || item.id || `conv-${item.staff_id || idx}`;
          const staffName =
            (typeof item.staff_name === 'string' && item.staff_name) ||
            (typeof item.staff?.name === 'string' && item.staff.name) ||
            (typeof item.user_name === 'string' && item.user_name) ||
            (typeof item.sender_name === 'string' && item.sender_name) ||
            `Staff Member #${item.staff_id || idx + 1}`;
          const branchName =
            (typeof item.branch_name === 'string' && item.branch_name) ||
            (typeof item.branch?.name === 'string' && item.branch.name) ||
            (item.branch_id ? `Branch #${item.branch_id}` : 'General Staff');

          const rawLast =
            item.last_message ??
            item.latest_message ??
            item.message ??
            item.last_message_text ??
            null;

          const lastMsg = extractMessageText(rawLast) || 'No messages yet';
          let lastMsgAt =
            item.last_message_at ||
            item.updated_at ||
            item.created_at ||
            (rawLast && typeof rawLast === 'object' ? rawLast.created_at : null) ||
            null;
          const unread = Number(item.unread_count || item.unread || 0);

          return {
            ...item,
            conversation_id: convId,
            staff_name: staffName,
            branch_name: branchName,
            last_message: lastMsg,
            last_message_at: lastMsgAt,
            unread_count: unread,
          };
        });

        setConversations(normalized);

        // If a conversation was already selected, update reference
        if (selectedConversation) {
          const updated = normalized.find(
            (c) => String(c.conversation_id) === String(selectedConversation.conversation_id)
          );
          if (updated) {
            setSelectedConversation((prev) => ({ ...prev, ...updated }));
          }
        }
      }

      if (unreadRes.status === 'fulfilled') {
        const u = unreadRes.value;
        const count =
          typeof u === 'number'
            ? u
            : typeof u?.unread_count === 'number'
            ? u.unread_count
            : typeof u?.count === 'number'
            ? u.count
            : 0;
        setTotalUnreadCount(count);
      }
    } catch (err) {
      console.warn('Failed to load staff messages inbox:', err);
    } finally {
      if (!isBackground) setConversationsLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInboxData();
    const interval = setInterval(() => loadInboxData(true), 12000);
    return () => clearInterval(interval);
  }, [token]);

  // Load individual conversation thread
  const selectConversation = async (conv) => {
    setSelectedConversation(conv);
    setActiveMobileView('chat');
    setError('');
    setChatLoading(true);

    try {
      const data = await getSuperAdminStaffConversationApi(conv.conversation_id, token);
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

      // Decrement unread count locally for responsive UX
      if (conv.unread_count > 0) {
        setConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === conv.conversation_id ? { ...c, unread_count: 0 } : c
          )
        );
        setTotalUnreadCount((prev) => Math.max(0, prev - conv.unread_count));
        window.dispatchEvent(new Event('messages-updated'));
      }

      setTimeout(() => scrollToBottom('auto'), 80);
    } catch (err) {
      setError(err.message || 'Failed to load conversation messages.');
    } finally {
      setChatLoading(false);
    }
  };

  // Reply to active thread
  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed || !selectedConversation || sending) return;

    setSending(true);
    setError('');

    const convId = selectedConversation.conversation_id;
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      message: trimmed,
      sender_role: 'super_admin',
      created_at: new Date().toISOString(),
      is_read: false,
    };

    setMessages((prev) => [...prev, optimistic]);
    setMessageText('');
    setTimeout(() => scrollToBottom('smooth'), 50);

    try {
      await replySuperAdminStaffMessageApi(convId, trimmed, token);
      // Reload thread to update message IDs
      const data = await getSuperAdminStaffConversationApi(convId, token);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.messages)
        ? data.messages
        : Array.isArray(data?.conversation?.messages)
        ? data.conversation.messages
        : [];
      setMessages(list);
      loadInboxData(true);
      window.dispatchEvent(new Event('messages-updated'));
    } catch (err) {
      setError(err.message || 'Failed to send reply to staff.');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setMessageText(trimmed);
    } finally {
      setSending(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const isSuperAdminSender = (msg) => {
    const role = (msg.sender_role || msg.sender_type || msg.role || msg.sender || '').toLowerCase();
    return (
      role === 'super_admin' ||
      role === 'superadmin' ||
      role === 'admin' ||
      Boolean(msg.is_super_admin) ||
      Boolean(msg.from_super_admin)
    );
  };

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.staff_name?.toLowerCase().includes(q) ||
        c.branch_name?.toLowerCase().includes(q) ||
        c.last_message?.toLowerCase().includes(q) ||
        String(c.conversation_id).toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#faf8f4] text-slate-800 font-sans">
      <style>{PAGE_CSS}</style>

      {/* Super Admin Sidebar */}
      <SuperAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="staff-messages"
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="px-6 py-4 bg-white border-b border-[#e3ddd0] shrink-0 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#17140F] tracking-tight">
                Staff Messages
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F4] border border-[#E3DDD0] text-[#9C6B2E]">
                <Users className="h-3 w-3" />
                Faculty Desk
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct communication inquiries from instructors and staff members across all branch campuses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadInboxData(true)}
              disabled={conversationsLoading || refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e3ddd0] bg-[#faf8f4] hover:bg-[#f1ede4] text-xs font-bold text-[#17140f] transition disabled:opacity-50 cursor-pointer"
              title="Refresh Inbox"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#9c6b2e] ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Syncing…' : 'Refresh'}</span>
            </button>
          </div>
        </header>

        {/* Messaging Split Screen */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Left Column: Staff Conversations Directory */}
          <section
            className={`w-full md:w-80 lg:w-96 bg-white border-r border-[#e3ddd0] flex flex-col shrink-0 ${
              activeMobileView === 'chat' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Inbox Filter & Search */}
            <div className="p-3.5 border-b border-[#e3ddd0] space-y-2.5 bg-[#FAF8F4]/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[#9C6B2E] flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Staff Inquiries
                </span>
                <span className="text-xs font-bold text-slate-600">
                  {conversations.length} conversation{conversations.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search staff, branch, or keywords…"
                  className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-[#E3DDD0] bg-white text-[#17140F] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto sa-scroll divide-y divide-[#F1EDE4]">
              {conversationsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-[#9C6B2E]" />
                  <p className="text-xs font-semibold">Loading staff inbox…</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600">
                    {searchQuery ? 'No matching conversations' : 'No staff messages yet'}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    When instructors send inquiries from their portal, they will appear here.
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected =
                    selectedConversation &&
                    String(selectedConversation.conversation_id) === String(conv.conversation_id);

                  return (
                    <button
                      key={conv.conversation_id}
                      type="button"
                      onClick={() => selectConversation(conv)}
                      className={`w-full text-left p-3.5 transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-[#F1EDE4] border-l-4 border-l-[#9C6B2E]'
                          : 'hover:bg-[#FAF8F4]'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-2xl bg-[#17140F] text-[#F4B942] flex items-center justify-center font-bold text-xs shrink-0 border border-[#E3DDD0] shadow-2xs">
                        {conv.staff_name?.charAt(0).toUpperCase() || 'S'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="text-xs font-extrabold text-[#17140F] truncate">
                            {conv.staff_name}
                          </h4>
                          {conv.last_message_at && (
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {formatMessageDate(conv.last_message_at).split(',')[0]}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#9C6B2E] bg-white border border-[#E3DDD0] px-2 py-0.5 rounded-md truncate max-w-[140px]">
                            <Building2 className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{conv.branch_name}</span>
                          </span>

                          {conv.unread_count > 0 && (
                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                              {conv.unread_count} new
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-1 break-words">
                          {conv.last_message}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Right Column: Chat Conversation Thread */}
          <main
            className={`flex-1 flex flex-col bg-[#FAF8F4] overflow-hidden ${
              activeMobileView === 'list' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {selectedConversation ? (
              <>
                {/* Active Chat Header */}
                <div className="p-4 bg-white border-b border-[#e3ddd0] shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setActiveMobileView('list')}
                      className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 md:hidden"
                      title="Back to list"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="h-10 w-10 rounded-2xl bg-[#17140F] text-[#F4B942] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      {selectedConversation.staff_name?.charAt(0).toUpperCase() || 'S'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-extrabold text-[#17140F] truncate">
                          {selectedConversation.staff_name}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#9C6B2E] bg-[#FAF8F4] border border-[#E3DDD0] px-2 py-0.5 rounded-md">
                          <Building2 className="h-2.5 w-2.5" />
                          {selectedConversation.branch_name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {selectedConversation.staff_email || 'Faculty Member'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => selectConversation(selectedConversation)}
                    disabled={chatLoading}
                    className="p-2 rounded-xl text-slate-500 hover:bg-[#FAF8F4] transition border border-[#E3DDD0] cursor-pointer"
                    title="Reload thread"
                  >
                    <RefreshCw className={`h-4 w-4 ${chatLoading ? 'animate-spin text-[#9C6B2E]' : ''}`} />
                  </button>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="m-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
                    <span>{error}</span>
                    <button type="button" onClick={() => setError('')} className="text-rose-500">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Messages Scroll Area */}
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sa-scroll bg-gradient-to-b from-[#FAF8F4] to-white"
                >
                  {chatLoading ? (
                    <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                      <Loader2 className="h-7 w-7 animate-spin text-[#9C6B2E]" />
                      <p className="text-xs font-bold">Loading conversation thread…</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                      <MessageSquare className="h-10 w-10 text-slate-300 mb-2" />
                      <p className="text-xs font-semibold text-slate-600">No messages in this thread yet.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Send a reply below to reach out to this staff member.</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isSuper = isSuperAdminSender(msg);
                      const prevMsg = idx > 0 ? messages[idx - 1] : null;
                      const currentDate = formatDayLabel(msg.created_at);
                      const prevDate = prevMsg ? formatDayLabel(prevMsg.created_at) : null;
                      const showDayLabel = currentDate && currentDate !== prevDate;
                      const isRead = Boolean(
                        msg.is_read ??
                        msg.read ??
                        (msg.status === 'read') ??
                        (typeof msg.message === 'object' ? (msg.message?.is_read ?? msg.message?.read) : false)
                      );
                      const text = extractMessageText(msg) || '';

                      return (
                        <React.Fragment key={msg.id || idx}>
                          {showDayLabel && (
                            <div className="flex items-center justify-center my-3">
                              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#F1EDE4] text-[#5B5346] border border-[#E3DDD0]">
                                {currentDate}
                              </span>
                            </div>
                          )}

                          <div className={`flex flex-col ${isSuper ? 'items-end' : 'items-start'} sa-bubble`}>
                            {/* Message Header */}
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              {isSuper ? (
                                <span className="text-[10px] font-bold text-[#9C6B2E]">You (Super Admin)</span>
                              ) : (
                                <span className="text-[10px] font-bold text-[#17140F]">
                                  {selectedConversation.staff_name}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">
                                {formatMessageDate(msg.created_at)}
                              </span>
                            </div>

                            {/* Bubble */}
                            <div
                              className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs whitespace-pre-wrap break-words ${
                                isSuper
                                  ? 'bg-[#17140F] text-white rounded-tr-xs'
                                  : 'bg-white text-[#17140F] border border-[#E3DDD0] rounded-tl-xs'
                              }`}
                            >
                              {text}
                            </div>

                            {/* Read status (for super admin sent messages) */}
                            {isSuper && (
                              <div className="flex items-center gap-1 text-[10px] mt-1 px-1">
                                {isRead ? (
                                  <span className="flex items-center gap-1 text-[#9C6B2E] font-medium">
                                    <CheckCheck className="h-3.5 w-3.5 text-[#9C6B2E]" />
                                    <span>Read</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-slate-400 font-medium">
                                    <Check className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Not read</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })
                  )}
                </div>

                {/* Reply Input Bar */}
                <form
                  onSubmit={handleSendReply}
                  className="p-3.5 sm:p-4 bg-white border-t border-[#e3ddd0] flex flex-col gap-2 shrink-0"
                >
                  <div className="flex items-end gap-2 bg-[#FAF8F4] rounded-2xl border border-[#E3DDD0] p-2 focus-within:ring-2 focus-within:ring-[#9C6B2E]/20 focus-within:border-[#9C6B2E] transition">
                    <textarea
                      ref={textareaRef}
                      rows={2}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Reply to ${selectedConversation.staff_name}… (Press Enter to send)`}
                      className="flex-1 bg-transparent border-0 outline-none resize-none text-xs text-[#17140F] placeholder-slate-400 p-1 focus:ring-0 leading-relaxed max-h-32"
                      disabled={sending}
                    />

                    <button
                      type="submit"
                      disabled={!messageText.trim() || sending}
                      className="h-10 px-4 rounded-xl bg-[#9C6B2E] hover:bg-[#855923] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-[#9C6B2E]/20 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Send Reply</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
                    <span>Shift + Enter for a new line</span>
                    <span>Staff member will receive this response directly in their portal</span>
                  </div>
                </form>
              </>
            ) : (
              /* Empty selection screen */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <div className="h-16 w-16 rounded-3xl bg-white border border-[#E3DDD0] flex items-center justify-center text-[#9C6B2E] mb-4 shadow-xs">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="font-extrabold text-base text-[#17140F]">
                  Select a Staff Conversation
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">
                  Choose an instructor inquiry from the left directory to inspect message history, view branch details, and send replies.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminStaffMessages;
