import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  User,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  BookOpen,
  ArrowLeft,
  X,
  Sparkles,
  Check,
  CheckCheck,
} from 'lucide-react';
import {
  getStaffConversationsApi,
  getStaffUnreadCountApi,
  getStaffConversationThreadApi,
  replyStaffConversationApi,
} from '../../../services/studentStaffMessages';

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
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
    }).format(d);
  } catch {
    return String(dateStr);
  }
};

const extractList = (val, preferredKey = null) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (preferredKey && Array.isArray(val[preferredKey])) return val[preferredKey];
  if (Array.isArray(val.conversations)) return val.conversations;
  if (Array.isArray(val.student_conversations)) return val.student_conversations;
  if (Array.isArray(val.data)) return val.data;
  if (val.data && typeof val.data === 'object') {
    if (preferredKey && Array.isArray(val.data[preferredKey])) return val.data[preferredKey];
    if (Array.isArray(val.data.conversations)) return val.data.conversations;
    if (Array.isArray(val.data.student_conversations)) return val.data.student_conversations;
  }
  if (Array.isArray(val.results)) return val.results;
  if (Array.isArray(val.items)) return val.items;
  return [];
};

const StaffMessagesTab = ({ token, user }) => {
  const effectiveToken =
    token ||
    localStorage.getItem('token') ||
    localStorage.getItem('staffToken');

  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Active thread
  const [threadMessages, setThreadMessages] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [threadMessages]);

  // Load conversations list and unread count
  const loadConversations = async (isBackground = false) => {
    if (!effectiveToken) return;
    if (!isBackground) setLoadingConversations(true);
    try {
      const [convRes, countRes] = await Promise.allSettled([
        getStaffConversationsApi(effectiveToken),
        getStaffUnreadCountApi(effectiveToken),
      ]);

      if (convRes.status === 'fulfilled') {
        const val = convRes.value;
        const list = extractList(val, 'conversations');
        setConversations(list);

        // Auto-select first conversation on wide screens
        if (!activeConversationId && list.length > 0 && window.innerWidth >= 1024) {
          selectConversation(list[0].id || list[0].conversation_id, list[0]);
        }
      } else {
        console.error('Failed to load staff conversations:', convRes.reason);
        if (!isBackground) {
          setError(convRes.reason?.message || 'Failed to load student conversations.');
        }
      }

      if (countRes.status === 'fulfilled') {
        const cVal = countRes.value;
        const count =
          typeof cVal === 'number'
            ? cVal
            : typeof cVal?.unread_count === 'number'
            ? cVal.unread_count
            : typeof cVal?.count === 'number'
            ? cVal.count
            : 0;
        setUnreadCount(count);
      }
    } catch (err) {
      if (!isBackground) setError(err.message || 'Failed to load student conversations.');
    } finally {
      if (!isBackground) setLoadingConversations(false);
    }
  };

  // Select conversation and load thread
  const selectConversation = async (convId, convMeta = null) => {
    if (!convId || !effectiveToken) return;
    setActiveConversationId(convId);
    if (convMeta) setActiveConversation(convMeta);
    setLoadingThread(true);
    setError('');

    try {
      const data = await getStaffConversationThreadApi(effectiveToken, convId);
      const msgs = extractList(data, 'messages');
      setThreadMessages(msgs);
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setActiveConversation((prev) => ({ ...prev, ...data }));
      }

      // Mark unread as 0 locally
      setConversations((prev) =>
        prev.map((c) => {
          const cId = c.id || c.conversation_id;
          if (String(cId) === String(convId)) {
            return { ...c, unread_count: 0, unread_reply_count: 0, unread_messages_count: 0 };
          }
          return c;
        })
      );
    } catch (err) {
      setError(err.message || 'Failed to load conversation thread.');
    } finally {
      setLoadingThread(false);
    }
  };

  // Initial load & Polling
  useEffect(() => {
    loadConversations();
    pollIntervalRef.current = setInterval(() => {
      loadConversations(true);
      if (activeConversationId) {
        getStaffConversationThreadApi(effectiveToken, activeConversationId)
          .then((data) => {
            const msgs = extractList(data, 'messages');
            if (msgs.length > 0) setThreadMessages(msgs);
          })
          .catch(() => {});
      }
    }, 8000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [effectiveToken, activeConversationId]);

  // Reply to student in the active conversation
  const handleSendReply = async (e) => {
    e?.preventDefault();
    const text = replyText.trim();
    if (!text || !effectiveToken || !activeConversationId || sendingReply) return;

    setSendingReply(true);
    setError('');
    try {
      await replyStaffConversationApi(effectiveToken, activeConversationId, {
        message: text,
      });

      setReplyText('');

      // Refresh thread
      const updatedThread = await getStaffConversationThreadApi(effectiveToken, activeConversationId);
      const msgs = extractList(updatedThread, 'messages');
      if (msgs.length > 0) setThreadMessages(msgs);

      loadConversations(true);
    } catch (err) {
      setError(err.message || 'Failed to send reply to student.');
    } finally {
      setSendingReply(false);
    }
  };

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const studentName = (c.student_name || c.student?.name || '').toLowerCase();
      const courseTitle = (c.course_title || c.course?.title || c.course_name || '').toLowerCase();
      const lastMsg = (c.last_message?.message || c.last_message || '').toLowerCase();
      return studentName.includes(q) || courseTitle.includes(q) || lastMsg.includes(q);
    });
  }, [conversations, searchQuery]);

  return (
    <div className="h-[calc(100vh-140px)] min-h-[550px] flex flex-col bg-white rounded-3xl border border-[#E3DDD0] shadow-sm overflow-hidden sa-fade">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 border-b border-[#E3DDD0] flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#FAF8F4] via-white to-[#F1EDE4] shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#9C6B2E] to-[#B88746] text-white flex items-center justify-center shadow-md shadow-[#9C6B2E]/20">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                Student Messages & Queries
              </h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] tracking-wide animate-pulse">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Direct questions and discussions from your enrolled course students
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadConversations(false)}
          title="Refresh conversations"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-[#FAF8F4] hover:bg-[#F1EDE4] border border-[#E3DDD0] transition cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loadingConversations ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="m-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 2-Pane Chat Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Pane: Student Conversations */}
        <aside
          className={`w-full lg:w-80 xl:w-96 border-r border-[#E3DDD0] flex flex-col bg-[#FAF8F4] shrink-0 ${
            activeConversationId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Search Input */}
          <div className="p-3 border-b border-[#E3DDD0] bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or course..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[#FAF8F4] border border-[#E3DDD0] focus:bg-white focus:border-[#9C6B2E] focus:ring-2 focus:ring-[#9C6B2E]/20 transition outline-none"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E3DDD0]">
            {loadingConversations ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 text-[#9C6B2E] animate-spin" />
                <span>Loading student queries...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-[#F1EDE4] text-[#9C6B2E] mx-auto flex items-center justify-center">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <p className="font-bold text-slate-700">No student queries</p>
                <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                  Messages sent by students enrolled in your courses will appear here.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const cId = conv.id || conv.conversation_id;
                const isSelected = String(cId) === String(activeConversationId);
                const studentName = conv.student_name || conv.student?.name || 'Student';
                const courseTitle = conv.course_title || conv.course?.title || conv.course_name || 'Enrolled Course';
                const lastMsg =
                  typeof conv.last_message === 'string'
                    ? conv.last_message
                    : conv.last_message?.message || 'Started a conversation';
                const lastTime = conv.last_message_at || conv.last_message?.created_at || conv.updated_at || conv.created_at;
                const unread = conv.unread_count || conv.unread_messages_count || 0;

                return (
                  <button
                    key={cId}
                    type="button"
                    onClick={() => selectConversation(cId, conv)}
                    className={`w-full text-left p-3.5 transition flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#F1EDE4] border-l-4 border-l-[#9C6B2E] shadow-2xs'
                        : 'hover:bg-[#F1EDE4]/60'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#9C6B2E] to-[#B88746] text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                        {studentName.charAt(0).toUpperCase()}
                      </div>
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-500 ring-2 ring-white" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {studentName}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                          {formatMessageDate(lastTime)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#9C6B2E] truncate mb-1">
                        <BookOpen className="h-3 w-3 shrink-0 text-[#9C6B2E]" />
                        <span className="truncate">{courseTitle}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-500 truncate">{lastMsg}</p>
                        {unread > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-extrabold text-[10px] shrink-0">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Pane: Thread View */}
        <section
          className={`flex-1 flex flex-col bg-white min-w-0 ${
            !activeConversationId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {activeConversationId ? (
            <>
              {/* Header */}
              <div className="p-3.5 sm:p-4 border-b border-[#E3DDD0] flex items-center justify-between gap-3 bg-white shrink-0 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setActiveConversationId(null)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-[#F1EDE4] lg:hidden cursor-pointer"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#9C6B2E] to-[#B88746] text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {(activeConversation?.student_name || activeConversation?.student?.name || 'S').charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-extrabold text-slate-900 text-sm truncate">
                        {activeConversation?.student_name || activeConversation?.student?.name || 'Student'}
                      </h2>
                      <span className="px-2 py-0.5 rounded-md bg-[#F1EDE4] text-[#9C6B2E] text-[10px] font-bold tracking-wide shrink-0">
                        Student
                      </span>
                    </div>
                    <p className="text-xs text-[#9C6B2E] font-semibold truncate flex items-center gap-1.5">
                      <BookOpen className="h-3 w-3 shrink-0" />
                      <span>
                        {activeConversation?.course_title ||
                          activeConversation?.course?.title ||
                          activeConversation?.course_name ||
                          'Enrolled Course'}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => selectConversation(activeConversationId, activeConversation)}
                  title="Reload thread"
                  className="p-2 rounded-xl text-slate-400 hover:text-[#9C6B2E] hover:bg-[#F1EDE4] transition cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingThread ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Message Bubbles */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#FAF8F4]">
                {loadingThread ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2">
                    <Loader2 className="h-6 w-6 text-[#9C6B2E] animate-spin" />
                    <span>Loading conversation history...</span>
                  </div>
                ) : threadMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center space-y-2">
                    <div className="h-12 w-12 rounded-2xl bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <p className="font-bold text-slate-700">No messages in this thread yet</p>
                    <p className="text-slate-400 max-w-xs">
                      Send a reply below to initiate or respond to this student.
                    </p>
                  </div>
                ) : (
                  threadMessages.map((msg, idx) => {
                    const isStaff =
                      msg.sender_type === 'staff' ||
                      msg.is_staff === true ||
                      msg.sender_role === 'staff' ||
                      msg.sender_role === 'faculty';
                    const time = formatMessageTime(msg.created_at || msg.sent_at);

                    const isRead = Boolean(
                      msg.is_read === true ||
                      msg.read === true ||
                      msg.is_seen === true ||
                      msg.seen === true ||
                      msg.read_at ||
                      msg.status === 'read'
                    );

                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed break-words ${
                            isStaff
                              ? 'bg-gradient-to-r from-[#9C6B2E] to-[#855923] text-white rounded-br-xs'
                              : 'bg-white text-slate-800 border border-[#E3DDD0] rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.message || msg.content}</p>
                        </div>

                        {/* Status + Time line: NO avatar initials like R and A */}
                        <div
                          className={`flex items-center gap-1.5 px-1 mt-1 text-[10px] text-slate-400 ${
                            isStaff ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span>{time}</span>
                          {isStaff && (
                            <span className="inline-flex items-center gap-1 ml-1">
                              {isRead ? (
                                <>
                                  <CheckCheck className="h-3.5 w-3.5 text-[#9C6B2E]" />
                                  <span className="text-[10px] text-[#9C6B2E] font-semibold">Read</span>
                                </>
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="text-[10px] text-slate-400">Not read</span>
                                </>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Form */}
              <form
                onSubmit={handleSendReply}
                className="p-3 sm:p-4 border-t border-[#E3DDD0] bg-white shrink-0 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type reply to student..."
                  disabled={sendingReply}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-[#FAF8F4] border border-[#E3DDD0] focus:bg-white focus:border-[#9C6B2E] focus:ring-2 focus:ring-[#9C6B2E]/20 outline-none transition disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sendingReply}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9C6B2E] to-[#855923] hover:from-[#855923] hover:to-[#6E4717] shadow-md shadow-[#9C6B2E]/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingReply ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Reply</span>
                      <Send className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <div className="h-16 w-16 rounded-3xl bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center shadow-inner">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">Select a student query</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Choose a conversation on the left to read messages and send direct replies to students.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default StaffMessagesTab;
