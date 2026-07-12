"use client";
import { Star, Clock, Banknote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export interface MentorCardData {
  _id: string;
  bio?: string;
  experience_years: number;
  rating: number;
  ratingCount: number;
  price_per_hour: number;
  is_verified: number;
  imageUrl?: string;
  user?: { fullname: string; imageUrl?: string };
  category?: { category_name: string };
}

interface Props {
  mentor: MentorCardData;
  onClick: (id: string) => void;
}

export function MentorCard({ mentor, onClick }: Props) {
  const name = mentor.user?.fullname || "Unknown Mentor";
  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const subject = mentor.category?.category_name || "General";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-200 overflow-hidden group">
      <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <Avatar className="w-12 h-12 rounded-xl flex-shrink-0">
            <AvatarImage src={mentor.user?.imageUrl || mentor.imageUrl} />
            <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-100 to-indigo-200 text-blue-700 font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{name}</p>
            <span className="inline-block text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full mt-1">
              {subject}
            </span>
          </div>
          {mentor.is_verified === 1 && (
            <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full flex-shrink-0">✓</span>
          )}
        </div>

        {mentor.bio && (
          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-4">{mentor.bio}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <Star size={11} className="text-yellow-400 fill-yellow-400" />
            {mentor.rating > 0 ? (
              <><span className="font-semibold text-slate-700">{mentor.rating.toFixed(1)}</span> ({mentor.ratingCount})</>
            ) : "No ratings"}
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1">
            <Clock size={11} /> {mentor.experience_years} yrs
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1">
            <Banknote size={11} /> NPR {mentor.price_per_hour}/hr
          </span>
        </div>

        <Button onClick={() => onClick(mentor._id)}
          className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition group-hover:shadow-md">
          Book Session
        </Button>
      </div>
    </div>
  );
}
