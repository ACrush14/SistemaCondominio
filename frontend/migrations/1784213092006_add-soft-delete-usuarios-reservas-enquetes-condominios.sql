-- Up Migration

-- usuarios: reaproveita a coluna "status" que já existia (ATIVO/INATIVO, default ATIVO)
-- mas nunca era usada por nenhuma rota — DELETE fazia um hard delete de verdade.
-- Adiciona só as colunas de auditoria (quando e quem desativou).
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS desativado_em TIMESTAMPTZ;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS desativado_por INTEGER REFERENCES public.usuarios(id);

-- E-mail só precisa ser único entre contas ATIVAS — permite recriar uma conta com o
-- mesmo e-mail depois que a anterior foi desativada, sem esbarrar no registro antigo.
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_email_key;
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_ativo_key ON public.usuarios (email) WHERE status = 'ATIVO';

-- reservas: reaproveita o status "CANCELADA" que a função verificarConflitoReserva já
-- previa mas nenhuma rota realmente gravava (a rota de exclusão fazia hard delete).
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS cancelado_em TIMESTAMPTZ;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS cancelado_por INTEGER REFERENCES public.usuarios(id);

-- enquetes: não tinha nenhum status equivalente a "excluída" (ATIVA/ENCERRADA é outra
-- dimensão), então precisa de uma coluna nova mesmo.
ALTER TABLE public.enquetes ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMPTZ;
ALTER TABLE public.enquetes ADD COLUMN IF NOT EXISTS deletado_por INTEGER REFERENCES public.usuarios(id);

-- condominios: idem, mais o mesmo ajuste de unicidade parcial que o e-mail (permite
-- recriar um condomínio com o mesmo slug depois que o antigo foi "excluído").
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMPTZ;
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS deletado_por INTEGER REFERENCES public.usuarios(id);
ALTER TABLE public.condominios DROP CONSTRAINT IF EXISTS condominios_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS condominios_slug_ativo_key ON public.condominios (slug) WHERE deletado_em IS NULL;

-- Down Migration

DROP INDEX IF EXISTS public.condominios_slug_ativo_key;
ALTER TABLE public.condominios ADD CONSTRAINT condominios_slug_key UNIQUE (slug);
ALTER TABLE public.condominios DROP COLUMN IF EXISTS deletado_por;
ALTER TABLE public.condominios DROP COLUMN IF EXISTS deletado_em;

ALTER TABLE public.enquetes DROP COLUMN IF EXISTS deletado_por;
ALTER TABLE public.enquetes DROP COLUMN IF EXISTS deletado_em;

ALTER TABLE public.reservas DROP COLUMN IF EXISTS cancelado_por;
ALTER TABLE public.reservas DROP COLUMN IF EXISTS cancelado_em;

DROP INDEX IF EXISTS public.usuarios_email_ativo_key;
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_email_key UNIQUE (email);
ALTER TABLE public.usuarios DROP COLUMN IF EXISTS desativado_por;
ALTER TABLE public.usuarios DROP COLUMN IF EXISTS desativado_em;