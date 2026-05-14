-- ══════════════════════════════════════════════════════════════
-- STRIPE PAYMENT SCHEMA — ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- 1. Ampliar estados del paciente
alter table public.patients drop constraint if exists patients_status_check;
alter table public.patients add constraint patients_status_check
  check (status in ('pendiente_pago','pagado_sin_asignar','activo','pausa','baja'));

-- 2. Cambiar default a 'pendiente_pago' (los nuevos pacientes empiezan ahí)
alter table public.patients alter column status set default 'pendiente_pago';

-- 3. Añadir campos para el onboarding (motivos, disponibilidad, etc.)
alter table public.patients add column if not exists motivos          text[];
alter table public.patients add column if not exists disponibilidad   text[];
alter table public.patients add column if not exists prev_psych       text;
alter table public.patients add column if not exists categoria        text
  check (categoria in ('individual','pareja','psiquiatra'));
alter table public.patients add column if not exists plan_elegido     text
  check (plan_elegido in ('sesion','mensual'));

-- 4. Tabla de compras (cada pago genera un registro)
create table if not exists public.compras (
  id                    uuid primary key default uuid_generate_v4(),
  patient_id            uuid not null references public.patients(id) on delete cascade,
  stripe_session_id     text unique,
  stripe_payment_intent text,
  categoria             text not null check (categoria in ('individual','pareja','psiquiatra')),
  plan                  text not null check (plan in ('sesion','mensual')),
  sesiones              integer not null,
  importe               numeric(8,2) not null,
  promo_aplicado        boolean default false,
  estado                text not null default 'pendiente'
                        check (estado in ('pendiente','pagada','fallida','reembolsada')),
  factura_emitida       boolean default false,
  num_factura_paciente  text,
  created_at            timestamptz default now(),
  paid_at               timestamptz
);
alter table public.compras enable row level security;

-- Política: paciente ve sus propias compras; admin todo
create policy "compras_own" on public.compras for select using (
  patient_id = auth.uid() or get_my_role() = 'admin'
);
create policy "compras_admin_all" on public.compras for all using (
  get_my_role() = 'admin'
);

grant select on public.compras to authenticated;
grant all on public.compras to service_role;

-- 5. Permitir insert/select de patients durante onboarding (signup)
grant insert, select, update on public.patients to authenticated;
