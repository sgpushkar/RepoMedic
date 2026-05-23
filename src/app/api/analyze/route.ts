import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { jobQueue, runPipeline } from '@/lib/analyzer';
import { after } from 'next/server';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { owner, repo, branch = 'main' } = await req.json();
  if (!owner || !repo) return NextResponse.json({ success: false, error: 'owner and repo required' });

  const job = await jobQueue.create((session as any).user.id, owner, repo, branch);
  
  after(async () => {
    try {
      await runPipeline(job.id, owner, repo, branch, { _id: (session as any).user.id, accessToken: (session as any).accessToken });
    } catch (err) {
      console.error("Pipeline background error:", err);
    }
  });
  
  return NextResponse.json({ success: true, data: { jobId: job.id } }, { status: 202 });
}
