import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Analysis } from '@/lib/models/Analysis';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const userId = (session as any).user.id;
  const results = await Analysis.find({ userId }).sort({ analyzedAt: -1 }).limit(30).lean();

  const data = results.map((a: any) => ({
    id: String(a._id),
    repoName: a.repoName,
    repoFullName: a.repoFullName,
    branch: a.branch,
    analyzedAt: a.analyzedAt,
    duration: a.duration,
    stats: a.stats,
    languages: a.languages,
    healthScore: a.healthScore,
    aiSummary: a.aiSummary,
    dependencies: { unused: a.dependencies?.unused || [] },
  }));

  return NextResponse.json({ success: true, data });
}
