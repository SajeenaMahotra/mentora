"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/authContext";
import { useChatContext } from "@/context/chatContext";
import { startConversation } from "@/lib/api/chat";

interface MessageLearnerButtonProps {
  learnerId: string;
  learnerFullname: string;
  learnerPhoto?: string;
}

export default function MessageLearnerButton({ learnerId, learnerFullname, learnerPhoto }: MessageLearnerButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const { openConversation } = useChatContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated || user?.role !== "mentor" || user._id === learnerId) {
    return null;
  }

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await startConversation(learnerId);
      const conversationId = res.data.data._id;

      openConversation({
        id: conversationId,
        participant: { _id: learnerId, fullname: learnerFullname, profilePhoto: learnerPhoto },
        lastMessageAt: undefined,
        lastMessagePreview: undefined,
        unreadCount: 0,
      });
      router.push("/mentor/messages");
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message ?? "Unable to start conversation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition"
    >
      <MessageSquare size={12} />
      {loading ? "Opening..." : "Message"}
    </button>
  );
}