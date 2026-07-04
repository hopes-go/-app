insert into storage.buckets (id, name, public)
values
  ('shopping-photos', 'shopping-photos', false),
  ('receipts', 'receipts', false),
  ('dropoff-photos', 'dropoff-photos', false)
on conflict (id) do nothing;
