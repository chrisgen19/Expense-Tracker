# Money Tracker (React + Supabase)

A minimalist money tracker with auth, spouse sharing, daily dividers, persistent privacy masking, and a month-to-date (MTD) graph — all powered by React, Supabase, and Recharts.

## ✨ Features

- **Email auth** (Supabase)
- **Expenses & Income tracking** with accounts, categories, notes, timestamps
- **Spouse sharing**: automatically combines both partners' data when connected
- **Daily grouping** on both tabs with sticky, collapsible headers:
  - **In** (income that day), **Spent** (expenses that day)
  - **Start** (balance after today's income, before spending)
  - **Net** (end-of-day balance)
- **Privacy toggle** for Net that persists across refresh/sign-in (per user)
- **MTD chart** (Net, cumulative Income, cumulative Expenses) with privacy-aware masking
- **Modern UI**: Tailwind classes, lucide icons, responsive layout

## 🧱 Tech Stack

- **Frontend**: React + Vite
- **Data/Backend**: Supabase (Auth + Postgres + RLS)
- **Charts**: Recharts
- **Icons**: lucide-react
- **Styling**: Utility classes (Tailwind-style)

## 📁 Project Structure

```
src/
  App.jsx
  lib/
    supabaseClient.js
  components/
    Auth.jsx
  features/
    money/
      MoneyApp.jsx
```

## 🚀 Getting Started

### 1) Prerequisites

- Node.js 18+ and npm
- A Supabase project (free tier is fine)

### 2) Install dependencies

```bash
npm install
# if not already in the project
npm i recharts lucide-react
```

### 3) Environment variables

Create `.env.local` at the repo root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Your `src/lib/supabaseClient.js` should use these:

```javascript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 4) Database schema (Supabase SQL)

Run this in Supabase SQL editor:

```sql
-- Needed for gen_random_uuid()
create extension if not exists pgcrypto;

-- Tables
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  amount numeric not null,
  account text not null,
  category text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists expenses_created_at_idx on public.expenses (created_at desc);
create index if not exists expenses_user_id_idx on public.expenses (user_id);

create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  amount numeric not null,
  account text not null,
  category text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists incomes_created_at_idx on public.incomes (created_at desc);
create index if not exists incomes_user_id_idx on public.incomes (user_id);

create table if not exists public.spouse_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  spouse_email text not null,
  spouse_user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

create unique index if not exists unique_user_spouse on public.spouse_connections (user_id);

-- Row Level Security
alter table public.expenses enable row level security;
alter table public.incomes enable row level security;
alter table public.spouse_connections enable row level security;

-- RLS policies (mirrors the app's expectations)
-- Expenses
create policy if not exists "expenses_read_own"
on public.expenses for select
using (user_id = auth.uid());

create policy if not exists "expenses_read_own_or_spouse"
on public.expenses for select
using (
  user_id = auth.uid()
  or user_id in (
    select spouse_connections.spouse_user_id
    from spouse_connections
    where spouse_connections.user_id = auth.uid()
  )
  or user_id in (
    select spouse_connections.user_id
    from spouse_connections
    where spouse_connections.spouse_user_id = auth.uid()
  )
);

create policy if not exists "expenses_insert_own"
on public.expenses for insert
with check (user_id = auth.uid());

create policy if not exists "expenses_update_own"
on public.expenses for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy if not exists "expenses_delete_own"
on public.expenses for delete
using (user_id = auth.uid());

-- Incomes
create policy if not exists "incomes_read_own"
on public.incomes for select
using (user_id = auth.uid());

create policy if not exists "incomes_read_own_or_spouse"
on public.incomes for select
using (
  user_id = auth.uid()
  or user_id in (
    select spouse_connections.spouse_user_id
    from spouse_connections
    where spouse_connections.user_id = auth.uid()
  )
  or user_id in (
    select spouse_connections.user_id
    from spouse_connections
    where spouse_connections.spouse_user_id = auth.uid()
  )
);

create policy if not exists "incomes_insert_own"
on public.incomes for insert
with check (user_id = auth.uid());

create policy if not exists "incomes_update_own"
on public.incomes for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy if not exists "incomes_delete_own"
on public.incomes for delete
using (user_id = auth.uid());

-- Spouse connections
create policy if not exists "spouse_select_own"
on public.spouse_connections for select
using (user_id = auth.uid());

create policy if not exists "spouse_insert_own"
on public.spouse_connections for insert
with check (user_id = auth.uid());

create policy if not exists "spouse_update_own"
on public.spouse_connections for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy if not exists "spouse_delete_own"
on public.spouse_connections for delete
using (user_id = auth.uid());
```

> 💡 **Optional**: If you want `spouse_user_id` to auto-fill based on `spouse_email` when a spouse later signs up, add a trigger to resolve the user by email. (Not required for this app to work; the UI already handles "active account found" when present.)

### 5) Run the app

```bash
npm run dev
```

Visit the printed local URL (typically `http://localhost:5173`).

## 🧭 Usage Notes

- **Auth**: Sign in with email (Supabase handles the flow in `Auth.jsx`).
- **Privacy toggle**: Click the Net card to mask/unmask. The choice persists per user (localStorage, key: `moneyapp:net-privacy:<userId>`).
- **Spouse**:
  - Open Spouse in the header, enter spouse email, and save.
  - Once both accounts exist, the app will combine both users' data automatically (RLS policies allow reading spouse's rows).
- **Daily headers**:
  - **In**: income on that day
  - **Spent**: expenses on that day
  - **Start**: balance at start of the day after adding today's income
  - **Net**: end-of-day balance (Start − Spent)
  - Click the chevron to collapse/expand a day.
- **MTD chart**: Displays cumulative income, cumulative expenses, and net for the month you're viewing. Respects privacy masking.

## 🧮 How balances are calculated

For each day (in local time):

```
startBalance = cumulativeIncomeToDate - cumulativeExpensesToDate
endBalance   = startBalance - spentToday
```

This means a day with no income but ₱210 spent will reduce the running balance by ₱210.

## 🌐 Timezone Caveat

- The UI groups by local Date (e.g., Asia/Manila).
- Month queries use timestamptz bounds. Around midnight, records near boundaries might appear off by a day.
- If this matters for you, convert month start/end to Manila time before querying (compute Manila "start of month" and "end of month", then convert to UTC for the SQL filter).

## 🧩 Customization

- **Mask format**: Change `maskCurrencyString` or switch `dropDecimals` true/false.
- **Categories**: Update the `EXPENSE_CATEGORIES` and `INCOME_CATEGORIES` arrays.
- **Icons**: Tweak the `expenseIcons` / `incomeIcons` maps.
- **Chart**: Add bars for per-day spend/income or export CSV — easy extension of the existing `mtdSeries`.

## 🧪 Scripts

```bash
npm run dev       # start dev server
npm run build     # production build
npm run preview   # preview production build locally
```

## 🔒 Security

- All data access is protected by Supabase RLS.
- The privacy toggle is stored only in the browser (per device).

## 📦 Deployment

Works great on Vercel / Netlify / Cloudflare Pages.

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your host's env settings.

## 🗺️ Roadmap (ideas)

- Cross-device preferences via a `user_preferences` table (mirror to localStorage)
- CSV export for MTD series and daily groups
- Manila-aware month filters (server-side)
- Budgeting goals & alerts
- Search/filters and category analytics
- Virtualized lists for very large months

## 🧑‍💻 Contributing

PRs welcome! For larger changes, open an issue to discuss approach and scope.

## 📜 License

MIT — or replace with your preferred license.