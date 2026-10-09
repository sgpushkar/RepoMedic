import { query } from '@/lib/db';

export interface IUser {
  id: string;
  _id: string;
  githubId: number;
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  accessToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserModel implements IUser {
  id: string;
  _id: string;
  githubId: number;
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  accessToken?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(row: any) {
    this.id = row.id;
    this._id = row.id;
    this.githubId = Number(row.github_id ?? row.githubId);
    this.login = row.login || '';
    this.name = row.name ?? '';
    this.avatar_url = row.avatar_url ?? '';
    this.html_url = row.html_url ?? '';
    this.public_repos = Number(row.public_repos ?? 0);
    this.followers = Number(row.followers ?? 0);
    this.accessToken = row.access_token ?? row.accessToken;
    this.createdAt = row.created_at ? new Date(row.created_at) : new Date();
    this.updatedAt = row.updated_at ? new Date(row.updated_at) : new Date();
  }

  async save(): Promise<UserModel> {
    const res = await query(
      `UPDATE users
       SET login = $1, name = $2, avatar_url = $3, html_url = $4,
           public_repos = $5, followers = $6, access_token = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        this.login,
        this.name,
        this.avatar_url,
        this.html_url,
        this.public_repos,
        this.followers,
        this.accessToken || null,
        this.id,
      ]
    );
    if (res.rows[0]) {
      Object.assign(this, new UserModel(res.rows[0]));
    }
    return this;
  }
}

export const User = {
  async findOne({ githubId }: { githubId?: number }): Promise<UserModel | null> {
    if (githubId === undefined) return null;
    const res = await query('SELECT * FROM users WHERE github_id = $1 LIMIT 1', [githubId]);
    if (res.rows.length === 0) return null;
    return new UserModel(res.rows[0]);
  },

  async create(data: Partial<IUser> & { githubId: number }): Promise<UserModel> {
    const res = await query(
      `INSERT INTO users (github_id, login, name, avatar_url, html_url, public_repos, followers, access_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.githubId,
        data.login || '',
        data.name || '',
        data.avatar_url || '',
        data.html_url || '',
        data.public_repos || 0,
        data.followers || 0,
        data.accessToken || null,
      ]
    );
    return new UserModel(res.rows[0]);
  },

  async findById(id: string): Promise<UserModel | null> {
    if (!id) return null;
    const res = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    if (res.rows.length === 0) return null;
    return new UserModel(res.rows[0]);
  },
};
