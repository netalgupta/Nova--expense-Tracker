-- Nova Expense Tracker — Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  financial_personality text default 'Analyzing...',
  personality_score jsonb default '{}',
  monthly_budget numeric default 10000,
  currency text default 'INR',
  streak_days integer default 0,
  last_logged_date date,
  created_at timestamptz default now()
);

-- Expenses table
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  amount numeric not null check (amount > 0),
  category text not null,
  subcategory text,
  mood text,
  note text,
  receipt_url text,
  is_recurring boolean default false,
  recurring_interval text,
  date date not null default current_date,
  created_at timestamptz default now()
);

-- Budgets table
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  category text not null,
  amount numeric not null check (amount > 0),
  month integer not null check (month between 1 and 12),
  year integer not null,
  created_at timestamptz default now(),
  unique(user_id, category, month, year)
);

-- Goals table
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  target_amount numeric not null check (target_amount > 0),
  saved_amount numeric default 0 check (saved_amount >= 0),
  deadline date,
  icon text default '🎯',
  color text default '#7C3AED',
  created_at timestamptz default now()
);

-- Badges table
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_type text not null,
  earned_at timestamptz default now(),
  unique(user_id, badge_type)
);

-- AI Insights table
create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  insight_text text not null,
  insight_type text,
  generated_at timestamptz default now()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

alter table public.profiles enable row level security;
alter table public.expenses enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;
alter table public.badges enable row level security;
alter table public.ai_insights enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Expenses policies
create policy "Users can view own expenses" on public.expenses
  for select using (auth.uid() = user_id);
create policy "Users can insert own expenses" on public.expenses
  for insert with check (auth.uid() = user_id);
create policy "Users can update own expenses" on public.expenses
  for update using (auth.uid() = user_id);
create policy "Users can delete own expenses" on public.expenses
  for delete using (auth.uid() = user_id);

-- Budgets policies
create policy "Users can view own budgets" on public.budgets
  for select using (auth.uid() = user_id);
create policy "Users can insert own budgets" on public.budgets
  for insert with check (auth.uid() = user_id);
create policy "Users can update own budgets" on public.budgets
  for update using (auth.uid() = user_id);
create policy "Users can delete own budgets" on public.budgets
  for delete using (auth.uid() = user_id);

-- Goals policies
create policy "Users can view own goals" on public.goals
  for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on public.goals
  for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on public.goals
  for update using (auth.uid() = user_id);
create policy "Users can delete own goals" on public.goals
  for delete using (auth.uid() = user_id);

-- Badges policies
create policy "Users can view own badges" on public.badges
  for select using (auth.uid() = user_id);
create policy "Users can insert own badges" on public.badges
  for insert with check (auth.uid() = user_id);

-- AI Insights policies
create policy "Users can view own insights" on public.ai_insights
  for select using (auth.uid() = user_id);
create policy "Users can insert own insights" on public.ai_insights
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own insights" on public.ai_insights
  for delete using (auth.uid() = user_id);

-- =====================
-- INDEXES
-- =====================
create index if not exists expenses_user_id_date_idx on public.expenses(user_id, date desc);
create index if not exists expenses_user_id_category_idx on public.expenses(user_id, category);
create index if not exists budgets_user_id_month_idx on public.budgets(user_id, month, year);
create index if not exists ai_insights_user_id_idx on public.ai_insights(user_id, generated_at desc);

-- =====================
-- TRIGGER: auto-create profile on signup
-- =====================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================
-- STORAGE BUCKET for receipts
-- =====================
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict do nothing;

create policy "Users can upload own receipts" on storage.objects
  for insert with check (
    bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Users can view own receipts" on storage.objects
  for select using (
    bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]
  );
