"use client";

import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";

export default function NavbarWrapper() {
  const { data: session } = useSession();
  if (!session?.user) return null;
  return <Navbar />;
}
