"use client";
import { useAuthImage } from "../lib/hooks/useAuthImage";

interface UserAvatarProps {
  userId?: string;
  hasPhoto?: boolean;
  name: string;
  size?: number; // px
  className?: string; // controls rounding, bg color, text color e.g. "rounded-2xl bg-indigo-50 text-indigo-600"
  textClassName?: string; // controls initials font size/weight e.g. "text-xl font-bold"
}

export default function UserAvatar({
  userId,
  hasPhoto,
  name,
  size = 40,
  className = "rounded-full bg-indigo-50 text-indigo-600",
  textClassName = "text-sm font-bold",
}: UserAvatarProps) {
  const photoUrl = useAuthImage(userId, hasPhoto);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {photoUrl ? (
        <img src={photoUrl} className="w-full h-full object-cover" alt={name} />
      ) : (
        <span className={textClassName}>{initials}</span>
      )}
    </div>
  );
}