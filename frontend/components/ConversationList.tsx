"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle } from "lucide-react";
import { useChatContext } from "@/context/chatContext";
import { ConversationSummary } from "@/lib/api/chat";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";

function resolveAvatar(filename?: string) {
  return filename ? `${BASE_URL}/uploads/${filename}` : undefined;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatRelativeTime(iso?: string) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (conversation: ConversationSummary) => void;
}

export default function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const { conversations, loading } = useChatContext();

  return (
    <div className="w-72 border-r border-gray-100 flex flex-col flex-shrink-0 bg-white">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Conversations</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm px-4">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = selectedId === conv.id;
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition border-b border-gray-50 ${
                  isActive ? "bg-blue-50" : ""
                }`}
              >
                <Avatar className="w-10 h-10 rounded-xl flex-shrink-0">
                  <AvatarImage src={resolveAvatar(conv.participant.profilePhoto)} className="object-cover" />
                  <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-100 to-indigo-200 text-[#1d4ed8] font-bold text-sm">
                    {getInitials(conv.participant.fullname)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{conv.participant.fullname}</p>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs text-gray-400 truncate">{conv.lastMessagePreview || "No messages yet"}</p>
                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 bg-[#1d4ed8] text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}