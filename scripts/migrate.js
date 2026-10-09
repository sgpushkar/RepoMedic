const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Try reading DATABASE_URL from .env.local if not already in environment
function getConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/^DATABASE_URL\s*=\s*(.+)$/m);
      if (match && match[1]) return match[1].trim();
    }
  } catch (e) {}
  throw new Error('DATABASE_URL not found in environment or .env.local');
}

async function migrate() {
  const sqlPath = path.join(__dirname, '..', 'src', 'lib', 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const connectionString = getConnectionString();

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('Connected to PostgreSQL...');
  await client.query(sql);
  console.log('Schema migration applied successfully!');

  const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log('Existing tables in public:', tables.rows.map(r => r.table_name));
  await client.end();
}

migrate().catch(err => {
  console.error('Migration error:', err.message);
  process.exit(1);
});
