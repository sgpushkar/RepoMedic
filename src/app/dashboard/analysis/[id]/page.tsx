import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import { Analysis } from "@/lib/models/Analysis";
import Link from "next/link";
import ResultClient from "./ResultClient";

export default async function AnalysisResult({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const { id } = await params;

  await dbConnect();
  const data: any = await Analysis.findById(id).lean();

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center text-muted">
        <h1 className="text-2xl font-bold mb-4 text-white">Analysis Not Found</h1>
        <Link href="/dashboard" className="text-accent hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  // Convert IDs and Dates to strings to pass safely to Client Component
  const safeData = {
    ...data,
    id: String(data._id || data.id),
    _id: String(data._id || data.id),
    userId: String(data.userId),
    analyzedAt: data.analyzedAt instanceof Date ? data.analyzedAt.toISOString() : new Date(data.analyzedAt).toISOString(),
    createdAt: data.createdAt ? (data.createdAt instanceof Date ? data.createdAt.toISOString() : new Date(data.createdAt).toISOString()) : undefined,
    updatedAt: data.updatedAt ? (data.updatedAt instanceof Date ? data.updatedAt.toISOString() : new Date(data.updatedAt).toISOString()) : undefined,
  };

  return <ResultClient initialData={safeData} />;
}
