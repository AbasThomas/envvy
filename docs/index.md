# Envii Documentation

**Envii** is the GitHub for `.env` files — a secure, collaborative platform where developers and teams backup, version, fork, star, and share environment variables like code repositories. Use a simple CLI for daily workflows, explore trending templates, and manage everything via a modern web dashboard. Zero-knowledge encryption keeps secrets safe.

---

## Table of Contents

1. [Getting Started](./getting-started.md)
   - Prerequisites
   - Installation
   - Environment Variables
   - Database Setup
   - Running the App

2. [Architecture](./architecture.md)
   - Tech Stack
   - Project Structure
   - Directory Map

3. [Authentication](./authentication.md)
   - Login Methods
   - Session Strategy
   - Route Protection
   - OAuth Setup

4. [API Reference](./api-reference.md)
   - Auth APIs
   - Repository APIs
   - Environment APIs
   - CLI APIs
   - Share & Collaboration APIs
   - Social APIs
   - Billing APIs
   - Notification APIs
   - Integration APIs
   - Analytics APIs
   - AI APIs
   - Template APIs

5. [Database Schema](./database-schema.md)
   - Models
   - Enums
   - Relationships
   - Indexes

6. [CLI Guide](./cli-guide.md)
   - Installation
   - Authentication
   - Repo Commands
   - Backup & Restore
   - PIN Management

7. [Security Model](./security.md)
   - Encryption
   - PIN System
   - Role-Based Access
   - Rate Limiting
   - Audit Logging
   - Security Headers

8. [Billing & Plans](./billing.md)
   - Plan Tiers
   - Features by Plan
   - Payment Flow
   - Paystack Integration
   - Webhooks

9. [Features Guide](./features.md)
   - Repository Management
   - Environment Versioning
   - Diff & Rollback
   - Sharing & Collaboration
   - Explore & Trending
   - Templates Marketplace
   - AI Suggestions
   - CI/CD Integration
   - Slack Integration

---

## Quick Overview

| Feature | Description |
|---------|-------------|
| **Versioned .env files** | Every commit creates an immutable, encrypted snapshot |
| **CLI-first** | `envii backup`, `envii restore`, `envii login` |
| **Zero-knowledge encryption** | AES-256-GCM client or server-side |
| **Role-based sharing** | VIEWER / CONTRIB / EDITOR roles with PIN protection |
| **Fork & Star** | Discover and fork public env templates |
| **Billing** | Paystack-powered subscriptions (NGN) |
| **AI suggestions** | Groq LLM checks for missing keys and weak secrets |

---

## Support

- Report issues: GitHub Issues
- Stack: Next.js 15, PostgreSQL, Prisma, NextAuth.js v5, Paystack, Groq
