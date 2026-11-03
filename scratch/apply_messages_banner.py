import re

with open('src/pages/StudentMessages.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if "MessagesBannerIllustration" not in content:
    content = content.replace(
        "import { useAuth } from '../context/AuthContext';",
        "import { useAuth } from '../context/AuthContext';\nimport { MessagesBannerIllustration } from '../components/common/StudentBannerIllustrations';"
    )

old_top_banner = '''      {/* Top Banner */}
      <div className="p-3.5 sm:p-4 border-b border-[#E3DDD0] flex items-center justify-between gap-3 bg-gradient-to-r from-[#FAF8F4] via-[#F5EFE6] to-[#FAF8F4] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-[#9C6B2E] text-white flex items-center justify-center shadow-xs">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-[#17140F] tracking-tight">
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
      </div>'''

new_top_banner = '''      {/* Top Banner */}
      <div className="relative overflow-hidden border-b border-[#E3DDD0] bg-gradient-to-r from-[#FAF6EE] via-[#FDF9F2] to-[#FAF1DF] shrink-0">
        <div className="p-3.5 sm:p-5 flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-white border border-[#ECD8B5] text-[#9C6B2E] flex items-center justify-center shadow-2xs shrink-0">
              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-bold text-[#17140F] tracking-tight">
                  Faculty Messages
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] tracking-wide animate-pulse">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[#5B5346] font-medium">
                Direct communication with your assigned course faculty
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadConversations(false)}
              title="Refresh conversations"
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-[#5B5346] hover:text-[#17140F] bg-white/90 hover:bg-[#F1EDE4] border border-[#ECDDC6] transition shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <RefreshCw
                className={`h-4 w-4 text-[#9C6B2E] ${loadingConversations ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Right Thematic Illustration - Flush to Bottom and Right */}
        <div className="hidden md:block absolute right-14 -bottom-1 w-[260px] pointer-events-none opacity-40 select-none">
          <MessagesBannerIllustration className="w-full h-auto block align-bottom" />
        </div>
      </div>'''

old_empty_state = '''            /* Clean Empty State: Select conversation */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#8A8175] space-y-3 bg-[#FAF8F4]">
              <div className="h-16 w-16 rounded-2xl bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center shadow-xs border border-[#E3DDD0]">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="font-extrabold text-[#17140F] text-base">Select a conversation</h3>
              <p className="text-xs text-[#5B5346] max-w-sm">
                Choose an existing message thread on the left to view conversation history and reply to your course faculty.
              </p>
            </div>'''

new_empty_state = '''            /* Clean Empty State: Select conversation with Thematic Illustration */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#8A8175] space-y-3 bg-[#FAF8F4]">
              <div className="w-64 max-w-full mb-2">
                <MessagesBannerIllustration className="w-full h-auto block" />
              </div>
              <h3 className="font-extrabold text-[#17140F] text-base">Select a conversation</h3>
              <p className="text-xs text-[#5B5346] max-w-sm">
                Choose an existing message thread on the left to view conversation history and reply to your course faculty.
              </p>
            </div>'''

content = content.replace(old_top_banner, new_top_banner)
content = content.replace(old_empty_state, new_empty_state)

with open('src/pages/StudentMessages.jsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("Updated StudentMessages.jsx successfully!")

