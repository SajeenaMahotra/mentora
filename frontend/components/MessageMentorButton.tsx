"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/authContext";
import { useChatContext } from "@/context/chatContext";
import { startConversation } from "@/lib/api/chat";

interface MessageMentorButtonProps {
  mentorId: string;
  mentorFullname: string;
  mentorPhoto?: string;
}

export default function MessageMentorButton({ mentorId, mentorFullname, mentorPhoto }: MessageMentorButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const { openConversation } = useChatContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated || user?.role !== "learner" || user._id === mentorId) {
    return null;
  }

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await startConversation(mentorId);
      const conversationId = res.data.data._id;


      openConversation({
        id: conversationId,
        participant: { _id: mentorId, fullname: mentorFullname, profilePhoto: mentorPhoto },
        lastMessageAt: undefined,
        lastMessagePreview: undefined,
        unreadCount: 0,
      });
      router.push("/message");
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
      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition"
    >
      <MessageSquare size={16} />
      {loading ? "Opening..." : "Message"}
    </button>
  );
}