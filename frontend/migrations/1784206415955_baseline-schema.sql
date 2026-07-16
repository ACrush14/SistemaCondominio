-- Baseline schema — snapshot do schema real do Postgres (Neon) em producao, tirado via
-- `pg_dump --schema-only` em 2026-07-16. Ate aqui, todo `ALTER TABLE`/`CREATE TABLE` do
-- projeto era rodado manualmente via psql (ou por `garantirTabelaX()` idempotentes
-- espalhados em `lib/store/*.ts`), documentado só em prosa no CLAUDE.md — sem histórico
-- versionado. Esta migracao marca o ponto de partida: aplicada com `--fake` (nunca
-- rodada de verdade contra o banco, só registrada como "já aplicada", já que as tabelas
-- já existiam). Toda mudança de schema daqui pra frente deve virar uma migração nova
-- (`npm run migrate:create -- nome-da-mudanca`), não mais um comando avulso.

-- Up Migration

--
-- Name: alertas_panico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alertas_panico (
    id integer NOT NULL,
    porteiro_nome character varying(150) NOT NULL,
    tipo_emergencia character varying(150) NOT NULL,
    localizacao character varying(150) DEFAULT 'Portaria Principal'::character varying NOT NULL,
    observacao text DEFAULT ''::text,
    status character varying(50) DEFAULT 'ATIVO'::character varying NOT NULL,
    resolvido_por character varying(150) DEFAULT NULL::character varying,
    resolvido_em timestamp with time zone,
    criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    condominio_id integer DEFAULT 1 NOT NULL
);


--
-- Name: alertas_panico_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alertas_panico_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alertas_panico_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alertas_panico_id_seq OWNED BY public.alertas_panico.id;


--
-- Name: boletos_financeiro; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.boletos_financeiro (
    id integer NOT NULL,
    unidade character varying(100) NOT NULL,
    competencia character varying(50) NOT NULL,
    valor_num numeric(10,2) NOT NULL,
    data_vencimento date NOT NULL,
    status character varying(50) DEFAULT 'PENDENTE'::character varying NOT NULL,
    codigo_barras character varying(150) NOT NULL,
    pix_copia_cola text NOT NULL,
    detalhamento jsonb DEFAULT '[]'::jsonb NOT NULL,
    criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    condominio_id integer DEFAULT 1 NOT NULL
);


--
-- Name: boletos_financeiro_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.boletos_financeiro_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: boletos_financeiro_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.boletos_financeiro_id_seq OWNED BY public.boletos_financeiro.id;


--
-- Name: codigos_recuperacao_senha; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codigos_recuperacao_senha (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    codigo character varying(6) NOT NULL,
    expira_em timestamp with time zone NOT NULL,
    usado boolean DEFAULT false NOT NULL,
    criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: codigos_recuperacao_senha_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.codigos_recuperacao_senha_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: codigos_recuperacao_senha_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.codigos_recuperacao_senha_id_seq OWNED BY public.codigos_recuperacao_senha.id;


--
-- Name: comunicados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comunicados (
    id integer NOT NULL,
    titulo character varying(150) NOT NULL,
    conteudo text,
    publico character varying(50) DEFAULT 'Todos os moradores'::character varying NOT NULL,
    visualizacoes integer DEFAULT 0 NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    condominio_id integer DEFAULT 1 NOT NULL
);


--
-- Name: comunicados_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comunicados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comunicados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comunicados_id_seq OWNED BY public.comunicados.id;


--
-- Name: condominios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.condominios (
    id integer NOT NULL,
    nome character varying(150) NOT NULL,
    slug character varying(100) NOT NULL,
    cnpj character varying(30) DEFAULT ''::character varying,
    endereco character varying(200) DEFAULT ''::character varying,
    total_unidades integer DEFAULT 100,
    plano character varying(50) DEFAULT 'EXECUTIVO_SAAS'::character varying,
    criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: condominios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.condominios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: condominios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.condominios_id_seq OWNED BY public.condominios.id;


--
-- Name: encomendas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.encomendas (
    id integer NOT NULL,
    unidade character varying(50) NOT NULL,
    morador character varying(100),
    codigo character varying(50),
    remetente character varying(100),
    status character varying(30) DEFAULT 'AGUARDANDO_AVISO'::character varying NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    condominio_id integer DEFAULT 1 NOT NULL
);


--
-- Name: encomendas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.encomendas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: encomendas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.encomendas_id_seq OWNED BY public.encomendas.id;


--
-- Name: enquete_votos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enquete_votos (
    id integer NOT NULL,
    enquete_id integer,
    unidade character varying(100) NOT NULL,
    opcao_index integer NOT NULL,
    votado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: enquete_votos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.enquete_votos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: enquete_votos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.enquete_votos_id_seq OWNED BY public.enquete_votos.id;


--
-- Name: enquetes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enquetes (
    id integer NOT NULL,
    titulo character varying(255) NOT NULL,
    descricao text,
    opcoes jsonb NOT NULL,
    status character varying(50) DEFAULT 'ATIVA'::character varying,
    criada_por character varying(100) DEFAULT 'Síndico'::character varying,
    criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    condominio_id integer DEFAULT 1 NOT NULL
);


--
-- Name: enquetes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.enquetes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: enquetes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.enquetes_id_seq OWNED BY public.enquetes.id;


--
-- Name: ia_uso_diario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ia_uso_diario (
    usuario_id integer NOT NULL,
    dia date DEFAULT CURRENT_DATE NOT NULL,
    contagem integer DEFAULT 0 NOT NULL
);


--
-- Name: liberacoes_visita; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.liberacoes_visita (
    id integer NOT NULL,
    codigo character varying(12) NOT NULL,
    nome_visitante character varying(100),
    unidade character varying(50) NOT NULL,
    morador character varying(100),
    status character varying(20) DEFAULT 'PENDENTE'::character varying NOT NULL,
    expira_em timestamp with time zone NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    condominio_id integer DEFAULT 1 NOT NULL
);


--
-- Name: liberacoes_visita_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.liberacoes_visita_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: liberacoes_visita_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.liberacoes_visita_id_seq OWNED BY public.liberacoes_visita.id;


--
-- Name: livro_turno_portaria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.livro_turno_portaria (
    id integer NOT NULL,
    porteiro_nome character varying(150) NOT NULL,
    turno character varying(100) NOT NULL,
    assunto character varying(150) NOT NULL,
    prioridade character varying(50) DEFAULT 'NORMAL'::character varying NOT NULL,
    descricao text NOT NULL,
    lido_por jsonb DEFAULT '[]'::jsonb,
    criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    condominio_id integer DEFAULT 1 NOT NULL
);


--
-- Name: livro_turno_portaria_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.livro_turno_portaria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: livro_turno_portaria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.livro_turno_portaria_id_seq OWNED BY public.livro_turno_portaria.id;


--
-- Name: notificacoes_enviadas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificacoes_enviadas (
    id integer NOT NULL,
    destinatario_nome character varying(150) NOT NULL,
    unidade character varying(100) DEFAULT 'Apto 301'::character varying NOT NULL,
    canal character varying(50) NOT NULL,
    contato character varying(150) NOT NULL,
    assunto character varying(200) NOT NULL,
    mensagem text NOT NULL,
    status character varying(50) DEFAULT 'ENVIADO'::character varying NOT NULL,
    tipo_evento character varying(100) DEFAULT 'AVISO'::character varying NOT NULL,
    enviado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    condominio_id integer DEFAULT 1 NOT NULL
);


--
-- Name: notificacoes_enviadas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notificacoes_enviadas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notificacoes_enviadas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notificacoes_enviadas_id_seq OWNED BY public.notificacoes_enviadas.id;


--
-- Name: ocorrencias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ocorrencias (
    id integer NOT NULL,
    titulo character varying(150) NOT NULL,
    local character varying(100),
    unidade character varying(50),
    morador character varying(100),
    categoria character varying(30) DEFAULT 'GERAL'::character varying NOT NULL,
    status character varying(20) DEFAULT 'EM ANÁLISE'::character varying NOT NULL,
    resumo_ia text,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    condominio_id integer DEFAULT 1 NOT NULL
);


--
-- Name: ocorrencias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ocorrencias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ocorrencias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ocorrencias_id_seq OWNED BY public.ocorrencias.id;


--
-- Name: reservas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservas (
    id integer NOT NULL,
    area character varying(50) NOT NULL,
    data_reserva date NOT NULL,
    horario_inicio character varying(10) NOT NULL,
    horario_fim character varying(10) NOT NULL,
    dia_inteiro boolean DEFAULT false NOT NULL,
    convidados integer DEFAULT 0,
    observacao text,
    morador character varying(100),
    status character varying(20) DEFAULT 'CONFIRMADO'::character varying NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    condominio_id integer DEFAULT 1 NOT NULL
);


--
-- Name: reservas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reservas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reservas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reservas_id_seq OWNED BY public.reservas.id;


--
-- Name: usuario_condominios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario_condominios (
    usuario_id integer NOT NULL,
    condominio_id integer NOT NULL
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    senha_hash character varying(255) NOT NULL,
    perfil character varying(20) DEFAULT 'MORADOR'::character varying NOT NULL,
    unidade character varying(50),
    status character varying(20) DEFAULT 'ATIVO'::character varying NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    condominio_id integer DEFAULT 1 NOT NULL
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: visitantes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visitantes (
    id integer NOT NULL,
    nome character varying(150) NOT NULL,
    documento character varying(50) DEFAULT '-'::character varying,
    placa_veiculo character varying(50) DEFAULT '-'::character varying,
    unidade_destino character varying(100) NOT NULL,
    status character varying(50) DEFAULT 'ENTROU'::character varying,
    data_entrada timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    condominio_id integer DEFAULT 1 NOT NULL
);


--
-- Name: visitantes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.visitantes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: visitantes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.visitantes_id_seq OWNED BY public.visitantes.id;


--
-- Name: alertas_panico id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alertas_panico ALTER COLUMN id SET DEFAULT nextval('public.alertas_panico_id_seq'::regclass);


--
-- Name: boletos_financeiro id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boletos_financeiro ALTER COLUMN id SET DEFAULT nextval('public.boletos_financeiro_id_seq'::regclass);


--
-- Name: codigos_recuperacao_senha id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_recuperacao_senha ALTER COLUMN id SET DEFAULT nextval('public.codigos_recuperacao_senha_id_seq'::regclass);


--
-- Name: comunicados id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comunicados ALTER COLUMN id SET DEFAULT nextval('public.comunicados_id_seq'::regclass);


--
-- Name: condominios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.condominios ALTER COLUMN id SET DEFAULT nextval('public.condominios_id_seq'::regclass);


--
-- Name: encomendas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encomendas ALTER COLUMN id SET DEFAULT nextval('public.encomendas_id_seq'::regclass);


--
-- Name: enquete_votos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquete_votos ALTER COLUMN id SET DEFAULT nextval('public.enquete_votos_id_seq'::regclass);


--
-- Name: enquetes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquetes ALTER COLUMN id SET DEFAULT nextval('public.enquetes_id_seq'::regclass);


--
-- Name: liberacoes_visita id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liberacoes_visita ALTER COLUMN id SET DEFAULT nextval('public.liberacoes_visita_id_seq'::regclass);


--
-- Name: livro_turno_portaria id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.livro_turno_portaria ALTER COLUMN id SET DEFAULT nextval('public.livro_turno_portaria_id_seq'::regclass);


--
-- Name: notificacoes_enviadas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes_enviadas ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_enviadas_id_seq'::regclass);


--
-- Name: ocorrencias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ocorrencias ALTER COLUMN id SET DEFAULT nextval('public.ocorrencias_id_seq'::regclass);


--
-- Name: reservas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas ALTER COLUMN id SET DEFAULT nextval('public.reservas_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Name: visitantes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitantes ALTER COLUMN id SET DEFAULT nextval('public.visitantes_id_seq'::regclass);


--
-- Name: alertas_panico alertas_panico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alertas_panico
    ADD CONSTRAINT alertas_panico_pkey PRIMARY KEY (id);


--
-- Name: boletos_financeiro boletos_financeiro_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boletos_financeiro
    ADD CONSTRAINT boletos_financeiro_pkey PRIMARY KEY (id);


--
-- Name: codigos_recuperacao_senha codigos_recuperacao_senha_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_recuperacao_senha
    ADD CONSTRAINT codigos_recuperacao_senha_pkey PRIMARY KEY (id);


--
-- Name: comunicados comunicados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comunicados
    ADD CONSTRAINT comunicados_pkey PRIMARY KEY (id);


--
-- Name: condominios condominios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.condominios
    ADD CONSTRAINT condominios_pkey PRIMARY KEY (id);


--
-- Name: condominios condominios_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.condominios
    ADD CONSTRAINT condominios_slug_key UNIQUE (slug);


--
-- Name: encomendas encomendas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encomendas
    ADD CONSTRAINT encomendas_pkey PRIMARY KEY (id);


--
-- Name: enquete_votos enquete_votos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquete_votos
    ADD CONSTRAINT enquete_votos_pkey PRIMARY KEY (id);


--
-- Name: enquetes enquetes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquetes
    ADD CONSTRAINT enquetes_pkey PRIMARY KEY (id);


--
-- Name: ia_uso_diario ia_uso_diario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ia_uso_diario
    ADD CONSTRAINT ia_uso_diario_pkey PRIMARY KEY (usuario_id, dia);


--
-- Name: liberacoes_visita liberacoes_visita_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liberacoes_visita
    ADD CONSTRAINT liberacoes_visita_codigo_key UNIQUE (codigo);


--
-- Name: liberacoes_visita liberacoes_visita_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liberacoes_visita
    ADD CONSTRAINT liberacoes_visita_pkey PRIMARY KEY (id);


--
-- Name: livro_turno_portaria livro_turno_portaria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.livro_turno_portaria
    ADD CONSTRAINT livro_turno_portaria_pkey PRIMARY KEY (id);


--
-- Name: notificacoes_enviadas notificacoes_enviadas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes_enviadas
    ADD CONSTRAINT notificacoes_enviadas_pkey PRIMARY KEY (id);


--
-- Name: ocorrencias ocorrencias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ocorrencias
    ADD CONSTRAINT ocorrencias_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: enquete_votos unq_enquete_unidade; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquete_votos
    ADD CONSTRAINT unq_enquete_unidade UNIQUE (enquete_id, unidade);


--
-- Name: usuario_condominios usuario_condominios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_condominios
    ADD CONSTRAINT usuario_condominios_pkey PRIMARY KEY (usuario_id, condominio_id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: visitantes visitantes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitantes
    ADD CONSTRAINT visitantes_pkey PRIMARY KEY (id);


--
-- Name: alertas_panico alertas_panico_condominio_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alertas_panico
    ADD CONSTRAINT alertas_panico_condominio_fk FOREIGN KEY (condominio_id) REFERENCES public.condominios(id);


--
-- Name: boletos_financeiro boletos_financeiro_condominio_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boletos_financeiro
    ADD CONSTRAINT boletos_financeiro_condominio_fk FOREIGN KEY (condominio_id) REFERENCES public.condominios(id);


--
-- Name: codigos_recuperacao_senha codigos_recuperacao_senha_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_recuperacao_senha
    ADD CONSTRAINT codigos_recuperacao_senha_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: comunicados comunicados_condominio_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comunicados
    ADD CONSTRAINT comunicados_condominio_fk FOREIGN KEY (condominio_id) REFERENCES public.condominios(id);


--
-- Name: encomendas encomendas_condominio_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encomendas
    ADD CONSTRAINT encomendas_condominio_fk FOREIGN KEY (condominio_id) REFERENCES public.condominios(id);


--
-- Name: enquete_votos enquete_votos_enquete_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquete_votos
    ADD CONSTRAINT enquete_votos_enquete_id_fkey FOREIGN KEY (enquete_id) REFERENCES public.enquetes(id) ON DELETE CASCADE;


--
-- Name: enquetes enquetes_condominio_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquetes
    ADD CONSTRAINT enquetes_condominio_fk FOREIGN KEY (condominio_id) REFERENCES public.condominios(id);


--
-- Name: liberacoes_visita liberacoes_visita_condominio_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liberacoes_visita
    ADD CONSTRAINT liberacoes_visita_condominio_fk FOREIGN KEY (condominio_id) REFERENCES public.condominios(id);


--
-- Name: livro_turno_portaria livro_turno_portaria_condominio_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.livro_turno_portaria
    ADD CONSTRAINT livro_turno_portaria_condominio_fk FOREIGN KEY (condominio_id) REFERENCES public.condominios(id);


--
-- Name: notificacoes_enviadas notificacoes_enviadas_condominio_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes_enviadas
    ADD CONSTRAINT notificacoes_enviadas_condominio_fk FOREIGN KEY (condominio_id) REFERENCES public.condominios(id);


--
-- Name: ocorrencias ocorrencias_condominio_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ocorrencias
    ADD CONSTRAINT ocorrencias_condominio_fk FOREIGN KEY (condominio_id) REFERENCES public.condominios(id);


--
-- Name: reservas reservas_condominio_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_condominio_fk FOREIGN KEY (condominio_id) REFERENCES public.condominios(id);


--
-- Name: usuario_condominios usuario_condominios_condominio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_condominios
    ADD CONSTRAINT usuario_condominios_condominio_id_fkey FOREIGN KEY (condominio_id) REFERENCES public.condominios(id) ON DELETE CASCADE;


--
-- Name: usuario_condominios usuario_condominios_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_condominios
    ADD CONSTRAINT usuario_condominios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: usuarios usuarios_condominio_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_condominio_fk FOREIGN KEY (condominio_id) REFERENCES public.condominios(id);


--
-- Name: visitantes visitantes_condominio_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitantes
    ADD CONSTRAINT visitantes_condominio_fk FOREIGN KEY (condominio_id) REFERENCES public.condominios(id);

-- Down Migration

DROP TABLE IF EXISTS public.codigos_recuperacao_senha CASCADE;
DROP TABLE IF EXISTS public.ia_uso_diario CASCADE;
DROP TABLE IF EXISTS public.usuario_condominios CASCADE;
DROP TABLE IF EXISTS public.enquete_votos CASCADE;
DROP TABLE IF EXISTS public.enquetes CASCADE;
DROP TABLE IF EXISTS public.liberacoes_visita CASCADE;
DROP TABLE IF EXISTS public.visitantes CASCADE;
DROP TABLE IF EXISTS public.livro_turno_portaria CASCADE;
DROP TABLE IF EXISTS public.boletos_financeiro CASCADE;
DROP TABLE IF EXISTS public.alertas_panico CASCADE;
DROP TABLE IF EXISTS public.notificacoes_enviadas CASCADE;
DROP TABLE IF EXISTS public.reservas CASCADE;
DROP TABLE IF EXISTS public.comunicados CASCADE;
DROP TABLE IF EXISTS public.encomendas CASCADE;
DROP TABLE IF EXISTS public.ocorrencias CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.condominios CASCADE;
