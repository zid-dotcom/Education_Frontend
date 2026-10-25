import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  BookOpen,
  ArrowLeft,
  X,
  Loader2,
  RefreshCw,
  Check,
  CheckCheck,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  sendStudentMessageApi,
  getStudentConversationsApi,
  getStudentUnreadCountApi,
  getStudentConversationThreadApi,
} from '../services/studentStaffMessages';

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
  if (Array.isArray(val.data)) return val.data;
  if (val.data && typeof val.data === 'object') {
    if (preferredKey && Array.isArray(val.data[preferredKey])) return val.data[preferredKey];
    if (Array.isArray(val.data.conversations)) return val.data.conversations;
  }
  if (Array.isArray(val.results)) return val.results;
  if (Array.isArray(val.items)) return val.items;
  return [];
};

const StudentMessages = () => {
  const { user, token } = useAuth();
  const effectiveToken = token || localStorage.getItem('token') || localStorage.getItem('studentToken');

  // Conversations & unread
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Active conversation thread
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
        getStudentConversationsApi(effectiveToken),
        getStudentUnreadCountApi(effectiveToken),
      ]);

      if (convRes.status === 'fulfilled') {
        const val = convRes.value;
        const list = extractList(val, 'conversations');
        setConversations(list);

        // Auto select first conversation if none selected on desktop
        if (!activeConversationId && list.length > 0 && window.innerWidth >= 1024) {
          const firstId = list[0].id || list[0].conversation_id;
          selectConversation(firstId, list[0]);
        }
      } else {
        console.error('Conversations fetch error:', convRes.reason);
        if (!isBackground) {
          setError(convRes.reason?.message || 'Failed to load conversations.');
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
      if (!isBackground) setError(err.message || 'Failed to load conversations.');
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
      const data = await getStudentConversationThreadApi(convId, effectiveToken);
      const msgs = extractList(data, 'messages');
      setThreadMessages(msgs);

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setActiveConversation((prev) => ({ ...prev, ...data }));
      }

      // Mark unread as 0 locally for this conversation
      setConversations((prev) =>
        prev.map((c) => {
          const cId = c.id || c.conversation_id;
          if (String(cId) === String(convId)) {
            return { ...c, unread_count: 0, unread_reply_count: 0 };
          }
          return c;
        })
      );
    } catch (err) {
      setError(err.message || 'Failed to load messages thread.');
    } finally {
      setLoadingThread(false);
    }
  };

  // Initial load & Polling
  useEffect(() => {
    loadConversations();

    // Poll every 8 seconds for new replies
    pollIntervalRef.current = setInterval(() => {
      loadConversations(true);
      if (activeConversationId) {
        getStudentConversationThreadApi(activeConversationId, effectiveToken)
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

  // Send message in existing thread
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = replyText.trim();
    if (!text || !effectiveToken || !activeConversationId || sendingReply) return;

    setSendingReply(true);
    setError('');

    try {
      const courseId =
        activeConversation?.course_id ||
        activeConversation?.course?.id;
      const staffId =
        activeConversation?.staff_id ||
        activeConversation?.staff?.id ||
        activeConversation?.staff?.staff_id;

      if (!courseId || !staffId) {
        throw new Error('Unable to identify course or faculty for this message.');
      }

      await sendStudentMessageApi(effectiveToken, {
        course_id: Number(courseId),
        staff_id: Number(staffId),
        message: text,
      });

      setReplyText('');

      // Refresh thread
      const updatedThread = await getStudentConversationThreadApi(activeConversationId, effectiveToken);
      const msgs = extractList(updatedThread, 'messages');
      if (msgs.length > 0) setThreadMessages(msgs);

      loadConversations(true);
    } catch (err) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setSendingReply(false);
    }
  };

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const staffName = (
        c.staff_name ||
        c.staff?.name ||
        c.staff_details?.name ||
        c.faculty_name ||
        ''
      ).toLowerCase();
      const courseTitle = (
        c.course_title ||
        c.course?.title ||
        c.course_name ||
        c.course_details?.title ||
        ''
      ).toLowerCase();
      const lastMsg = (
        typeof c.last_message === 'string'
          ? c.last_message
          : c.last_message?.message || c.latest_message || ''
      ).toLowerCase();
      return staffName.includes(q) || courseTitle.includes(q) || lastMsg.includes(q);
    });
  }, [conversations, searchQuery]);

  const activeHeaderName =
    activeConversation?.staff_name ||
    activeConversation?.staff?.name ||
    activeConversation?.staff_details?.name ||
    'Faculty Member';

  const activeHeaderCourse =
    activeConversation?.course_title ||
    activeConversation?.course?.title ||
    activeConversation?.course_name ||
    'Approved Course';

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-[#E3DDD0] shadow-xs overflow-hidden">
      {/* Top Banner */}
      <div className="p-3.5 sm:p-4 border-b border-[#E3DDD0] flex items-center justify-between gap-3 bg-gradient-to-r from-[#FAF8F4] via-[#F5EFE6] to-[#FAF8F4] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-[#9C6B2E] text-white flex items-center justify-center shadow-xs">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-[#17140F] tracking-tight">
                Faculty Messages
              </h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] tracking-wide animate-pulse">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs text-[#5B5346]">
              Direct communication with your assigned course faculty
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadConversations(false)}
          title="Refresh conversations"
          className="p-2 rounded-xl text-[#5B5346] hover:text-[#17140F] hover:bg-[#F1EDE4] border border-[#E3DDD0] transition cursor-pointer"
        >
          <RefreshCw
            className={`h-4 w-4 ${loadingConversations ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {error && (
        <div className="m-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            {error}
          </span>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main 2-Pane Chat Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Pane: Conversation List */}
        <aside
          className={`w-full lg:w-80 xl:w-96 border-r border-[#E3DDD0] flex flex-col bg-[#FAF8F4] shrink-0 ${
            activeConversationId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Search Box */}
          <div className="p-3 border-b border-[#E3DDD0] bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8A8175]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search faculty or course..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[#FAF8F4] border border-[#E3DDD0] text-[#17140F] placeholder:text-[#8A8175] focus:bg-white focus:border-[#9C6B2E] focus:outline-none transition"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E3DDD0] custom-student-scrollbar">
            {loadingConversations ? (
              <div className="p-8 text-center text-[#8A8175] text-xs flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 text-[#9C6B2E] animate-spin" />
                <span>Loading conversations...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-[#8A8175] text-xs space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-[#F1EDE4] text-[#9C6B2E] mx-auto flex items-center justify-center">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <p className="font-bold text-[#17140F]">No active conversations</p>
                <p className="text-[11px] text-[#5B5346] max-w-[200px] mx-auto">
                  Messages between you and your course faculty will appear here.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const cId = conv.id || conv.conversation_id;
                const isSelected = String(cId) === String(activeConversationId);
                const staffName =
                  conv.staff_name ||
                  conv.staff?.name ||
                  conv.staff_details?.name ||
                  conv.faculty_name ||
                  'Faculty Member';
                const courseTitle =
                  conv.course_title ||
                  conv.course?.title ||
                  conv.course_name ||
                  conv.course_details?.title ||
                  'Enrolled Course';
                const lastMsg =
                  typeof conv.last_message === 'string'
                    ? conv.last_message
                    : conv.last_message?.message || conv.latest_message || 'Started a conversation';
                const lastTime =
                  conv.last_message_at ||
                  conv.last_message?.created_at ||
                  conv.updated_at ||
                  conv.created_at;
                const unread = conv.unread_count || conv.unread_reply_count || 0;

                return (
                  <button
                    key={cId}
                    type="button"
                    onClick={() => selectConversation(cId, conv)}
                    className={`w-full text-left p-3.5 transition flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#F1EDE4] border-l-4 border-l-[#9C6B2E] shadow-2xs'
                        : 'hover:bg-[#F5EFE6]'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#9C6B2E] to-[#B38038] text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                        {staffName.charAt(0).toUpperCase()}
                      </div>
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-500 ring-2 ring-white" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-xs text-[#17140F] truncate">
                          {staffName}
                        </span>
                        <span className="text-[10px] font-medium text-[#8A8175] whitespace-nowrap">
                          {formatMessageDate(lastTime)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#9C6B2E] truncate mb-1">
                        <BookOpen className="h-3 w-3 shrink-0 text-[#9C6B2E]" />
                        <span className="truncate">{courseTitle}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-[#5B5346] truncate">{lastMsg}</p>
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

        {/* Right Pane: Conversation Thread */}
        <section
          className={`flex-1 flex flex-col bg-white min-w-0 ${
            !activeConversationId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {activeConversationId ? (
            <>
              {/* Thread Header */}
              <div className="p-3.5 sm:p-4 border-b border-[#E3DDD0] flex items-center justify-between gap-3 bg-white shrink-0 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setActiveConversationId(null)}
                    className="p-1.5 rounded-lg text-[#5B5346] hover:bg-[#F1EDE4] lg:hidden cursor-pointer"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#9C6B2E] to-[#B38038] text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {activeHeaderName.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-extrabold text-[#17140F] text-sm truncate">
                        {activeHeaderName}
                      </h2>
                      <span className="px-2 py-0.5 rounded-md bg-[#F1EDE4] text-[#9C6B2E] text-[10px] font-bold tracking-wide shrink-0 border border-[#E3DDD0]">
                        Course Faculty
                      </span>
                    </div>
                    <p className="text-xs text-[#9C6B2E] font-semibold truncate flex items-center gap-1.5">
                      <BookOpen className="h-3 w-3 shrink-0" />
                      <span>{activeHeaderCourse}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => selectConversation(activeConversationId)}
                  title="Refresh thread"
                  className="p-2 rounded-xl text-[#8A8175] hover:text-[#9C6B2E] hover:bg-[#F1EDE4] transition cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingThread ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Thread Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#FAF8F4] custom-student-scrollbar">
                {loadingThread ? (
                  <div className="h-full flex flex-col items-center justify-center text-[#8A8175] text-xs gap-2">
                    <Loader2 className="h-6 w-6 text-[#9C6B2E] animate-spin" />
                    <span>Loading messages...</span>
                  </div>
                ) : threadMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-[#8A8175] text-xs space-y-2">
                    <MessageSquare className="h-8 w-8 text-[#9C6B2E]" />
                    <p className="font-semibold text-[#17140F]">No messages in this conversation yet</p>
                    <p className="text-[11px] text-[#5B5346]">Type a message below to reach out to your faculty.</p>
                  </div>
                ) : (
                  threadMessages.map((msg, index) => {
                    const msgId = msg.id || msg.message_id || `msg-${index}`;
                    const senderType = (msg.sender_type || msg.sender_role || '').toLowerCase();
                    const isFromStudent =
                      senderType === 'student' ||
                      msg.is_from_student === true ||
                      (msg.sender_id && user?.id && String(msg.sender_id) === String(user.id));
                    const content = msg.message || msg.content || msg.text || '';
                    const timeStr = msg.created_at || msg.timestamp || msg.time;
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
                        key={msgId}
                        className={`flex flex-col ${
                          isFromStudent ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                            isFromStudent
                              ? 'bg-[#9C6B2E] text-white rounded-tr-none'
                              : 'bg-white text-[#17140F] rounded-tl-none border border-[#E3DDD0]'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{content}</p>
                        </div>

                        {/* Status + Time line */}
                        <div
                          className={`flex items-center gap-1.5 px-1 mt-1 text-[10px] text-[#8A8175] ${
                            isFromStudent ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span>{formatMessageTime(timeStr)}</span>
                          {isFromStudent && (
                            <span className="inline-flex items-center gap-1 ml-1">
                              {isRead ? (
                                <>
                                  <CheckCheck className="h-3.5 w-3.5 text-[#9C6B2E]" />
                                  <span className="text-[10px] text-[#9C6B2E] font-semibold">Read</span>
                                </>
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5 text-[#8A8175]" />
                                  <span className="text-[10px] text-[#8A8175]">Not read</span>
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

              {/* Message Composer Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 border-t border-[#E3DDD0] bg-white flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Type your message to ${activeHeaderName}...`}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-[#FAF8F4] border border-[#E3DDD0] text-[#17140F] placeholder:text-[#8A8175] focus:bg-white focus:border-[#9C6B2E] focus:outline-none transition"
                  disabled={sendingReply}
                />

                <button
                  type="submit"
                  disabled={!replyText.trim() || sendingReply}
                  className="px-4 py-2.5 rounded-xl bg-[#9C6B2E] hover:bg-[#855923] disabled:bg-[#D9CFC4] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  {sendingReply ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <Send className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Clean Empty State: Select conversation */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#8A8175] space-y-3 bg-[#FAF8F4]">
              <div className="h-16 w-16 rounded-2xl bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center shadow-xs border border-[#E3DDD0]">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="font-extrabold text-[#17140F] text-base">Select a conversation</h3>
              <p className="text-xs text-[#5B5346] max-w-sm">
                Choose an existing message thread on the left to view conversation history and reply to your course faculty.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default StudentMessages;
