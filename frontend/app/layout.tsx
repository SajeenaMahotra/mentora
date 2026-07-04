import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/authContext";
import { ChatProvider } from "@/context/chatContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Mentora",
  description: "Connect with expert mentors for personalized learning",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ChatProvider>
            {children}
            <Toaster position="top-right" richColors expand={false} duration={3000} />
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}