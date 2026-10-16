import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Check,
  CheckCheck,
  ChevronLeft,
  Hash,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import { getBranchAdminsApi, getBranchesApi } from '../services/adminbranches';
import {
  getSuperAdminUnreadMessagesCountApi,
  getSuperAdminConversationApi,
  replySuperAdminMessageApi,
} from '../services/superadmin';

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

const formatMessageDate = (value) =>
  value
    ? new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(value))
    : '';

const formatDayLabel = (value) => {
  if (!value) return '';
  const date = new Date(value);
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
};

const SuperAdminMessages = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Conversations & Directory state
  const [branches, setBranches] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Chat state
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeMobileView, setActiveMobileView] = useState('list'); // 'list' or 'chat'

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const hasScrolledOnLoad = useRef(false);

  const scrollToBottom = (behavior = 'auto') => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior });
  };

  // Helper to resolve branch name
  const getBranchName = (branchId, branchList = branches) => {
    const found = branchList.find(
      (b) => String(b.id ?? b.branch_id) === String(branchId)
    );
    return found ? found.name : branchId ? `Branch #${branchId}` : 'Main Branch';
  };

  // Load conversations, branch directory, and branch admins
  const loadConversationsData = async (isSilent = false) => {
    if (!token) return;
    if (!isSilent) setConversationsLoading(true);
    try {
      const [unreadRes, branchesRes, adminsRes] = await Promise.allSettled([
        getSuperAdminUnreadMessagesCountApi(token),
        getBranchesApi(token),
        getBranchAdminsApi(token),
      ]);

      const branchList =
        branchesRes.status === 'fulfilled' && Array.isArray(branchesRes.value)
          ? branchesRes.value
          : [];
      setBranches(branchList);

      const adminList =
        adminsRes.status === 'fulfilled' && Array.isArray(adminsRes.value)
          ? adminsRes.value
          : [];

      const unreadData =
        unreadRes.status === 'fulfilled' ? unreadRes.value : null;

      // Extract conversations array from unread count response
      const apiConversations = Array.isArray(unreadData?.conversations)
        ? unreadData.conversations
        : Array.isArray(unreadData)
        ? unreadData
        : [];

      // Map apiConversations with admin and branch details
      const mergedList = apiConversations.map((conv) => {
        const matchedAdmin = adminList.find(
          (a) =>
            String(a.id ?? a.admin_id ?? a.branch_admin_id) ===
            String(conv.branch_admin_id)
        );
        const bId = conv.branch_id ?? matchedAdmin?.branch_id;
        return {
          conversation_id: conv.conversation_id,
          branch_admin_id: conv.branch_admin_id,
          name:
            conv.branch_admin_name ||
            matchedAdmin?.name ||
            `Admin #${conv.branch_admin_id}`,
          branch_id: bId,
          branch_name: getBranchName(bId, branchList),
          unread_count: Number(conv.unread_count) || 0,
          email: matchedAdmin?.email || '',
          phone: matchedAdmin?.phone_number || matchedAdmin?.phone || '',
          has_conversation: true,
        };
      });

      // Also append branch admins who don't yet have an active conversation in apiConversations
      adminList.forEach((adm) => {
        const admId = adm.id ?? adm.admin_id ?? adm.branch_admin_id;
        const alreadyExists = mergedList.some(
          (c) => String(c.branch_admin_id) === String(admId)
        );
        if (!alreadyExists) {
          const bId = adm.branch_id;
          mergedList.push({
            conversation_id: adm.conversation_id || null,
            branch_admin_id: admId,
            name: adm.name || `Admin #${admId}`,
            branch_id: bId,
            branch_name: getBranchName(bId, branchList),
            unread_count: 0,
            email: adm.email || '',
            phone: adm.phone_number || adm.phone || '',
            has_conversation: Boolean(adm.conversation_id),
          });
        }
      });

      // Sort: conversations with unread count first (descending), then active conversations, then by ID
      mergedList.sort((a, b) => {
        if (b.unread_count !== a.unread_count) {
          return b.unread_count - a.unread_count;
        }
        if (a.has_conversation !== b.has_conversation) {
          return a.has_conversation ? -1 : 1;
        }
        return (b.conversation_id || 0) - (a.conversation_id || 0);
      });

      setConversations(mergedList);

      // Auto-select initial conversation if none selected yet, or keep current selection synced
      setSelectedConversation((currentSelected) => {
        if (!currentSelected) {
          const firstWithConv =
            mergedList.find((c) => c.conversation_id) || mergedList[0];
          if (firstWithConv && firstWithConv.conversation_id) {
            setConversationId(firstWithConv.conversation_id);
            loadConversation(firstWithConv.conversation_id, true);
          }
          return firstWithConv || null;
        }

        const updated = mergedList.find(
          (c) =>
            (currentSelected.conversation_id &&
              c.conversation_id === currentSelected.conversation_id) ||
            String(c.branch_admin_id) === String(currentSelected.branch_admin_id)
        );
        return updated || currentSelected;
      });
    } catch (err) {
      if (!isSilent) setError(err.message || 'Failed to load conversations.');
    } finally {
      if (!isSilent) setConversationsLoading(false);
    }
  };

  useEffect(() => {
    loadConversationsData();
  }, [token]);

  // Handle selecting a conversation from the sidebar list
  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    hasScrolledOnLoad.current = false;
    setActiveMobileView('chat');

    const convId = conv.conversation_id;
    setConversationId(convId);

    // If it had unread messages, clear them locally and trigger sidebar refresh
    if (conv.unread_count > 0) {
      setConversations((prev) =>
        prev.map((c) =>
          c.conversation_id === convId ? { ...c, unread_count: 0 } : c
        )
      );
      window.dispatchEvent(new Event('messages-updated'));
    }

    if (convId) {
      loadConversation(convId, true);
    } else {
      setMessages([]);
    }
  };

  // Load message history for a specific conversation
  const loadConversation = async (convId, showLoader = false) => {
    if (!token || !convId) return;
    try {
      if (showLoader) setChatLoading(true);
      else setRefreshing(true);
      setError('');
      const data = await getSuperAdminConversationApi(convId, token);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.messages)
        ? data.messages
        : [];
      setMessages(list);
    } catch (err) {
      setError(err.message || 'Failed to load conversation.');
      setMessages([]);
    } finally {
      setChatLoading(false);
      setRefreshing(false);
    }
  };

  // Periodic polling for active conversation
  useEffect(() => {
    if (!token || !conversationId) return;
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadConversation(conversationId, false);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [token, conversationId]);

  // Periodic polling for conversation list & unread counts
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadConversationsData(true);
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [token]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (chatLoading || hasScrolledOnLoad.current || messages.length === 0) return;
    hasScrolledOnLoad.current = true;
    scrollToBottom('auto');
  }, [chatLoading, messages.length]);

  // Scroll to bottom smoothly on subsequent messages
  useEffect(() => {
    if (!hasScrolledOnLoad.current) return;
    scrollToBottom('smooth');
  }, [messages.length]);

  const autoResize = () => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${Math.min(node.scrollHeight, 120)}px`;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed || !token || !conversationId || sending) return;

    try {
      setSending(true);
      setError('');
      const res = await replySuperAdminMessageApi(conversationId, trimmed, token);
      const newMsg =
        res?.data ||
        (res?.message && typeof res.message === 'object' ? res.message : null);

      if (newMsg) {
        setMessages((current) => [...current, newMsg]);
      } else {
        await loadConversation(conversationId, false);
      }

      setMessageText('');
      requestAnimationFrame(autoResize);

      // Refresh conversations list in background to sync
      loadConversationsData(true);
      window.dispatchEvent(new Event('messages-updated'));
    } catch (err) {
      setError(err.message || 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  // Group messages by date
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

  // Filter conversations by search term
  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const nameMatch = (c.name || '').toLowerCase().includes(q);
      const branchMatch = (c.branch_name || '').toLowerCase().includes(q);
      const emailMatch = (c.email || '').toLowerCase().includes(q);
      const convIdMatch =
        c.conversation_id != null &&
        String(c.conversation_id).includes(q.replace('#', ''));
      const adminIdMatch =
        c.branch_admin_id != null && String(c.branch_admin_id).includes(q);
      return (
        nameMatch || branchMatch || emailMatch || convIdMatch || adminIdMatch
      );
    });
  }, [conversations, searchQuery]);

  // Total unread count across all conversations
  const totalUnreadCount = useMemo(() => {
    return conversations.reduce(
      (sum, c) => sum + (Number(c.unread_count) || 0),
      0
    );
  }, [conversations]);

  return (
    <div
      className="h-screen w-full overflow-hidden md:flex"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: '#faf8f4',
        color: '#17140f',
      }}
    >
      <style>{PAGE_CSS}</style>
      <SuperAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="messages"
      />

      <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#faf8f4]">
        {/* Top Header */}
        <header
          className="flex h-16 shrink-0 items-center justify-between border-b px-6 sm:px-10"
          style={{ borderColor: '#e3ddd0', background: '#ffffff' }}
        >
          <div className="flex items-center gap-3">
            {activeMobileView === 'chat' && (
              <button
                type="button"
                onClick={() => setActiveMobileView('list')}
                className="rounded-lg p-1.5 md:hidden hover:bg-[#f1ede4]"
                aria-label="Back to conversations list"
              >
                <ChevronLeft className="h-5 w-5" style={{ color: '#9c6b2e' }} />
              </button>
            )}
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: '#9c6b2e' }}
              >
                Super Admin
              </p>
              <h1
                className="text-xl font-bold flex items-center gap-2"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                <span>Direct Messages</span>
                {totalUnreadCount > 0 && (
                  <span
                    className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold text-white shadow-xs"
                    style={{ background: '#0284c7' }}
                  >
                    {totalUnreadCount} unread
                  </span>
                )}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {conversationId && (
              <button
                type="button"
                onClick={() => loadConversation(conversationId, false)}
                disabled={chatLoading || refreshing}
                className="rounded-lg p-2 transition hover:bg-[#f1ede4]"
                title="Refresh conversation"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                  style={{ color: '#9c6b2e' }}
                />
              </button>
            )}
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shadow-xs"
              style={{ background: '#17140f', color: '#f4b942' }}
            >
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Messaging Layout: Conversations Sidebar List + Chat Area */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Conversations List Column / Messages Sidebar */}
          <section
            className={`w-full md:w-80 lg:w-[360px] xl:w-[400px] flex h-full min-h-0 flex-col border-r shrink-0 bg-white ${
              activeMobileView === 'chat' ? 'hidden md:flex' : 'flex'
            }`}
            style={{ borderColor: '#e3ddd0' }}
          >
            {/* Sidebar Header */}
            <div
              className="p-3.5 border-b shrink-0 flex items-center justify-between"
              style={{ borderColor: '#e3ddd0', background: '#f8fafc' }}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" style={{ color: '#9c6b2e' }} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Conversations ({conversations.length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {totalUnreadCount > 0 ? (
                  <span
                    className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold text-white shadow-2xs"
                    style={{ background: '#0284c7' }}
                  >
                    {totalUnreadCount} unread
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400">
                    All caught up
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => loadConversationsData(false)}
                  disabled={conversationsLoading}
                  className="rounded-lg p-1 transition hover:bg-slate-200"
                  title="Reload conversations and unread counts"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${
                      conversationsLoading ? 'animate-spin text-sky-600' : 'text-slate-500'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Search Input Filter */}
            <div className="p-3 border-b shrink-0 bg-white" style={{ borderColor: '#e3ddd0' }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, branch, or Conv ID..."
                  className={`w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 transition-colors focus:bg-white ${FOCUS_RING}`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Conversation Items List */}
            <div className="flex-1 min-h-0 overflow-y-auto sa-scroll divide-y divide-slate-100">
              {conversationsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
                  <p className="mt-2 text-xs">Loading conversations...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  {searchQuery
                    ? 'No conversations matching your search.'
                    : 'No conversations available.'}
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected =
                    selectedConversation &&
                    ((selectedConversation.conversation_id &&
                      conv.conversation_id === selectedConversation.conversation_id) ||
                      (!selectedConversation.conversation_id &&
                        String(selectedConversation.branch_admin_id) ===
                          String(conv.branch_admin_id)));
                  const hasUnread = conv.unread_count > 0;

                  return (
                    <button
                      key={conv.conversation_id ?? `adm-${conv.branch_admin_id}`}
                      type="button"
                      onClick={() => handleSelectConversation(conv)}
                      className={`relative w-full text-left p-3.5 transition-all flex items-start gap-3 border-b ${
                        isSelected
                          ? 'bg-[#f5f1e8] border-l-4 border-l-[#9c6b2e] shadow-2xs'
                          : hasUnread
                          ? 'bg-sky-50/60 hover:bg-sky-50 border-l-4 border-l-sky-500'
                          : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                      }`}
                      style={{ borderColor: '#e8e2d5' }}
                    >
                      {/* Avatar with unread indicator dot */}
                      <div className="relative shrink-0 mt-0.5">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold shadow-xs transition-transform"
                          style={{
                            background: isSelected
                              ? '#9c6b2e'
                              : hasUnread
                              ? '#0284c7'
                              : '#17140f',
                            color: '#ffffff',
                          }}
                        >
                          {conv.name?.charAt(0).toUpperCase() || 'B'}
                        </div>
                        {hasUnread && (
                          <span
                            className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-sky-500 ring-2 ring-white animate-pulse"
                            title={`${conv.unread_count} unread`}
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Name and Conversation ID */}
                        <div className="flex items-center justify-between gap-1.5">
                          <p
                            className={`truncate text-sm ${
                              hasUnread
                                ? 'font-bold text-slate-950'
                                : 'font-semibold text-slate-900'
                            }`}
                          >
                            {conv.name}
                          </p>
                          {conv.conversation_id != null ? (
                            <span
                              className="shrink-0 inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200"
                              title={`Conversation ID: ${conv.conversation_id}`}
                            >
                              Conv #{conv.conversation_id}
                            </span>
                          ) : (
                            <span className="shrink-0 text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              No Conv
                            </span>
                          )}
                        </div>

                        {/* Branch name and Unread badge */}
                        <div className="flex items-center justify-between gap-1 mt-1">
                          <p className="flex items-center gap-1 min-w-0 truncate text-xs text-slate-500">
                            <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
                            <span className="truncate">{conv.branch_name}</span>
                          </p>
                          {hasUnread && (
                            <span
                              className="shrink-0 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-xs"
                              style={{ background: '#0284c7' }}
                            >
                              {conv.unread_count} unread
                            </span>
                          )}
                        </div>

                        {/* Email */}
                        {conv.email && (
                          <p className="mt-0.5 truncate text-[11px] text-slate-400">
                            {conv.email}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Active Conversation Chat Column */}
          <section
            className={`flex-1 flex h-full min-h-0 flex-col min-w-0 bg-[#f8fafc] ${
              activeMobileView === 'list' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {selectedConversation ? (
              <>
                {/* Active Chat Header */}
                <div
                  className="px-6 py-3.5 border-b shrink-0 bg-white flex items-center justify-between shadow-2xs"
                  style={{ borderColor: '#e3ddd0' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-xs"
                      style={{ background: '#17140f' }}
                    >
                      {selectedConversation.name?.charAt(0).toUpperCase() || 'B'}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 leading-tight">
                        {selectedConversation.name}
                      </h2>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>{selectedConversation.branch_name}</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-medium">
                          Active Channel
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {conversationId ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                        <Hash className="h-3 w-3" />
                        Conversation #{conversationId}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        Awaiting initial message
                      </span>
                    )}
                  </div>
                </div>

                {/* Error Banner if any */}
                {error && (
                  <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
                    <span>{error}</span>
                    <button
                      type="button"
                      onClick={() => setError('')}
                      className="text-rose-500 hover:text-rose-700 ml-4 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Messages Body */}
                <div
                  ref={scrollRef}
                  className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 sa-scroll"
                >
                  {!conversationId ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-center text-slate-400">
                      <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-3">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-slate-700 text-sm">
                        No conversation created yet
                      </p>
                      <p className="mt-1 text-xs max-w-sm text-slate-500">
                        {selectedConversation.name} at{' '}
                        {selectedConversation.branch_name} has not started a
                        conversation yet. Once they send a message, it will
                        appear here.
                      </p>
                    </div>
                  ) : chatLoading ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
                      <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                      <p className="mt-3 text-xs">Loading message history...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-center text-slate-400">
                      <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 mb-3">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-slate-700 text-sm">
                        No messages yet
                      </p>
                      <p className="mt-1 text-xs max-w-sm">
                        Send a message to {selectedConversation.name} (Conv #{conversationId}) to continue the thread.
                      </p>
                    </div>
                  ) : (
                    groupedMessages.map((group) => (
                      <div key={group.label} className="space-y-4">
                        {/* Day label divider */}
                        <div className="flex items-center justify-center my-3">
                          <span className="rounded-full px-3 py-1 text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 shadow-2xs">
                            {group.label}
                          </span>
                        </div>

                        {/* Messages in day */}
                        {group.items.map((msg, index) => {
                          const isSuperAdminMsg =
                            msg.sender_role === 'super_admin' ||
                            msg.role === 'super_admin' ||
                            msg.is_admin === true ||
                            msg.sender === 'super_admin' ||
                            msg.sender_type === 'super_admin' ||
                            String(msg.sender_role || '')
                              .toLowerCase()
                              .includes('super') ||
                            String(msg.sender_id) === String(user?.id);

                          const isRead =
                            msg.is_read === true ||
                            msg.is_read === 'true' ||
                            msg.is_read === 1;

                          return (
                            <div
                              key={msg.id ?? index}
                              className={`flex ${
                                isSuperAdminMsg ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`sa-bubble max-w-[85%] sm:max-w-md rounded-2xl p-4 shadow-xs ${
                                  isSuperAdminMsg
                                    ? 'rounded-br-xs text-white'
                                    : 'rounded-bl-xs bg-white text-slate-900 border border-slate-200'
                                }`}
                                style={{
                                  background: isSuperAdminMsg
                                    ? 'linear-gradient(135deg, #201a12, #17140f)'
                                    : '#ffffff',
                                }}
                              >
                                <div className="flex items-center justify-between gap-4 mb-1.5">
                                  <span
                                    className={`text-[10px] font-bold uppercase tracking-wider ${
                                      isSuperAdminMsg
                                        ? 'text-sky-300'
                                        : 'text-sky-700'
                                    }`}
                                  >
                                    {isSuperAdminMsg
                                      ? 'You (Super Admin)'
                                      : selectedConversation.name}
                                  </span>
                                  <span
                                    className={`text-[10px] ${
                                      isSuperAdminMsg
                                        ? 'text-slate-400'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    {formatMessageDate(msg.created_at)}
                                  </span>
                                </div>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                  {msg.message || msg.content || msg.text}
                                </p>
                                {isSuperAdminMsg && (
                                  <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-400">
                                    {isRead ? (
                                      <span
                                        className="inline-flex items-center gap-1 text-emerald-400 font-medium"
                                        title="Read by branch admin"
                                      >
                                        <CheckCheck className="h-3 w-3" /> Read
                                      </span>
                                    ) : (
                                      <span
                                        className="inline-flex items-center gap-1 text-slate-400"
                                        title="Delivered"
                                      >
                                        <Check className="h-3 w-3" /> Sent
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input Form */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 sm:p-4 bg-white border-t shrink-0 flex items-end gap-3"
                  style={{ borderColor: '#e3ddd0' }}
                >
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={messageText}
                    disabled={!conversationId}
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      autoResize();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder={
                      conversationId
                        ? `Reply to ${selectedConversation.name}... (Press Enter to send)`
                        : 'Awaiting initial conversation from branch admin...'
                    }
                    className={`flex-1 max-h-32 min-h-[44px] resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white ${FOCUS_RING} ${
                      !conversationId ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim() || sending || !conversationId}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold transition-all shadow-xs ${
                      !messageText.trim() || sending || !conversationId
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-sky-600 text-white hover:bg-sky-700 active:scale-95'
                    }`}
                    title="Send message"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400">
                <Users className="h-12 w-12 text-slate-300 mb-3" />
                <p className="font-semibold text-slate-700 text-base">
                  No conversation selected
                </p>
                <p className="text-xs max-w-sm mt-1">
                  Choose a conversation or branch admin from the list on the
                  left to view and reply to direct messages.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminMessages;
