import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Analysis } from '@/lib/models/Analysis';
import OpenAI from 'openai';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your-key-here')
    return NextResponse.json({ success: false, error: 'OpenAI API key not configured' }, { status: 400 });

  const { id } = await params;
  await dbConnect();

  const a: any = await Analysis.findById(id);
  if (!a) return NextResponse.json({ success: false, error: 'Analysis not found' }, { status: 404 });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const langList  = (a.languages || []).map((l: any) => `${l.name} (${l.percent}%)`).join(', ');
  const issueList = (a.issues || []).map((i: any) => `[${i.severity.toUpperCase()}] ${i.title}`).join('\n');
  const unusedList = (a.unusedFiles || []).slice(0, 5).map((f: any) => f.name).join(', ');

  const prompt = `You are a senior software engineer doing a code review.

Repository: ${a.repoFullName}
Branch: ${a.branch}
Languages: ${langList}
Total Files: ${a.stats?.totalFiles} | Lines: ${a.stats?.totalLines} | Size: ${a.stats?.sizeKB}KB
Health Score: ${a.healthScore?.total}/100

Analysis:
- Unused Files (${a.stats?.unusedFiles}): ${unusedList || 'none'}
- Duplicate Blocks: ${(a.duplicates || []).length}
- Dependency Manager: ${a.dependencies?.manager}
- Unused Dependencies: ${(a.dependencies?.unused || []).map((d: any) => d.name).join(', ') || 'none'}

Issues:
${issueList || 'No major issues'}

Provide:

**Project Overview**
2-3 sentences on what this project is, its purpose, and tech stack.

**Architecture Assessment**
Brief assessment of code organization and design quality.

**Code Quality Analysis**
Specific observations about maintainability and technical debt.

**Top 3 Actionable Recommendations**
1. [Most impactful fix]
2. [Second fix]
3. [Third fix]

**Verdict**
One honest sentence on overall code health.

Be specific and technical. No generic advice.`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1000,
    temperature: 0.3,
  });

  const text = response.choices[0].message.content || '';
  const suggestions = text.split('\n')
    .filter((l: string) => /^\d+\./.test(l.trim()))
    .map((l: string) => l.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);

  a.aiSummary = text;
  a.suggestions = suggestions;
  await a.save();

  return NextResponse.json({ success: true, data: { summary: text, suggestions } });
}
