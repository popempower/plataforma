-- ══════════════════════════════════════════════════════════════
-- BILLING SCHEMA — ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- 1. external_sessions (sesiones presenciales o fuera plataforma)
create table if not exists public.external_sessions (
  id              uuid primary key default uuid_generate_v4(),
  psychologist_id uuid not null references public.psychologists(id) on delete cascade,
  patient_name    text not null,
  fecha           date not null,
  hora            time not null,
  duracion        integer not null default 50,
  motivo          text default 'Problema técnico',
  nota            text,
  billable        boolean not null default true,
  created_at      timestamptz default now()
);
alter table public.external_sessions enable row level security;
create policy "ext_ses_psico" on public.external_sessions for all using (
  psychologist_id = auth.uid() or get_my_role() = 'admin'
);

-- 2. invoice_items (líneas de factura)
create table if not exists public.invoice_items (
  id                  uuid primary key default uuid_generate_v4(),
  invoice_id          uuid not null references public.invoices(id) on delete cascade,
  patient_name        text not null,
  tipo                text not null check (tipo in ('realizada','cancelada_cobro','externa')),
  importe             numeric(10,2) not null,
  created_at          timestamptz default now()
);
alter table public.invoice_items enable row level security;
create policy "inv_items_own" on public.invoice_items for all using (
  invoice_id in (select id from public.invoices where psychologist_id = auth.uid())
  or get_my_role() = 'admin'
);

-- 3. Ampliar tabla invoices
alter table public.invoices add column if not exists confirmada_at  timestamptz;
alter table public.invoices add column if not exists paid_at        timestamptz;
alter table public.invoices add column if not exists fecha_pago     text;
alter table public.invoices add column if not exists notas          text;
alter table public.invoices add column if not exists tarifa         numeric(10,2) not null default 25;

-- Actualizar constraint estado para incluir 'confirmada'
alter table public.invoices drop constraint if exists invoices_estado_check;
alter table public.invoices add constraint invoices_estado_check
  check (estado in ('borrador','confirmada','pagada'));

-- Actualizar RLS de invoices (psicóloga ve las suyas; admin todo)
drop policy if exists "invoices_select" on public.invoices;
drop policy if exists "invoices_admin"  on public.invoices;
create policy "invoices_select" on public.invoices for select using (
  psychologist_id = auth.uid() or get_my_role() = 'admin'
);
create policy "invoices_insert" on public.invoices for insert with check (
  psychologist_id = auth.uid() or get_my_role() = 'admin'
);
create policy "invoices_update" on public.invoices for update using (
  psychologist_id = auth.uid() or get_my_role() = 'admin'
);
