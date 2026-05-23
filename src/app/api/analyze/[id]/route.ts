import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Analysis } from '@/lib/models/Analysis';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await dbConnect();

  const a: any = await Analysis.findById(id).lean();
  if (!a) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  const data = {
    id: String(a._id),
    repoId: a.repoId,
    repoName: a.repoName,
    repoFullName: a.repoFullName,
    branch: a.branch,
    analyzedAt: a.analyzedAt,
    duration: a.duration,
    stats: a.stats,
    languages: a.languages,
    fileTree: a.fileTree,
    unusedFiles: a.unusedFiles,
    dependencies: a.dependencies,
    duplicates: a.duplicates,
    issues: a.issues,
    healthScore: a.healthScore,
    organizerSuggestion: a.organizerSuggestion,
    aiSummary: a.aiSummary,
    suggestions: a.suggestions,
  };

  return NextResponse.json({ success: true, data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const userId = (session as any).user.id;
  await dbConnect();

  await Analysis.findOneAndDelete({ _id: id, userId });
  return NextResponse.json({ success: true, data: { deleted: true } });
}
