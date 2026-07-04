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
