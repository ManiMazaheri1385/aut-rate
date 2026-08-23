# استادسنجی امیرکبیر — AUT Professor Rating & Review System

A full-stack professor rating and review platform for the Faculty of Mathematics and
Computer Science at Amirkabir University of Technology (AUT).

**All user-facing text is Persian (Farsi) with a full RTL layout; all code, identifiers,
and comments are English.**

## Tech Stack

| Layer         | Technology                                        |
| ------------- | ------------------------------------------------- |
| Framework     | Next.js 14 (App Router) + TypeScript (strict)     |
| Database      | PostgreSQL + Prisma ORM                           |
| Auth          | NextAuth.js — email OTP restricted to `@aut.ac.ir`|
| Styling       | Tailwind CSS + shadcn/ui-style components, RTL    |
| State         | Zustand (client filters), TanStack React Query    |
| Forms         | React Hook Form + Zod (Persian error messages)    |
| Caching       | Upstash Redis (falls back to in-memory) + ISR     |
| Charts        | Recharts with Persian labels                      |

## Features

- **Public**: browse/search professors (`استادان`) & courses (`دروس`), Persian full-text
  search (`to_tsvector('persian', …)` with `ILIKE` fallback), autocomplete suggestions.
- **Students** (`@aut.ac.ir` + 9-digit student ID): submit/edit/delete reviews
  (30-day window), anonymous posting, like reviews (`این نظر مفید بود`), report reviews
  (`هرزنامه / توهین‌آمیز / اطلاعات نادرست / سایر`), comment threads, dashboard
  (`نظرات من`, `لایک‌های من`, `آمار فعالیت`, `اساتید مورد علاقه`).
- **Professors**: edit profile (`بیوگرافی`, `علایق پژوهشی`, photo upload),
  manage courses (`افزودن درس جدید`/`حذف درس`), reply to reviews (`پاسخ استاد`),
  analytics charts (`روند امتیازات`, `توزیع نظرات`).
- **Admins**: user management (roles/suspension), review moderation, course management,
  report resolution (`تایید`/`رد`), system audit log (`لاگ سیستم`).
- **Rating algorithm**: Bayesian average to prevent small-sample inflation; tooltip:
  «این امتیاز با الگوریتم تعدیل‌شده محاسبه شده است».
- Persian digits everywhere (`۴٫۲`), Jalali dates (`۱۴۰۴/۰۶/۰۱`) via `Intl`,
  Vazirmatn font, AUT crimson (#9E1B32) theme.

## Getting Started

### 1. Prerequisites

- Node.js 18.17+
- A running PostgreSQL instance

### 2. Install & configure

```bash
npm install
cp .env.example .env   # then edit DATABASE_URL / NEXTAUTH_SECRET
```

### 3. Database setup + seed (Persian sample data)

```bash
npm run db:push      # or: npm run db:migrate
npm run db:seed
```

Seeded accounts (log in via OTP; in dev the code is printed to the server console
**and** shown on screen):

| Role      | Email                 |
| --------- | --------------------- |
| Admin     | `admin@aut.ac.ir`     |
| Students  | `student1@aut.ac.ir` … `student3@aut.ac.ir` (with student IDs) |
| Professors| `ahmadi@aut.ac.ir`, `rezaei@aut.ac.ir`, `karimi@aut.ac.ir`, `mousavi@aut.ac.ir`, `sadeghi@aut.ac.ir`, `nouri@aut.ac.ir` |

### 4. Run

```bash
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build && npm start
```

### Email OTP in development

Without SMTP env vars, OTP codes are logged to the server console and returned as
`devCode` in development mode only. Configure `SMTP_*` variables for production
delivery (see `.env.example`).

## Scripts

| Script               | Purpose                       |
| -------------------- | ----------------------------- |
| `npm run dev`        | Development server            |
| `npm run build`      | Production build              |
| `npm run lint`       | ESLint                        |
| `npm run typecheck`  | TypeScript strict check       |
| `npm run format`     | Prettier                      |
| `npm run db:push`    | Push Prisma schema to DB      |
| `npm run db:migrate` | Create/apply migrations       |
| `npm run db:seed`    | Seed Persian sample data      |

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/           # OTP login (email step → code step)
│   ├── (dashboard)/            # guarded: dashboard + admin panel
│   ├── (public)/               # home, professors, courses (+ ISR)
│   └── api/                    # REST endpoints (Persian error messages)
├── components/
│   ├── ui/                     # shadcn-style primitives (English names)
│   ├── reviews/                # review form/card/report/comments
│   ├── professor/              # cards, filters, profile editor
│   ├── admin/                  # admin panel tabs
│   └── charts/                 # Recharts analytics
├── lib/
│   ├── auth/                   # NextAuth options, guards, mailer
│   ├── services/               # query layer shared by pages & APIs
│   ├── validations/            # Zod schemas (Persian messages)
│   ├── cache.ts                # Upstash Redis / memory fallback
│   ├── i18n.ts                 # typed t() over locales/fa/common.json
│   ├── constants.ts            # departments, sort options, Bayesian priors
│   └── utils.ts                # Persian digits, Jalali dates, cn()
├── locales/fa/common.json      # ALL UI strings (centralized)
└── types/                      # DTOs + next-auth type augmentation
```

## API Overview

| Endpoint                              | Methods           | Notes                                  |
| ------------------------------------- | ----------------- | -------------------------------------- |
| `/api/auth/otp`                       | POST              | Issue 6-digit code (@aut.ac.ir only)   |
| `/api/auth/[...nextauth]`             | GET/POST          | Credentials provider `otp`             |
| `/api/me`                             | GET/PATCH         | Session user / set studentId           |
| `/api/professors`                     | GET               | Filters: q, department, sort, page     |
| `/api/professors/suggest`             | GET               | Autocomplete professors + courses      |
| `/api/professors/[id]`                | GET/PATCH         | Detail / self-profile update           |
| `/api/courses`                        | GET/POST          | List / create (professor or admin)     |
| `/api/professor/courses[/[id]]`       | GET/POST/DELETE   | Own courses management                 |
| `/api/professor/analytics`            | GET               | Trend + distribution                   |
| `/api/reviews`                        | GET/POST          | Student-only creation, duplicate guard |
| `/api/reviews/[id]`                   | PATCH/DELETE      | Owner within 30 days / admin           |
| `/api/reviews/[id]/like`              | POST              | Toggle like                            |
| `/api/reviews/[id]/reply`             | POST              | Professor official reply               |
| `/api/reviews/[id]/report`            | POST              | One report per user per review         |
| `/api/reviews/[id]/comments`          | GET/POST          | Comment thread                         |
| `/api/admin/data?section=…`           | GET               | users/reviews/reports/courses/logs     |
| `/api/admin/users/[id]`               | PATCH             | Role change / suspension               |
| `/api/admin/reports/[id]`             | PATCH             | resolve (deletes review) / reject      |
| `/api/upload`                         | POST              | Profile photo ≤2MB (JPEG/PNG/WebP)     |

All errors return `{ "success": false, "message": "<پیام فارسی>" }`.

## Production Checklist

- Set strong `NEXTAUTH_SECRET`, real SMTP credentials, and Upstash Redis keys.
- Run `prisma migrate deploy` instead of `db:push`.
- Serve uploaded files from object storage (the `/api/upload` handler writes to
  `public/uploads`, fine for single-node deployments).
