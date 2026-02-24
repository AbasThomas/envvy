# Getting Started

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 20+ |
| npm / bun | Latest |
| PostgreSQL | 15+ (or Supabase) |
| Git | Any |

---

## Installation

```bash
git clone <repo-url>
cd envii
npm install
```

---

## Environment Variables

Create a `.env` file at the project root. All variables below are required unless marked optional.

### Database

```env
# PostgreSQL connection string (URL-encode special chars in password, e.g. @ → %40)
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"

# Direct connection URL for Prisma migrations (bypasses connection pooling)
DIRECT_URL="postgresql://user:password@host:5432/dbname?schema=public"
```

> **Note:** If your database password contains `@`, encode it as `%40` in both URLs.

### Authentication

```env
# NextAuth.js secret — must be at least 32 characters
NEXTAUTH_SECRET="your-secret-at-least-32-characters-long"

# Full public URL of your app (no trailing slash)
NEXTAUTH_URL="http://localhost:3000"
```

### OAuth Providers (Optional)

```env
# Google OAuth — create at console.cloud.google.com
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"

# GitHub OAuth — create at github.com/settings/developers
GITHUB_CLIENT_ID="Iv1.xxx"
GITHUB_CLIENT_SECRET="xxx"
```

### Encryption

```env
# Optional — falls back to NEXTAUTH_SECRET if not set
ENCRYPTION_MASTER_KEY="your-32-char-encryption-master-key"
```

### Payment (Paystack)

```env
# Paystack API keys — get from dashboard.paystack.com
PAYSTACK_SECRET_KEY="sk_live_xxx"
PAYSTACK_PUBLIC_KEY="pk_live_xxx"

# Plan codes from Paystack recurring billing
PAYSTACK_PLAN_BASIC_CODE="PLN_xxx"
PAYSTACK_PLAN_PRO_CODE="PLN_xxx"
PAYSTACK_PLAN_TEAM_CODE="PLN_xxx"
```

### AI (Optional)

```env
# Groq LLM API — get from console.groq.com
GROQ_API_KEY="gsk_xxx"

# Model name (default: llama-3.3-70b-versatile)
GROQ_MODEL="llama-3.3-70b-versatile"
```

### Monitoring (Optional)

```env
SENTRY_ORG="your-sentry-org"
SENTRY_PROJECT="envii"
```

---

## Database Setup

### 1. Apply Migrations

```bash
npx prisma migrate deploy
```

This runs all pending SQL migrations in `prisma/migrations/`.

### 2. Generate Prisma Client

```bash
npx prisma generate
```

> **Windows note:** If you get an `EPERM` error on the `.node` file, stop the dev server first, run `prisma generate`, then restart.

### 3. Verify Schema (Optional)

```bash
npx prisma studio
```

Opens a browser GUI at `http://localhost:5555` to inspect your database.

---

## Running the App

### Development

```bash
npm run dev
```

The app starts at `http://localhost:3000` with Turbopack hot reload.

### Production Build

```bash
npm run build
npm run start
```

### Other Scripts

| Script | Description |
|--------|-------------|
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm run test` | Jest unit tests |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:e2e` | Cypress end-to-end tests |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |

---

## First-Time User Flow

1. Navigate to `http://localhost:3000/signup`
2. Fill in name, email, password, confirm password, and accept terms
3. Click **Create Account** — you are redirected to `/onboarding`
4. On the onboarding page, generate your **6-digit CLI PIN**
5. The PIN is bcryptjs-hashed and stored; you are redirected to `/dashboard`
6. Create your first repo from the dashboard
7. Set a **6-digit repo PIN** when prompted
8. Start committing env snapshots via the web editor or CLI

---

## Deployment (Vercel)

1. Push the repository to GitHub
2. Import to Vercel
3. Add all environment variables in the Vercel dashboard
4. Vercel auto-detects Next.js and builds

> Make sure `DATABASE_URL` uses a connection pooler URL (e.g. Supabase Pooler) and `DIRECT_URL` uses the direct connection for migrations.
