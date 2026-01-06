-- Create leaves table if it doesn't exist
create table if not exists public.leaves (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  employee_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text
);

-- Enable RLS
alter table public.leaves enable row level security;

-- Policy: Employees can view their own leaves
create policy "Users can view their own leaves"
  on public.leaves for select
  using (auth.uid() = employee_id);

-- Policy: Employees can insert their own leaves
create policy "Users can insert their own leaves"
  on public.leaves for insert
  with check (auth.uid() = employee_id);

-- Policy: Admins can view all leaves
create policy "Admins can view all leaves"
  on public.leaves for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Policy: Admins can update leaves (approve/reject)
create policy "Admins can update leaves"
  on public.leaves for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
