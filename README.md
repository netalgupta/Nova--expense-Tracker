<<<<<<< HEAD
# Nova — AI Expense Tracker 🌟

> Your money. Understood.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-cyan?logo=tailwindcss)](https://tailwindcss.com)
[![Gemini AI](https://img.shields.io/badge/Gemini-1.5%20Flash-violet?logo=google)](https://ai.google.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Features

- 🤖 **AI Auto-Categorization** — Gemini auto-categorizes every expense from the title
- 💡 **Smart Insights** — 3 unique AI-generated insights from your spending patterns
- 🔮 **Spend Predictions** — Predicts your end-of-month total from spending velocity
- 🧬 **Expense DNA** — Morphing SVG blob visualization of your spending habits
- 🎭 **Financial Personality** — AI determines your spending persona (e.g. "Impulsive Foodie")
- 🎤 **Voice Input** — Say "50 rupees coffee" and it fills the form automatically
- 📷 **Receipt Scanner** — Take a photo, Gemini Vision extracts all details
- 🔥 **Streak Tracking** — Daily logging streak with badges and fire animation
- 🎯 **Savings Goals** — Goal cards with circular progress rings and add-funds flow
- 🏅 **Achievement Badges** — Earn badges for milestones
- 📊 **Rich Charts** — Donut, bar charts, budget progress bars, daily spending
- 🔄 **What-If Simulator** — "If I reduce Food by 20%, I save ₹X/year"
- 📱 **Mobile-First PWA** — Installable, 430px max-width, bottom navigation
- 🌙 **Dark Mode Only** — Glassmorphism UI with violet/coral/cyan design system
- 🔐 **Row Level Security** — Supabase RLS ensures users only see their own data

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + Custom CSS |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Google OAuth) |
| AI | Google Gemini 1.5 Flash |
| Storage | Supabase Storage |
| Notifications | React Hot Toast |

---

## 🚀 Setup Instructions

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd "expense tracker"
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Supabase Setup

1. Create a [Supabase project](https://supabase.com)
2. Go to **SQL Editor** and run the entire contents of `supabase/schema.sql`
3. Go to **Authentication → Providers** and enable **Google OAuth**
4. Add `http://localhost:3000/auth/callback` to your Google OAuth redirect URIs
5. In Supabase Auth settings, add `http://localhost:3000/auth/callback` as a redirect URL

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add `http://localhost:3000/auth/callback` to authorized redirect URIs
4. Copy Client ID and Secret into Supabase Google OAuth provider settings

### 5. Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Create an API key and add it as `GEMINI_API_KEY`

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📡 API Documentation

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/profile` | Create/update user profile | ✅ |
| GET | `/api/expenses` | Get expenses (month/year/category filters) | ✅ |
| POST | `/api/expenses` | Create new expense | ✅ |
| PUT | `/api/expenses/[id]` | Update expense | ✅ |
| DELETE | `/api/expenses/[id]` | Delete expense | ✅ |
| GET | `/api/expenses/summary` | Monthly totals by category | ✅ |
| GET | `/api/budgets` | Get budgets for month | ✅ |
| POST | `/api/budgets` | Create/update budget | ✅ |
| GET | `/api/goals` | Get savings goals | ✅ |
| POST | `/api/goals` | Create new goal | ✅ |
| PUT | `/api/goals/[id]` | Update goal progress | ✅ |
| POST | `/api/ai/insights` | Generate 3 AI insights | ✅ |
| POST | `/api/ai/categorize` | Auto-categorize from title | ✅ |
| POST | `/api/ai/predict` | Predict month-end spend | ✅ |
| POST | `/api/ai/personality` | Generate financial personality | ✅ |
| POST | `/api/ai/whatif` | What-if savings simulation | ✅ |
| POST | `/api/ai/voice` | Parse voice transcript to expense | ✅ |
| POST | `/api/receipts/scan` | OCR receipt image via Gemini Vision | ✅ |
| GET | `/api/benchmarks` | Anonymous peer comparison | ❌ |
| GET | `/api/badges` | Get earned badges | ✅ |
| GET | `/api/streak` | Get streak data | ✅ |
| POST | `/api/streak` | Update streak | ✅ |

All responses: `{ success: boolean, data: any, error?: string }`

---

## 📸 Screenshots

> Coming soon — deploy the app and add screenshots here

---

## 🔗 Live Demo

> Coming soon

---

## 📁 Project Structure

```
expense tracker/
├── app/
│   ├── api/                  # All API routes
│   │   ├── ai/               # Gemini AI routes
│   │   ├── auth/             # Auth routes
│   │   ├── expenses/         # Expense CRUD
│   │   ├── goals/            # Goals CRUD
│   │   ├── budgets/          # Budgets CRUD
│   │   ├── badges/           # Badges
│   │   ├── streak/           # Streak tracking
│   │   ├── receipts/         # Receipt OCR
│   │   └── benchmarks/       # Peer benchmarks
│   ├── auth/callback/        # OAuth callback
│   ├── dashboard/            # Main dashboard
│   ├── analytics/            # Analytics & charts
│   ├── history/              # Expense history
│   ├── goals/                # Savings goals
│   ├── profile/              # User profile
│   ├── globals.css           # Global styles
│   └── layout.tsx            # Root layout
├── components/
│   ├── ui/                   # Reusable UI components
│   ├── dashboard/            # Dashboard-specific components
│   └── expenses/             # Expense components
├── lib/
│   ├── supabase/             # Supabase clients
│   ├── gemini/               # Gemini AI client & prompts
│   └── utils.ts              # Utility functions
├── types/
│   └── index.ts              # All TypeScript types
├── supabase/
│   └── schema.sql            # Database schema + RLS
└── public/
    └── manifest.json         # PWA manifest
```

---

## 🔒 Security

- All API routes validate Supabase JWT Bearer token
- Row Level Security (RLS) on all database tables
- Receipt images stored in private Supabase Storage with signed URLs
- Rate limiting on AI endpoints (10 req/min/user, in-memory)
- TypeScript strict mode — no `any` types

---

## 📄 License

MIT © 2024 Nova

---

<div align="center">
  Built with 💜 using Next.js, Supabase & Google Gemini
</div>
=======
# Nova--expense-Tracker
>>>>>>> 3b5435f8c250253d6200f35b02df9d17c374e446
