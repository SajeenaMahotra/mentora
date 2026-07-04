"use client";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import ConversationList from "@/components/ConversationList";
import ChatWindow from "@/components/ChatWindow";
import { useChatContext } from "@/context/chatContext";
import { ConversationSummary } from "@/lib/api/chat";

export default function MentorMessagesPage() {
  const [selected, setSelected] = useState<ConversationSummary | null>(null);
  const { setActiveConversationId } = useChatContext();

  const handleSelect = (conv: ConversationSummary) => {
    setSelected(conv);
    setActiveConversationId(conv.id);
  };

  useEffect(() => {
    return () => setActiveConversationId(null);
  }, [setActiveConversationId]);

  return (
    <div className="flex flex-col h-full p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="text-slate-500 text-sm mt-1">Chat with learners in real time.</p>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-100 overflow-hidden flex">
        <ConversationList selectedId={selected?.id ?? null} onSelect={handleSelect} />

        <div className="flex-1">
          {selected ? (
            <ChatWindow conversationId={selected.id} otherParticipant={selected.participant} />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium text-slate-500">Select a conversation</p>
                <p className="text-sm mt-1">Choose a learner to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}