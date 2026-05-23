# RepoMedic: Intelligent Repository Health Platform

RepoMedic is an AI-powered platform designed to diagnose and improve the health of GitHub repositories. It provides comprehensive code quality analysis, intelligent insights, and actionable health metrics to help developers understand and optimize their codebase.

## 🎯 Project Overview

RepoMedic automates repository analysis by combining static code analysis with AI-powered explanations. Users connect their GitHub account, select a repository, and receive detailed health reports including:

- **Code Quality Metrics**: Weighted health scores across 5 dimensions
- **Unused File Detection**: Identifies files that may be obsolete or forgotten
- **Duplicate Code Scanning**: Detects repeated code patterns and redundancy
- **Dependency Audits**: Analyzes project dependencies and their health
- **AI-Powered Explanations**: GPT-4o-generated insights explaining codebase structure and issues

## 🏗️ Core Architecture

The platform consists of three main components:

### Frontend (Next.js React Application)
- **Dashboard**: Central hub for users to view analysis history and repository metrics
- **Analysis Results**: Detailed breakdown of repository health with visualizations
- **Repository Selection**: Browse and select GitHub repositories for analysis
- **Health Score Visualization**: Charts and graphs displaying code quality metrics

### Backend (Next.js API Routes)
- **Analysis Pipeline**: Orchestrates the complete repository analysis workflow
- **Job Queue**: Manages asynchronous analysis jobs with progress tracking
- **GitHub Integration**: Clones repositories and fetches metadata via GitHub API
- **Authentication**: Secure GitHub OAuth integration via NextAuth

### AI & Analysis Engine
- **Repository Cloning**: Fetches repositories from GitHub and creates local copies
- **Static Analysis**: Scans files for:
  - Language detection and distribution
  - Dependency analysis
  - Code complexity metrics
  - Duplicate code detection
  - Unused files identification
- **AI Analysis**: Uses OpenAI API (GPT-4o) to generate natural language explanations of repository structure and issues

## 💾 Data Model

The platform uses MongoDB to store:

- **Users**: GitHub-authenticated user profiles with access tokens
- **Jobs**: Analysis job records tracking status, progress, and results
- **Analysis Results**: Detailed findings from each repository scan including:
  - Health scores and component breakdowns
  - File metrics and language distribution
  - Identified issues (duplicates, unused files, etc.)
  - AI-generated insights

## 🔑 Key Features

| Feature | Description |
|---------|-------------|
| **GitHub OAuth** | Secure login and automatic access to all user repositories |
| **Repository Analysis** | Comprehensive scanning of repository structure and content |
| **Background Processing** | Asynchronous analysis jobs with real-time progress tracking |
| **Health Scoring** | Multi-dimensional scoring system evaluating code quality |
| **AI Insights** | Natural language explanations powered by GPT-4o |
| **Analysis History** | Track and compare analysis results over time |
| **File Detection** | Identify unused, duplicate, and problematic files |
| **Dependency Audit** | Analyze project dependencies and their health |

## 📊 Analysis Workflow

1. **User Authentication**: GitHub OAuth login connects user account
2. **Repository Selection**: User selects a repository from their GitHub account
3. **Job Creation**: Analysis job is queued with initial status "pending"
4. **Repository Cloning**: Repository files are fetched from GitHub API
5. **Static Analysis**: 
   - File structure analysis
   - Language detection and distribution
   - Dependency scanning
   - Duplicate code detection
   - Unused file identification
6. **AI Analysis**: Repository structure and issues sent to GPT-4o for explanation
7. **Results Storage**: Analysis findings and AI insights saved to database
8. **Results Display**: User views comprehensive health report with visualizations

## 🛠️ Technology Stack

### Frontend & Full-Stack
- **Next.js 16.2** - React framework with API routes
- **React 19.2** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization and charts

### Backend & Services
- **NextAuth** - Authentication and session management
- **MongoDB & Mongoose** - Database and ORM
- **OpenAI API** - AI-powered code analysis
- **GitHub API** - Repository data fetching

### Utilities & Tools
- **Axios** - HTTP client
- **Simple-git** - Git operations
- **Rimraf** - File cleanup
- **React Hot Toast** - User notifications
- **Lucide React** - Icon library
- **UUID** - Unique identifier generation

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # Backend API routes
│   │   ├── analyze/      # Repository analysis endpoints
│   │   ├── auth/         # NextAuth configuration
│   │   └── job/          # Job status endpoints
│   ├── dashboard/        # Dashboard and analysis pages
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/           # React UI components
│   ├── FileTree.tsx      # Repository file tree viewer
│   ├── Navbar.tsx        # Navigation component
│   ├── RepoCard.tsx      # Repository display card
│   └── ScoreChart.tsx    # Health score visualization
├── lib/
│   ├── analyzer.ts       # Core analysis pipeline
│   ├── auth.ts           # Authentication configuration
│   ├── db.ts             # Database connection
│   └── models/           # Data models (User, Job, Analysis)
└── globals.css           # Global styles
```

## 🔐 Security & Permissions

- **Read-Only Access**: RepoMedic only reads repository metadata—never writes to user code
- **GitHub OAuth**: Secure authentication without storing passwords
- **Access Tokens**: Securely stored for authorized API access
- **Rate Limiting**: Respects GitHub API rate limits
- **Temporary Storage**: Cloned repositories stored in temporary directories and cleaned up after analysis

## 🎨 Analysis Dimensions

The health scoring system evaluates repositories across five key dimensions:

1. **Code Quality** - Complexity, duplication, and code patterns
2. **File Organization** - Structure, unused files, and dependencies
3. **Dependency Health** - Current versions and security concerns
4. **Documentation** - Code comments and readme quality
5. **Maintainability** - Overall maintainability metrics

## 🚀 Capabilities

- Analyze repositories of any size
- Support for multiple programming languages (Python, JavaScript, TypeScript, Java, C++, Go, Rust, etc.)
- Parallel file processing for performance
- Progress tracking during long-running analyses
- Persistent analysis history for comparison
- Export-ready formatted results
- AI-generated contextual explanations for non-technical stakeholders

## 📝 Notes

- Temporary repositories are created in `/temp_repos/` during analysis
- Analysis results are asynchronous; users receive real-time job status updates
- GitHub API authentication required for accessing private repositories
- OpenAI API credits required for AI-powered code explanations
