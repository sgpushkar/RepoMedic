import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { jobQueue } from '@/lib/analyzer';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { jobId } = await params;
  const job = await jobQueue.get(jobId);

  if (!job) {
    return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
  }

  // Ensure the user checking the job is the one who created it
  if (String(job.userId) !== String((session as any).user.id)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  }

  const result = {
    ...job,
    analysisId: job.analysisId ? String(job.analysisId) : null,
  };

  return NextResponse.json({ success: true, data: result });
}
