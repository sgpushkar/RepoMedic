import { query } from '@/lib/db';

export interface IAnalysis {
  id: string;
  _id: string;
  userId: string;
  repoId: number;
  repoName: string;
  repoFullName: string;
  branch: string;
  analyzedAt: Date;
  duration: number;
  status: string;
  jobStep: string;
  jobProgress: number;
  jobError?: string | null;
  stats: any;
  languages: any[];
  fileTree: any[];
  unusedFiles: any[];
  dependencies: any;
  duplicates: any[];
  issues: any[];
  healthScore: any;
  organizerSuggestion: any;
  aiSummary?: string | null;
  suggestions: string[];
  createdAt: Date;
  updatedAt: Date;
  save: () => Promise<IAnalysis>;
}

export class AnalysisRecord implements IAnalysis {
  id: string;
  _id: string;
  userId: string;
  repoId: number;
  repoName: string;
  repoFullName: string;
  branch: string;
  analyzedAt: Date;
  duration: number;
  status: string;
  jobStep: string;
  jobProgress: number;
  jobError: string | null;
  stats: any;
  languages: any[];
  fileTree: any[];
  unusedFiles: any[];
  dependencies: any;
  duplicates: any[];
  issues: any[];
  healthScore: any;
  organizerSuggestion: any;
  aiSummary: string | null;
  suggestions: string[];
  createdAt: Date;
  updatedAt: Date;

  constructor(row: any) {
    this.id = row.id;
    this._id = row.id;
    this.userId = row.user_id;
    this.repoId = Number(row.repo_id || 0);
    this.repoName = row.repo_name || '';
    this.repoFullName = row.repo_full_name || '';
    this.branch = row.branch || 'main';
    this.analyzedAt = row.analyzed_at ? new Date(row.analyzed_at) : new Date();
    this.duration = Number(row.duration || 0);
    this.status = row.status || 'pending';
    this.jobStep = row.job_step || 'Queued';
    this.jobProgress = Number(row.job_progress || 0);
    this.jobError = row.job_error || null;
    this.stats = typeof row.stats === 'string' ? JSON.parse(row.stats) : (row.stats || {});
    this.languages = typeof row.languages === 'string' ? JSON.parse(row.languages) : (row.languages || []);
    this.fileTree = typeof row.file_tree === 'string' ? JSON.parse(row.file_tree) : (row.file_tree || []);
    this.unusedFiles = typeof row.unused_files === 'string' ? JSON.parse(row.unused_files) : (row.unused_files || []);
    this.dependencies = typeof row.dependencies === 'string' ? JSON.parse(row.dependencies) : (row.dependencies || {});
    this.duplicates = typeof row.duplicates === 'string' ? JSON.parse(row.duplicates) : (row.duplicates || []);
    this.issues = typeof row.issues === 'string' ? JSON.parse(row.issues) : (row.issues || []);
    this.healthScore = typeof row.health_score === 'string' ? JSON.parse(row.health_score) : (row.health_score || {});
    this.organizerSuggestion = typeof row.organizer_suggestion === 'string' ? JSON.parse(row.organizer_suggestion) : row.organizer_suggestion;
    this.aiSummary = row.ai_summary || null;
    this.suggestions = typeof row.suggestions === 'string' ? JSON.parse(row.suggestions) : (row.suggestions || []);
    this.createdAt = row.created_at ? new Date(row.created_at) : new Date();
    this.updatedAt = row.updated_at ? new Date(row.updated_at) : new Date();
  }

  async save(): Promise<IAnalysis> {
    const res = await query(
      `UPDATE analyses
       SET ai_summary = $1, suggestions = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [this.aiSummary, JSON.stringify(this.suggestions || []), this.id]
    );
    if (res.rows[0]) {
      Object.assign(this, new AnalysisRecord(res.rows[0]));
    }
    return this;
  }
}

function mapAnalysis(row: any): AnalysisRecord | null {
  if (!row) return null;
  return new AnalysisRecord(row);
}

class AnalysisQuery {
  private userId?: string;
  private sortOrder: 'ASC' | 'DESC' = 'DESC';
  private limitCount?: number;

  constructor(filter?: { userId?: string }) {
    this.userId = filter?.userId;
  }

  sort(sortObj: any) {
    if (sortObj?.analyzedAt === -1 || sortObj?.createdAt === -1) {
      this.sortOrder = 'DESC';
    } else if (sortObj?.analyzedAt === 1 || sortObj?.createdAt === 1) {
      this.sortOrder = 'ASC';
    }
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  lean() {
    return this;
  }

  async exec(): Promise<AnalysisRecord[]> {
    let sql = 'SELECT * FROM analyses';
    const params: any[] = [];
    if (this.userId) {
      sql += ' WHERE user_id = $1';
      params.push(this.userId);
    }
    sql += ` ORDER BY analyzed_at ${this.sortOrder}`;
    if (this.limitCount) {
      sql += ` LIMIT $${params.length + 1}`;
      params.push(this.limitCount);
    }
    const res = await query(sql, params);
    return res.rows.map(mapAnalysis) as AnalysisRecord[];
  }

  then<TResult1 = AnalysisRecord[], TResult2 = never>(
    onfulfilled?: ((value: AnalysisRecord[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected);
  }
}

export const Analysis = {
  async create(data: any): Promise<AnalysisRecord> {
    const res = await query(
      `INSERT INTO analyses (
        user_id, repo_id, repo_name, repo_full_name, branch, duration,
        status, job_step, job_progress, job_error, stats, languages,
        file_tree, unused_files, dependencies, duplicates, issues,
        health_score, organizer_suggestion, ai_summary, suggestions
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      ) RETURNING *`,
      [
        data.userId,
        data.repoId || 0,
        data.repoName || '',
        data.repoFullName || '',
        data.branch || 'main',
        data.duration || 0,
        data.status || 'pending',
        data.jobStep || 'Queued',
        data.jobProgress || 0,
        data.jobError || null,
        JSON.stringify(data.stats || {}),
        JSON.stringify(data.languages || []),
        JSON.stringify(data.fileTree || []),
        JSON.stringify(data.unusedFiles || []),
        JSON.stringify(data.dependencies || {}),
        JSON.stringify(data.duplicates || []),
        JSON.stringify(data.issues || []),
        JSON.stringify(data.healthScore || {}),
        data.organizerSuggestion ? JSON.stringify(data.organizerSuggestion) : null,
        data.aiSummary || null,
        JSON.stringify(data.suggestions || []),
      ]
    );
    return mapAnalysis(res.rows[0])!;
  },

  findById(id: string) {
    const exec = async () => {
      const res = await query('SELECT * FROM analyses WHERE id = $1 LIMIT 1', [id]);
      if (res.rows.length === 0) return null;
      return mapAnalysis(res.rows[0]);
    };

    const promise = exec();
    return Object.assign(promise, {
      lean: () => promise,
    });
  },

  find(filter?: { userId?: string }) {
    return new AnalysisQuery(filter);
  },

  async findOneAndDelete(filter: { _id?: string; id?: string; userId?: string }) {
    const id = filter._id || filter.id;
    if (!id) return null;
    let sql = 'DELETE FROM analyses WHERE id = $1';
    const params: any[] = [id];
    if (filter.userId) {
      sql += ' AND user_id = $2';
      params.push(filter.userId);
    }
    const res = await query(sql + ' RETURNING *', params);
    return res.rows[0] ? mapAnalysis(res.rows[0]) : null;
  },
};
