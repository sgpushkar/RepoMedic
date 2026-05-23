// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { rimraf } from 'rimraf';
import simpleGit from 'simple-git';
import crypto from 'crypto';
import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { Analysis } from './models/Analysis';

export const jobs = new Map();
export const jobResultMap = new Map();

export const jobQueue = {
  create(userId: string, owner: string, repo: string, branch: string) {
    const job = { id: uuidv4(), owner, repo, branch, userId, status: 'pending', progress: 0, step: 'Queued', createdAt: new Date() };
    jobs.set(job.id, job);
    return job;
  },
  get(id: string) { return jobs.get(id); },
  update(id: string, patch: any) { const j = jobs.get(id); if (j) jobs.set(id, { ...j, ...patch }); },
};

// ── Language Colors ───────────────────────────────────────────
const LANG_COLORS: Record<string, string> = {
  Python:'#3572A5', JavaScript:'#f1e05a', TypeScript:'#2b7489', HTML:'#e34c26',
  CSS:'#563d7c', Java:'#b07219', 'C++':'#f34b7d', C:'#555555', Rust:'#dea584',
  Go:'#00ADD8', Ruby:'#701516', PHP:'#4F5D95', Shell:'#89e051', Markdown:'#083fa1',
  JSON:'#292929', YAML:'#cb171e', Kotlin:'#A97BFF', Swift:'#FA7343', Other:'#666677',
}

// ── Clone Service ─────────────────────────────────────────────
const TEMP_DIR = path.resolve(__dirname, '../temp_repos')
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })

const cloneService = {
  getPath(owner: string, repo: string) { return path.join(TEMP_DIR, `${owner}_${repo}_${Date.now()}`) },

  async clone(owner: string, repo: string, token: string, branch: string = 'main') {
    const repoPath = this.getPath(owner, repo)
    const cloneUrl = `https://${token}@github.com/${owner}/${repo}.git`
    console.log(`[Clone] ${owner}/${repo}@${branch}`)
    const git = simpleGit()
    try {
      await git.clone(cloneUrl, repoPath, ['--depth', '1', '--branch', branch, '--single-branch'])
    } catch {
      await git.clone(cloneUrl, repoPath, ['--depth', '1', '--single-branch'])
    }
    console.log(`[Clone] Done`)
    return repoPath
  },

  async cleanup(repoPath: string) {
    try { if (repoPath && fs.existsSync(repoPath)) await rimraf(repoPath) } catch {}
  },

  getSize(dirPath: string) {
    let total = 0
    const walk = (p: string) => {
      try {
        const s = fs.statSync(p)
        if (s.isDirectory()) fs.readdirSync(p).forEach(f => walk(path.join(p, f)))
        else total += s.size
      } catch {}
    }
    walk(dirPath)
    return Math.round(total / 1024)
  },
}

// ── File Scanner ──────────────────────────────────────────────
const EXT_LANG: Record<string, string> = {
  '.py':'Python', '.js':'JavaScript', '.jsx':'JavaScript', '.ts':'TypeScript', '.tsx':'TypeScript',
  '.java':'Java', '.html':'HTML', '.htm':'HTML', '.css':'CSS', '.scss':'CSS', '.sass':'CSS',
  '.go':'Go', '.rb':'Ruby', '.php':'PHP', '.rs':'Rust', '.cpp':'C++', '.cxx':'C++', '.cc':'C++',
  '.c':'C', '.h':'C', '.cs':'C#', '.sh':'Shell', '.bash':'Shell', '.md':'Markdown',
  '.yaml':'YAML', '.yml':'YAML', '.json':'JSON', '.kt':'Kotlin', '.swift':'Swift',
  '.dart':'Dart', '.vue':'JavaScript', '.svelte':'JavaScript',
}
const SKIP_DIRS = new Set([
  'node_modules','.git','__pycache__','.venv','venv','env','dist','build',
  '.next','out','coverage','.nyc_output','.tox','target','vendor','.idea','.vscode',
])
const BINARY_EXTS = new Set([
  '.png','.jpg','.jpeg','.gif','.ico','.svg','.webp','.mp4','.mp3','.wav',
  '.pdf','.zip','.tar','.gz','.exe','.bin','.so','.dylib','.dll',
  '.woff','.woff2','.ttf','.eot','.db','.sqlite','.lock',
])

function scanFiles(rootDir: string) {
  const files: { name: string; path: string; absPath: string; ext: string; size: number; lines: number; content: string; }[] = []
  const walk = (dir: string, relBase: string) => {
    let entries = []
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue
      const rel  = relBase ? `${relBase}/${e.name}` : e.name
      const full = path.join(dir, e.name)
      if (e.isDirectory()) { walk(full, rel); continue }
      const ext = path.extname(e.name).toLowerCase()
      if (BINARY_EXTS.has(ext)) continue
      let size = 0, lines = 0, content = ''
      try {
        size    = fs.statSync(full).size
        content = fs.readFileSync(full, 'utf-8')
        lines   = content.split('\n').length
      } catch { continue }
      files.push({ name: e.name, path: rel, absPath: full, ext, size, lines, content })
    }
  }
  walk(rootDir, '')
  return files
}

function buildTree(rootDir: string, unusedPaths: Set<string> = new Set(), duplicatePaths: Set<string> = new Set()) {
  const root   = { name: path.basename(rootDir), path: '', type: 'dir', status: 'clean', children: [] }
  const dirMap: Record<string, any> = { '': root }

  const walk = (dir: string, relBase: string) => {
    let entries = []
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    const sorted = [...entries].sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    for (const e of sorted) {
      if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue
      const rel    = relBase ? `${relBase}/${e.name}` : e.name
      const full   = path.join(dir, e.name)
      const parent = dirMap[relBase]
      if (!parent) continue

      if (e.isDirectory()) {
        const node = { name: e.name, path: rel, type: 'dir', status: 'clean', children: [] }
        parent.children.push(node)
        dirMap[rel] = node
        walk(full, rel)
      } else {
        let size = 0
        try { size = fs.statSync(full).size } catch {}
        const status = unusedPaths.has(rel) ? 'unused' : duplicatePaths.has(rel) ? 'duplicate' : 'clean'
        parent.children.push({ name: e.name, path: rel, type: 'file', status, size })
      }
    }
  }
  walk(rootDir, '')
  return root.children
}

// ── Language Detector ─────────────────────────────────────────
function detectLanguages(files: any[]) {
  const counts: Record<string, number> = {}
  for (const f of files) {
    const lang = EXT_LANG[(f.ext as string)]
    if (lang) counts[lang] = (counts[lang] || 0) + Math.max(f.lines, 1)
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
  const results = Object.entries(counts)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([name, c]) => ({ name, percent: Math.round(c / total * 100), color: LANG_COLORS[name] || LANG_COLORS.Other }))
  const sum = results.reduce((a, r) => a + r.percent, 0)
  if (results.length) results[0].percent += (100 - sum)
  return results
}

// ── Unused File Detector ──────────────────────────────────────
const UNUSED_PATTERNS = [
  /\.bak$/i, /\.backup$/i, /\.tmp$/i, /\.temp$/i, /\.old$/i, /\.orig$/i,
  /~$/, /\.swp$/i, /\.swo$/i, /\.log$/i,
  /debug\.log/i, /error\.log/i, /npm-debug\.log/i, /yarn-error\.log/i,
  /Thumbs\.db$/i, /desktop\.ini$/i,
  /_copy\./i, /copy of /i, /\(copy\)/i, /_backup\./i, /_old\./i,
  /^test_output/i, /^temp_/i, /^tmp_/i,
]

function detectUnusedFiles(files: any[]) {
  const unused = []
  for (const f of files) {
    for (const pat of UNUSED_PATTERNS) {
      if (pat.test(f.name)) {
        unused.push({ path: f.path, name: f.name, size: f.size, reason: `Matches pattern: ${pat.source}` })
        break
      }
    }
    if (f.size < 10 && !f.name.startsWith('.') && f.ext !== '.md') {
      if (!unused.find(u => u.path === f.path))
        unused.push({ path: f.path, name: f.name, size: f.size, reason: 'Empty file' })
    }
  }
  return unused
}

// ── Dependency Checker ────────────────────────────────────────
function checkDependencies(repoPath: string, files: any[]) {
  const hasPip = fs.existsSync(path.join(repoPath, 'requirements.txt'))
  const hasNpm = fs.existsSync(path.join(repoPath, 'package.json'))
  if (hasPip) return checkPython(repoPath, files)
  if (hasNpm) return checkNpm(repoPath, files)
  return { manager: 'none', used: [], unused: [] }
}

function checkPython(repoPath: string, files: any[]) {
  let declared = []
  try {
    const raw = fs.readFileSync(path.join(repoPath, 'requirements.txt'), 'utf-8')
    declared = raw.split('\n').map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && !l.startsWith('-'))
      .map(l => {
        const m = l.match(/^([A-Za-z0-9_\-\.]+)\s*([><=!~]+\s*[\w\.\*]+)?/)
        return m ? { name: m[1], version: m[2]?.trim() || '*' } : null
      }).filter(Boolean)
  } catch { return { manager: 'pip', used: [], unused: [] } }

  const imports = new Set()
  for (const f of files) {
    if (f.ext !== '.py') continue
    for (const m of f.content.matchAll(/^(?:import|from)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gm))
      imports.add(m[1].toLowerCase())
  }

  const used = [], unused = []
  for (const pkg of declared) {
    const norm = pkg.name.toLowerCase().replace(/[-_.]/g, '_')
    const isUsed = imports.has(norm) || imports.has(pkg.name.toLowerCase()) ||
      [...imports].some(i => i.startsWith(norm.slice(0, 4)))
    ;(isUsed ? used : unused).push(pkg)
  }
  return { manager: 'pip', used, unused }
}

function checkNpm(repoPath: string, files: any[]) {
  let declared = []
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(repoPath, 'package.json'), 'utf-8'))
    declared = Object.entries({ ...raw.dependencies, ...raw.devDependencies })
      .map(([name, version]) => ({ name, version: String(version) }))
  } catch { return { manager: 'npm', used: [], unused: [] } }

  const imports = new Set()
  for (const f of files) {
    if (!['.js','.jsx','.ts','.tsx','.mjs'].includes(f.ext)) continue
    for (const m of f.content.matchAll(/require\s*\(\s*['"]([^'"./][^'"]*?)['"]/g)) imports.add(m[1].split('/')[0])
    for (const m of f.content.matchAll(/(?:import|from)\s+['"]([^'"./][^'"]*?)['"]/g)) imports.add(m[1].split('/')[0])
  }

  const used = [], unused = []
  for (const pkg of declared) {
    const bare   = pkg.name.startsWith('@') ? pkg.name : pkg.name.split('/').pop()
    const isUsed = imports.has(pkg.name) || imports.has(bare) ||
      imports.has(pkg.name.replace('@types/', '')) ||
      ['react','vite','typescript','eslint','prettier','jest','webpack','babel'].some(t => pkg.name.includes(t))
    ;(isUsed ? used : unused).push(pkg)
  }
  return { manager: 'npm', used, unused }
}

// ── Duplicate Detector ────────────────────────────────────────
function detectDuplicates(files: any[]) {
  const WINDOW  = 5
  const blockMap = new Map()

  for (const f of files) {
    if (!['.py','.js','.jsx','.ts','.tsx','.java','.cpp','.c','.go','.rb'].includes(f.ext)) continue
    const lines = f.content.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('//') && !l.startsWith('#') && !l.startsWith('*'))

    for (let i = 0; i <= lines.length - WINDOW; i++) {
      const block = lines.slice(i, i + WINDOW).join('\n')
      if (block.length < 80) continue
      const hash = crypto.createHash('md5').update(block).digest('hex')
      if (!blockMap.has(hash)) blockMap.set(hash, [])
      blockMap.get(hash).push({ file: f.path, lineStart: i + 1 })
    }
  }

  const duplicates = []
  const seenFiles  = new Set()

  for (const [hash, locs] of blockMap.entries()) {
    const uniqueFiles = [...new Set(locs.map(l => l.file))]
    if (uniqueFiles.length >= 2) {
      duplicates.push({ files: uniqueFiles, lines: WINDOW, hash })
      uniqueFiles.forEach(f => seenFiles.add(f))
    }
  }
  return { duplicates: duplicates.slice(0, 20), duplicateFiles: seenFiles }
}

// ── Health Score ──────────────────────────────────────────────
function computeHealthScore(stats: any, deps: any, duplicates: any[], issues: any[]) {
  const totalFiles    = Math.max(stats.totalFiles, 1)
  const fileClean     = Math.max(0, 100 - Math.round((stats.unusedFiles / totalFiles) * 200))
  const dependencies  = deps.unused.length === 0 ? 100 : Math.max(0, 100 - deps.unused.length * 10)
  const dupeScore     = Math.max(0, 100 - duplicates.length * 6)
  const documentation = Math.max(0, 100 - issues.filter(i => i.category === 'docs').length * 25)
  const structure     = Math.max(0, 100 - issues.filter(i => i.category === 'structure').length * 15)
  const total = Math.round(fileClean*0.25 + dependencies*0.25 + dupeScore*0.20 + structure*0.15 + documentation*0.15)
  return { total, breakdown: { fileClean, dependencies, duplicates: dupeScore, structure, documentation } }
}

// ── Issues Builder ────────────────────────────────────────────
function buildIssues(repoPath: string, unusedFiles: any[], deps: any, duplicates: any[]) {
  const issues = []
  let n = 0
  const id = () => `issue_${++n}`

  if (unusedFiles.length > 0)
    issues.push({ id:id(), severity:'high', category:'unused',
      title:`${unusedFiles.length} unused/temp files found`,
      description:`Files like ${unusedFiles.slice(0,3).map(f=>f.name).join(', ')} are not needed. Remove them to reduce repo size.`,
      fixable:true })

  if (deps.unused.length > 0)
    issues.push({ id:id(), severity:'high', category:'dependency',
      title:`${deps.unused.length} unused ${deps.manager} packages`,
      description:`Never imported: ${deps.unused.slice(0,4).map(d=>d.name).join(', ')}. Remove to reduce attack surface.`,
      fixable:true })

  if (duplicates.length > 2)
    issues.push({ id:id(), severity:'medium', category:'duplicate',
      title:`${duplicates.length} duplicate code blocks`,
      description:`Similar code found across multiple files. Extract to shared utilities.`,
      fixable:false })

  if (!fs.existsSync(path.join(repoPath, '.gitignore')))
    issues.push({ id:id(), severity:'medium', category:'structure',
      title:'Missing .gitignore',
      description:'Build artifacts or sensitive files may be committed accidentally.',
      fixable:true })

  const readmeExists = ['README.md','README.rst','README.txt','readme.md']
    .some(f => fs.existsSync(path.join(repoPath, f)))
  if (!readmeExists)
    issues.push({ id:id(), severity:'low', category:'docs',
      title:'Missing README',
      description:'No README found. Improves discoverability and onboarding.',
      fixable:true })

  const hasTests = ['tests','test','__tests__','spec']
    .some(d => fs.existsSync(path.join(repoPath, d)))
  if (!hasTests)
    issues.push({ id:id(), severity:'low', category:'structure',
      title:'No test directory found',
      description:'No tests/ or __tests__/ found. Consider adding automated tests.',
      fixable:false })

  const hasCI = ['.github/workflows','.travis.yml','Jenkinsfile','.circleci']
    .some(p => fs.existsSync(path.join(repoPath, p)))
  if (!hasCI)
    issues.push({ id:id(), severity:'low', category:'structure',
      title:'No CI/CD configuration',
      description:'No CI/CD pipeline detected. Consider GitHub Actions.',
      fixable:false })

  return issues
}

// ── Auto Organizer ────────────────────────────────────────────
const STANDARD_STRUCTURES = {
  Python:     { '/src':'Main modules (*.py)', '/tests':'Tests (test_*.py)', '/docs':'Documentation', '/config':'Config files', '/scripts':'Utility scripts' },
  JavaScript: { '/src':'Source code', '/src/components':'UI components', '/src/pages':'Pages', '/src/utils':'Helpers', '/public':'Static assets', '/tests':'Tests' },
  TypeScript: { '/src':'Source code', '/src/types':'Type defs', '/src/hooks':'Hooks', '/src/services':'Services', '/src/components':'Components', '/tests':'Tests' },
  Java:       { '/src/main/java':'Source code', '/src/test/java':'Tests', '/src/main/resources':'Resources' },
  default:    { '/src':'Source', '/tests':'Tests', '/docs':'Docs', '/config':'Config', '/assets':'Assets' },
}

function buildOrganizerSuggestion(languages: any[], unusedFiles: any[]) {
  const lang = languages[0]?.name || 'default'
  const structure = STANDARD_STRUCTURES[lang] || STANDARD_STRUCTURES.default
  const moveOps = unusedFiles.slice(0, 8).map(f => ({ from: f.path, to: `.archive/${f.name}`, reason: f.reason, action: 'archive' }))
  return {
    primaryLanguage: lang,
    suggestedStructure: structure,
    moveOperations: moveOps,
    estimatedCleanup: `~${unusedFiles.reduce((a, f) => a + f.size, 0)} bytes recoverable`,
    summary: `Reorganize to standard ${lang} structure. Archive ${moveOps.length} unused files.`,
  }
}

// ── AI Service ────────────────────────────────────────────────
let _openai = null
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _openai
}

async function generateAISummary(analysis) {
  const langList  = analysis.languages.map(l => `${l.name} (${l.percent}%)`).join(', ')
  const issueList = (analysis.issues || []).map(i => `[${i.severity.toUpperCase()}] ${i.title}`).join('\n')
  const unusedList = (analysis.unusedFiles || []).slice(0,5).map(f=>f.name).join(', ')

  const prompt = `You are a senior software engineer doing a code review.

Repository: ${analysis.repoFullName}
Branch: ${analysis.branch}
Languages: ${langList}
Total Files: ${analysis.stats?.totalFiles} | Lines: ${analysis.stats?.totalLines} | Size: ${analysis.stats?.sizeKB}KB
Health Score: ${analysis.healthScore?.total}/100

Analysis:
- Unused Files (${analysis.stats?.unusedFiles}): ${unusedList || 'none'}
- Duplicate Blocks: ${(analysis.duplicates||[]).length}
- Dependency Manager: ${analysis.dependencies?.manager}
- Unused Dependencies: ${(analysis.dependencies?.unused||[]).map(d=>d.name).join(', ') || 'none'}

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

Be specific and technical. No generic advice.`

  const response = await getOpenAI().chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1000,
    temperature: 0.3,
  })

  const text = response.choices[0].message.content || ''
  const suggestions = text.split('\n')
    .filter(l => /^\d+\./.test(l.trim()))
    .map(l => l.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean)
  return { summary: text, suggestions }
}

// ── Serialize ─────────────────────────────────────────────────
function serialize(a) {
  return {
    id: String(a._id), repoId: a.repoId, repoName: a.repoName,
    repoFullName: a.repoFullName, branch: a.branch, analyzedAt: a.analyzedAt,
    duration: a.duration, stats: a.stats, languages: a.languages, fileTree: a.fileTree,
    unusedFiles: a.unusedFiles, dependencies: a.dependencies, duplicates: a.duplicates,
    issues: a.issues, healthScore: a.healthScore, organizerSuggestion: a.organizerSuggestion,
    aiSummary: a.aiSummary, suggestions: a.suggestions,
  }
}

// ── Full Pipeline ─────────────────────────────────────────────
export async function runPipeline(jobId: string, owner: string, repo: string, branch: string, user: any) {
  const step  = (s, p) => jobQueue.update(jobId, { step:s, progress:p, status:'running' })
  const start = Date.now()
  let repoPath = ''

  try {
    step('Cloning repository', 8)
    repoPath = await cloneService.clone(owner, repo, user.accessToken, branch)

    step('Scanning file structure', 18)
    const files = scanFiles(repoPath)
    console.log(`[Scan] ${files.length} files`)

    step('Detecting languages', 28)
    const languages = detectLanguages(files)

    step('Finding unused files', 38)
    const unusedFiles = detectUnusedFiles(files)
    console.log(`[Unused] ${unusedFiles.length} files`)

    step('Auditing dependencies', 50)
    const dependencies = checkDependencies(repoPath, files)
    console.log(`[Deps] used=${dependencies.used.length} unused=${dependencies.unused.length}`)

    step('Detecting duplicate code', 62)
    const { duplicates, duplicateFiles } = detectDuplicates(files)
    console.log(`[Dupes] ${duplicates.length} blocks`)

    step('Building issue list', 72)
    const issues = buildIssues(repoPath, unusedFiles, dependencies, duplicates)

    step('Calculating health score', 80)
    const stats = {
      totalFiles:      files.length,
      totalLines:      files.reduce((a, f) => a + f.lines, 0),
      unusedFiles:     unusedFiles.length,
      duplicateBlocks: duplicates.length,
      sizeKB:          cloneService.getSize(repoPath),
    }
    const healthScore = computeHealthScore(stats, dependencies, duplicates, issues)

    step('Building file tree', 86)
    const unusedSet = new Set(unusedFiles.map(f => f.path))
    const fileTree  = buildTree(repoPath, unusedSet, duplicateFiles)

    step('Generating organizer plan', 90)
    const organizerSuggestion = buildOrganizerSuggestion(languages, unusedFiles)

    step('Saving results', 95)
    const duration = Date.now() - start
    const repoId   = Math.abs(`${owner}/${repo}`.split('').reduce((a, c) => a + c.charCodeAt(0), 0))

    const saved = await Analysis.create({
      userId: user._id, repoId, repoName: repo, repoFullName: `${owner}/${repo}`,
      branch, analyzedAt: new Date(), duration, stats, languages, fileTree,
      unusedFiles, dependencies, duplicates, issues, healthScore,
      organizerSuggestion, aiSummary: null, suggestions: [],
    })

    jobResultMap.set(jobId, String(saved._id))
    step('Done', 100)
    jobQueue.update(jobId, { status:'done', progress:100 })
    console.log(`[Pipeline] Done in ${(duration/1000).toFixed(1)}s — id=${saved._id}`)

  } catch (e) {
    console.error('[Pipeline Error]', e.message)
    jobQueue.update(jobId, { status:'error', step: e.message || String(e) })
  } finally {
    if (repoPath) setTimeout(() => cloneService.cleanup(repoPath), 10000)
  }
}
