-- Create groups table
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create expenses table
create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) not null,
  description text not null,
  amount numeric not null,
  payer_name text not null,
  split_among text[], -- Array of names who share this expense
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create group_members table
create table public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.groups enable row level security;
alter table public.expenses enable row level security;
alter table public.group_members enable row level security;

-- Create policies (since we have no auth, we'll allow public access for now, 
-- but in a real app we might want to restrict this based on the group ID in the URL or similar)
-- For this "no accounts" requirement, we will allow anonymous access.

create policy "Allow public access to groups"
on public.groups
for all
to anon
using (true)
with check (true);

create policy "Allow public access to expenses"
on public.expenses
for all
to anon
using (true)
with check (true);

create policy "Allow public access to group_members"
on public.group_members
for all
to anon
using (true)
with check (true);
