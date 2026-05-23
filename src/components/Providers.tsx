"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: "#161b22",
            color: "#fff",
            border: "1px border rgba(255,255,255,0.1)",
          }
        }} 
      />
      {children}
    </SessionProvider>
  );
}
