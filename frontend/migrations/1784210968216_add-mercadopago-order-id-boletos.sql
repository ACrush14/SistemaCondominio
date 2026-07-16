-- Up Migration

ALTER TABLE public.boletos_financeiro
  ADD COLUMN IF NOT EXISTS mercadopago_order_id VARCHAR(64);

-- Down Migration

ALTER TABLE public.boletos_financeiro
  DROP COLUMN IF EXISTS mercadopago_order_id;