import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import NavbarWrapper from "@/components/NavbarWrapper";

export const metadata: Metadata = {
  title: "RepoMedic AI — Repository Health Analyzer",
  description: "Analyze your GitHub repositories for unused files, dead dependencies, duplicate code, and get an AI-powered health score.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>
          <NavbarWrapper />
          {children}
        </Providers>
      </body>
    </html>
  );
}
