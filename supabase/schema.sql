create extension if not exists "pgcrypto";

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  name text not null,
  phone text,
  email text unique,
  default_pickup_address text,
  default_delivery_address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  name text not null,
  phone text,
  email text unique,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id integer primary key,
  name text not null,
  category text not null,
  price numeric(10, 2) not null,
  active boolean not null default true
);

create table if not exists public.discounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  type text not null check (type in ('percent', 'fixed')),
  amount numeric(10, 2) not null,
  status text not null default 'Active',
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id),
  customer_name text,
  customer_phone text,
  customer_email text,
  pickup_address text,
  delivery_address text,
  customer_notes text,
  status text not null default 'pending_checkout',
  service_subtotal numeric(10, 2) not null default 0,
  discount_code text,
  discount_amount numeric(10, 2) not null default 0,
  tip_amount numeric(10, 2) not null default 0,
  shopping_estimate numeric(10, 2) not null default 0,
  shopping_cushion numeric(10, 2) not null default 0,
  shopping_hold_total numeric(10, 2) not null default 0,
  total_authorized numeric(10, 2) not null default 0,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  assigned_driver_id uuid references public.drivers(id),
  accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  service_id integer references public.services(id),
  service_name text not null,
  category text not null,
  quantity integer not null default 1,
  unit_price numeric(10, 2) not null,
  line_total numeric(10, 2) not null
);

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_name text not null,
  estimated_price numeric(10, 2)
);

create table if not exists public.driver_availability (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.drivers(id),
  driver_name text not null,
  days text not null,
  start_time time,
  end_time time,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.driver_pay_records (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.drivers(id),
  order_id uuid references public.orders(id),
  service_fee numeric(10, 2) not null default 0,
  driver_share numeric(10, 2) not null default 0,
  tips numeric(10, 2) not null default 0,
  status text not null default 'payroll_pending',
  created_at timestamptz not null default now()
);

create table if not exists public.mileage_logs (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.drivers(id),
  order_id uuid references public.orders(id),
  miles numeric(10, 2) not null default 0,
  pickup_address text,
  delivery_address text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  driver_id uuid references public.drivers(id),
  proof_type text not null check (proof_type in ('receipt', 'dropoff', 'handoff_code')),
  file_path text,
  notes text,
  created_at timestamptz not null default now()
);

insert into public.services (id, name, category, price) values
  (1, 'Pickup & Delivery', 'Main Services', 10),
  (2, 'Shop & Deliver', 'Main Services', 15),
  (3, 'Custom Request', 'Main Services', 20),
  (4, 'Holiday & After-Hours Service', 'Add-ons', 10),
  (5, 'Additional Stop', 'Add-ons', 5),
  (6, 'Service Area Tier 1', 'Service Areas', 10),
  (7, 'Service Area Tier 2', 'Service Areas', 15),
  (8, 'Service Area Tier 3', 'Service Areas', 20),
  (9, 'Service Area Tier 4', 'Service Areas', 30)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  price = excluded.price,
  active = true;

insert into public.discounts (code, label, type, amount, status) values
  ('NIGHT50', 'Tonight-only flash sale', 'percent', 50, 'Active'),
  ('NEW10', 'New customer', 'fixed', 10, 'Active'),
  ('BUSYDAY', 'Busy day promo', 'percent', 10, 'Draft'),
  ('CARE5', 'Care credit', 'fixed', 5, 'Active')
on conflict (code) do update set
  label = excluded.label,
  type = excluded.type,
  amount = excluded.amount,
  status = excluded.status;

alter table public.customers enable row level security;
alter table public.drivers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.shopping_items enable row level security;
alter table public.driver_availability enable row level security;
alter table public.driver_pay_records enable row level security;
alter table public.mileage_logs enable row level security;
alter table public.order_proofs enable row level security;

-- The server uses SUPABASE_SERVICE_ROLE_KEY for trusted writes.
-- Add user-specific RLS policies after real Supabase Auth roles are finalized.
