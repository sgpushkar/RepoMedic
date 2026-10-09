import { query } from '@/lib/db';

export interface IJob {
  _id: string;
  id: string;
  userId: string;
  owner: string;
  repo: string;
  branch: string;
  status: 'pending' | 'running' | 'done' | 'error';
  step: string;
  progress: number;
  error?: string | null;
  analysisId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  toObject: () => Record<string, any>;
}

function mapJob(row: any): IJob | null {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    owner: row.owner,
    repo: row.repo,
    branch: row.branch,
    status: row.status,
    step: row.step,
    progress: Number(row.progress || 0),
    error: row.error,
    analysisId: row.analysis_id,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    toObject() {
      return {
        _id: this._id,
        id: this.id,
        userId: this.userId,
        owner: this.owner,
        repo: this.repo,
        branch: this.branch,
        status: this.status,
        step: this.step,
        progress: this.progress,
        error: this.error,
        analysisId: this.analysisId,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      };
    },
  };
}

function buildJobPatch(patch: any) {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (patch.status !== undefined) {
    fields.push(`status = $${idx++}`);
    values.push(patch.status);
  }
  if (patch.step !== undefined) {
    fields.push(`step = $${idx++}`);
    values.push(patch.step);
  }
  if (patch.progress !== undefined) {
    fields.push(`progress = $${idx++}`);
    values.push(patch.progress);
  }
  if (patch.error !== undefined) {
    fields.push(`error = $${idx++}`);
    values.push(patch.error);
  }
  if (patch.analysisId !== undefined) {
    fields.push(`analysis_id = $${idx++}`);
    values.push(patch.analysisId);
  }
  fields.push(`updated_at = NOW()`);
  return { fields, values };
}

export const Job = {
  async create(data: {
    _id: string;
    userId: string;
    owner: string;
    repo: string;
    branch?: string;
    status?: string;
    step?: string;
    progress?: number;
  }): Promise<IJob> {
    const res = await query(
      `INSERT INTO jobs (id, user_id, owner, repo, branch, status, step, progress)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data._id,
        data.userId,
        data.owner,
        data.repo,
        data.branch || 'main',
        data.status || 'pending',
        data.step || 'Queued',
        data.progress || 0,
      ]
    );
    return mapJob(res.rows[0])!;
  },

  findById(id: string) {
    const exec = async () => {
      const res = await query('SELECT * FROM jobs WHERE id = $1 LIMIT 1', [id]);
      if (res.rows.length === 0) return null;
      return mapJob(res.rows[0]);
    };

    const promise = exec();
    return Object.assign(promise, {
      lean: () => promise,
    });
  },

  async findByIdAndUpdate(id: string, update: any, _options?: any) {
    const patch = update?.$set || update;
    const { fields, values } = buildJobPatch(patch);
    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const sql = `UPDATE jobs SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`;
    const res = await query(sql, values);
    return mapJob(res.rows[0]);
  },

  async findOneAndUpdate(filter: { _id?: string; status?: any }, update: any, _options?: any) {
    const id = filter?._id;
    if (!id) return null;

    const patch = update?.$set || update;
    const { fields, values } = buildJobPatch(patch);
    if (fields.length === 0) return this.findById(id);

    values.push(id);
    let sql = `UPDATE jobs SET ${fields.join(', ')} WHERE id = $${values.length}`;
    if (filter.status?.$nin) {
      const excluded = filter.status.$nin;
      sql += ` AND status NOT IN (${excluded.map((s: string) => `'${s}'`).join(', ')})`;
    }
    sql += ` RETURNING *`;

    const res = await query(sql, values);
    return mapJob(res.rows[0]);
  },
};
