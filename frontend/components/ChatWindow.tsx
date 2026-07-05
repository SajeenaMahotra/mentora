"use client";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Wifi, WifiOff, X, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { useChat } from "@/lib/hooks/useChat";
import { ChatParticipant, ChatMessage } from "@/lib/api/chat";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";

function resolveAvatar(filename?: string) {
  if (!filename) return undefined;
  return `${BASE_URL}/uploads/${filename}`;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-NP", { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-NP", { day: "numeric", month: "short", year: "numeric" });
}

interface ChatWindowProps {
  conversationId: string;
  otherParticipant: ChatParticipant;
  onClose?: () => void;
  isModal?: boolean;
}

export default function ChatWindow({ conversationId, otherParticipant, onClose, isModal = false }: ChatWindowProps) {
  const { user } = useAuth();
  const {
    messages,
    isConnected,
    isLoadingHistory,
    hasMore,
    otherTyping,
    joinError,
    sendMessage,
    emitTyping,
    loadOlder,
  } = useChat(conversationId);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const partnerAvatar = resolveAvatar(otherParticipant.profilePhoto);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, otherTyping]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setSending(true);
    const res = await sendMessage(trimmed);
    setSending(false);
    if (res.success) setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const grouped: { label: string; msgs: ChatMessage[] }[] = [];
  messages.forEach((msg) => {
    const label = formatDateLabel(msg.createdAt);
    const last = grouped[grouped.length - 1];
    if (last && last.label === label) {
      last.msgs.push(msg);
    } else {
      grouped.push({ label, msgs: [msg] });
    }
  });

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 rounded-xl ring-2 ring-purple-50">
            <AvatarImage src={partnerAvatar} className="object-cover" />
            <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-100 to-indigo-200 text-[#1d4ed8] font-bold text-sm">
              {getInitials(otherParticipant.fullname)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-bold text-gray-900">{otherParticipant.fullname}</p>
            <div className="flex items-center gap-1">
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-green-500" />
                  <span className="text-[10px] text-green-500 font-medium">
                    {otherTyping ? "Typing..." : "Connected"}
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] text-gray-400">Connecting...</span>
                </>
              )}
            </div>
          </div>
        </div>
        {isModal && onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#faf9f7]">
        {joinError && <p className="text-center text-xs text-red-500 py-2">{joinError}</p>}

        {hasMore && (
          <div className="flex justify-center">
            <button onClick={loadOlder} className="text-xs text-[#1d4ed8] font-medium hover:underline">
              Load older messages
            </button>
          </div>
        )}

        {isLoadingHistory && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#1d4ed8] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoadingHistory && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
            <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-[#1d4ed8]" />
            </div>
            <p className="text-sm text-gray-400 font-medium">No messages yet</p>
            <p className="text-xs text-gray-300">Start the conversation!</p>
          </div>
        )}

        {grouped.map(({ label, msgs }) => (
          <div key={label}>
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[10px] font-semibold text-gray-400 px-2">{label}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="space-y-1.5">
              {msgs.map((msg, i) => {
                console.log("DEBUG", { sender: msg.sender._id, me: user?._id, match: msg.sender._id === user?._id });
                const isMe = msg.sender._id === user?._id;
                const showAvatar = !isMe && (i === 0 || msgs[i - 1]?.sender._id !== msg.sender._id);

                return (
                  <div key={msg._id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    <div className="w-7 shrink-0">
                      {!isMe && showAvatar && (
                        <Avatar className="w-7 h-7 rounded-lg">
                          <AvatarImage src={resolveAvatar(msg.sender.profilePhoto)} className="object-cover" />
                          <AvatarFallback className="rounded-lg bg-purple-100 text-[#1d4ed8] text-[10px] font-bold">
                            {getInitials(msg.sender.fullname ?? "?")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>

                    <div className={`flex flex-col gap-0.5 max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                      <div
                        className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                          isMe
                            ? "bg-[#1d4ed8] text-white rounded-br-sm"
                            : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-gray-400 px-1">
                        {formatMessageTime(msg.createdAt)}
                        {isMe && <span className="ml-1">{msg.readAt ? "· Seen" : "· Sent"}</span>}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {otherTyping && (
          <div className="flex items-end gap-2">
            <div className="w-7 shrink-0" />
            <div className="bg-white border border-gray-100 shadow-sm px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 bg-white border-t border-gray-100">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              emitTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            maxLength={2000}
            className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/20 transition-all max-h-28 overflow-y-auto"
            style={{ height: "auto" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 112) + "px";
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !isConnected || sending}
            className="w-10 h-10 rounded-xl bg-[#1d4ed8] text-white flex items-center justify-center shrink-0 hover:bg-[#163fb0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}