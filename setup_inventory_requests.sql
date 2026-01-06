-- Create a table for inventory requests (Restock & Issues)
create table if not exists public.inventory_requests (
  id uuid default gen_random_uuid() primary key,
  sku text references public.inventory(sku) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  request_type text not null check (request_type in ('restock', 'issue')),
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.inventory_requests enable row level security;

-- Policies
-- 1. Employees can view their own requests, Admins can view all
create policy "Users can view their own requests, Admins view all"
  on public.inventory_requests for select
  using (
    auth.uid() = user_id or 
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 2. Authenticated users can insert requests
create policy "Authenticated users can create requests"
  on public.inventory_requests for insert
  with check (auth.uid() = user_id);

-- 3. Only Admins can update status
create policy "Admins can update request status"
  on public.inventory_requests for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 4. Only Admins can delete requests
create policy "Admins can delete requests"
  on public.inventory_requests for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
