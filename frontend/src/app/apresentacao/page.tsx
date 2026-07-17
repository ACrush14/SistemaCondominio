export const metadata = {
  title: "CondoManage — Dossiê de Apresentação",
  description:
    "Gestão de condomínio com IA real, PIX real e portaria de verdade — demonstração ao vivo.",
};

export default function ApresentacaoPage() {
  return (
    <>
      <style>{`
        @font-face {
          font-family: "Fraunces Dossie";
          font-style: normal;
          font-weight: 600;
          font-display: swap;
          src: url("/fonts/fraunces-600.woff2") format("woff2");
        }

        .dossie {
          --bg: #F6F1E6;
          --bg-elevated: #FFFFFE;
          --bg-sunken: #ECE4D3;
          --ink: #16233B;
          --ink-soft: #4C5773;
          --ink-faint: #8891A6;
          --brass: #9C7222;
          --brass-ink: #6E4F14;
          --verdigris: #23745F;
          --coral: #B23A2C;
          --rule: rgba(22, 35, 59, 0.14);
          --rule-strong: rgba(22, 35, 59, 0.26);
          --card-shadow: 0 1px 2px rgba(22, 35, 59, 0.06), 0 12px 32px -16px rgba(22, 35, 59, 0.22);
          --chip-bg: rgba(156, 114, 34, 0.12);
          --cta-bg: #16233B;
          --cta-fg: #F6F1E6;
          background: var(--bg);
          color: var(--ink);
          font-family: ui-sans-serif, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
          font-size: 16px;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        @media (prefers-color-scheme: dark) {
          .dossie {
            --bg: #071B30;
            --bg-elevated: #0E2846;
            --bg-sunken: #081F38;
            --ink: #EFE8D9;
            --ink-soft: #B7C1D8;
            --ink-faint: #7C8AA6;
            --brass: #E0B156;
            --brass-ink: #F3D28C;
            --verdigris: #5FC4A6;
            --coral: #FF8A78;
            --rule: rgba(239, 232, 217, 0.14);
            --rule-strong: rgba(239, 232, 217, 0.26);
            --card-shadow: 0 1px 0 rgba(239, 232, 217, 0.05), 0 24px 48px -20px rgba(0, 0, 0, 0.55);
            --chip-bg: rgba(224, 177, 86, 0.14);
            --cta-bg: #E0B156;
            --cta-fg: #1B1204;
          }
        }

        .dossie * { box-sizing: border-box; }
        .dossie a { color: inherit; }

        .dossie .serif {
          font-family: "Fraunces Dossie", ui-serif, Georgia, serif;
          font-weight: 620;
          letter-spacing: -0.01em;
          text-wrap: balance;
        }

        .dossie .eyebrow {
          font-family: ui-monospace, "Cascadia Code", "Consolas", monospace;
          font-size: 0.72rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--brass-ink);
          font-weight: 600;
        }

        .dossie .page { max-width: 900px; margin: 0 auto; padding: 0 28px; }

        .dossie .capa {
          background: radial-gradient(1100px 480px at 15% -10%, rgba(224, 177, 86, 0.16), transparent 60%), var(--bg-sunken);
          border-bottom: 1px solid var(--rule);
          padding: 72px 0 56px;
        }

        .dossie .capa-topo { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 56px; }
        .dossie .marca { display: flex; align-items: center; gap: 10px; }
        .dossie .marca-selo {
          width: 34px; height: 34px; border-radius: 8px;
          background: var(--ink); color: var(--bg);
          display: flex; align-items: center; justify-content: center;
          font-family: "Fraunces Dossie", serif; font-weight: 700; font-size: 1.05rem;
        }
        .dossie .marca-nome { font-family: "Fraunces Dossie", serif; font-weight: 650; font-size: 1.05rem; letter-spacing: -0.01em; }
        .dossie .capa-data { font-family: ui-monospace, monospace; font-size: 0.8rem; color: var(--ink-faint); font-variant-numeric: tabular-nums; }
        .dossie .capa-titulo { font-size: clamp(2.6rem, 6vw, 4.4rem); line-height: 1.03; margin: 0 0 22px; }
        .dossie .capa-titulo em { font-style: italic; color: var(--brass-ink); }
        .dossie .capa-sub { max-width: 54ch; font-size: 1.15rem; color: var(--ink-soft); margin: 0 0 34px; }

        .dossie .estat-linha {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
          border-top: 1px solid var(--rule-strong); border-bottom: 1px solid var(--rule-strong);
          margin: 40px 0 8px;
        }
        .dossie .estat { padding: 16px 18px; border-right: 1px solid var(--rule); }
        .dossie .estat:last-child { border-right: none; }
        .dossie .estat-num {
          font-family: "Fraunces Dossie", serif; font-weight: 640; font-size: 1.5rem;
          color: var(--brass-ink); font-variant-numeric: tabular-nums; display: block;
        }
        .dossie .estat-rot { font-size: 0.78rem; color: var(--ink-faint); margin-top: 2px; }

        .dossie .janela {
          margin: 52px 0 8px; border-radius: 14px; background: var(--bg-elevated);
          border: 1px solid var(--rule); box-shadow: var(--card-shadow); overflow: hidden;
        }
        .dossie .janela-barra {
          display: flex; align-items: center; gap: 8px; padding: 11px 14px;
          border-bottom: 1px solid var(--rule); background: var(--bg-sunken);
        }
        .dossie .janela-ponto { width: 9px; height: 9px; border-radius: 50%; background: var(--rule-strong); }
        .dossie .janela-rotulo { margin-left: 6px; font-family: ui-monospace, monospace; font-size: 0.74rem; color: var(--ink-faint); }
        .dossie .janela video { display: block; width: 100%; height: auto; background: #05121F; }
        .dossie .janela-legenda {
          padding: 12px 16px 16px; font-size: 0.86rem; color: var(--ink-faint);
          display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;
        }

        .dossie .preambulo { padding: 56px 0 8px; }
        .dossie .preambulo p { font-size: 1.08rem; color: var(--ink-soft); max-width: 66ch; }
        .dossie .preambulo p + p { margin-top: 14px; }

        .dossie .artigos { padding: 12px 0 8px; }
        .dossie .artigo {
          padding: 40px 0; border-top: 1px solid var(--rule);
          display: grid; grid-template-columns: 92px 1fr; gap: 24px;
        }
        .dossie .artigo-num { font-family: "Fraunces Dossie", serif; font-weight: 620; font-size: 1.05rem; color: var(--brass-ink); padding-top: 3px; }
        .dossie .artigo-titulo { font-size: 1.5rem; margin: 0 0 10px; }
        .dossie .artigo-corpo p { color: var(--ink-soft); max-width: 62ch; margin: 0 0 12px; }

        .dossie .tag-linha { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 18px; }
        .dossie .tag { font-size: 0.72rem; font-weight: 600; letter-spacing: 0.02em; padding: 4px 10px; border-radius: 100px; background: var(--chip-bg); color: var(--brass-ink); }
        .dossie .tag.tag-verde { background: rgba(35, 116, 95, 0.14); color: var(--verdigris); }

        .dossie .exhibit { margin-top: 18px; border-radius: 12px; overflow: hidden; border: 1px solid var(--rule); box-shadow: var(--card-shadow); max-width: 620px; }
        .dossie .exhibit img { display: block; width: 100%; height: auto; }
        .dossie .exhibit-legenda { font-family: ui-monospace, monospace; font-size: 0.72rem; color: var(--ink-faint); padding: 8px 14px; border-top: 1px solid var(--rule); background: var(--bg-sunken); }
        .dossie .exhibit.exhibit-mobile { max-width: 300px; }

        .dossie .ficha { padding: 48px 0; border-top: 1px solid var(--rule); }
        .dossie .ficha-titulo { font-size: 1.7rem; margin: 0 0 6px; }
        .dossie .ficha-sub { color: var(--ink-faint); font-size: 0.95rem; margin: 0 0 26px; }
        .dossie .ficha-grade {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px;
          background: var(--rule); border: 1px solid var(--rule); border-radius: 10px; overflow: hidden;
        }
        .dossie .ficha-item { background: var(--bg-elevated); padding: 14px 18px; display: flex; justify-content: space-between; gap: 12px; font-size: 0.88rem; }
        .dossie .ficha-item dt { color: var(--ink-faint); }
        .dossie .ficha-item dd { margin: 0; font-weight: 600; text-align: right; font-variant-numeric: tabular-nums; }

        .dossie .paragrafo-unico { padding: 44px 0; border-top: 1px solid var(--rule); }
        .dossie .paragrafo-unico h3 { font-size: 1.2rem; margin: 0 0 12px; }
        .dossie .paragrafo-unico p { color: var(--ink-soft); max-width: 64ch; margin: 0 0 14px; }
        .dossie .lista-honesta { list-style: none; margin: 18px 0 0; padding: 0; display: grid; gap: 10px; }
        .dossie .lista-honesta li { display: grid; grid-template-columns: 20px 1fr; gap: 10px; font-size: 0.93rem; color: var(--ink-soft); }
        .dossie .lista-honesta li::before { content: "§"; color: var(--brass-ink); font-family: "Fraunces Dossie", serif; }

        .dossie .assinatura { padding: 60px 0 80px; border-top: 1px solid var(--rule); text-align: center; }
        .dossie .assinatura-texto { font-size: 1.7rem; max-width: 34ch; margin: 0 auto 26px; }
        .dossie .cta {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--cta-bg); color: var(--cta-fg);
          padding: 14px 26px; border-radius: 100px; font-weight: 600; font-size: 0.95rem;
          text-decoration: none; box-shadow: var(--card-shadow);
        }
        .dossie .cta:focus-visible { outline: 2px solid var(--brass-ink); outline-offset: 3px; }
        .dossie .rodape-selo { margin-top: 40px; font-family: ui-monospace, monospace; font-size: 0.72rem; color: var(--ink-faint); }

        @media (max-width: 640px) {
          .dossie .capa { padding: 48px 0 40px; }
          .dossie .estat-linha { grid-template-columns: repeat(2, 1fr); }
          .dossie .estat:nth-child(2) { border-right: none; }
          .dossie .artigo { grid-template-columns: 1fr; gap: 8px; }
          .dossie .ficha-grade { grid-template-columns: 1fr; }
        }
      `}</style>

      <main className="dossie">
        <section className="capa">
          <div className="page">
            <div className="capa-topo">
              <div className="marca">
                <span className="marca-selo">C</span>
                <span className="marca-nome">CondoManage</span>
              </div>
              <span className="capa-data eyebrow">Dossiê Nº 001 · Julho 2026</span>
            </div>

            <p className="eyebrow" style={{ marginBottom: 14 }}>Apresentação técnico-comercial</p>
            <h1 className="capa-titulo serif">
              Gestão de condomínio<br /><em>com IA, PIX e portaria</em><br />de verdade.
            </h1>
            <p className="capa-sub">
              Não é maquete de tela. Banco de dados real, autenticação real, pagamento PIX real
              e um assistente de IA que realmente lê o condomínio antes de responder.
            </p>

            <div className="janela">
              <div className="janela-barra">
                <span className="janela-ponto"></span><span className="janela-ponto"></span><span className="janela-ponto"></span>
                <span className="janela-rotulo">sistemacondominio-nine.vercel.app</span>
              </div>
              <video controls muted loop playsInline preload="metadata" poster="/apresentacao/demo-poster.jpg">
                <source src="/apresentacao/demo.mp4" type="video/mp4" />
              </video>
              <div className="janela-legenda">
                <span>▶ Demonstração real — login, reservas, portaria, financeiro e o menu mobile, sem cortes de edição.</span>
                <span>0:33</span>
              </div>
            </div>

            <div className="estat-linha">
              <div className="estat"><span className="estat-num">3</span><span className="estat-rot">pontos de IA real (Gemini)</span></div>
              <div className="estat"><span className="estat-num">12</span><span className="estat-rot">tabelas isoladas por condomínio</span></div>
              <div className="estat"><span className="estat-num">PIX</span><span className="estat-rot">cobrança real via Mercado Pago</span></div>
              <div className="estat"><span className="estat-num">375px</span><span className="estat-rot">testado em tela real de celular</span></div>
            </div>
          </div>
        </section>

        <section className="preambulo page">
          <p className="eyebrow" style={{ marginBottom: 10 }}>Preâmbulo</p>
          <p>
            Toda convenção de condomínio começa explicando por que ela existe. Esta também: o
            CondoManage nasceu como um projeto de aprendizado prático de integração full-stack
            e, artigo por artigo, virou uma plataforma real — com painel do Síndico, central da
            Portaria e Área do Morador rodando sobre o mesmo banco PostgreSQL, hospedado na nuvem.
          </p>
          <p>
            O que está descrito abaixo não é roadmap nem intenção: é o que já está no ar, testado
            contra o banco de produção, tela por tela — inclusive o vídeo acima, gravado direto do
            sistema rodando, sem storyboard.
          </p>
        </section>

        <section className="artigos page">
          <article className="artigo">
            <span className="artigo-num serif">Art. 1º</span>
            <div className="artigo-corpo">
              <h2 className="artigo-titulo serif">Autenticação, multi-condomínio e controle de acesso</h2>
              <p>
                Login com senha em hash (bcrypt) e sessão em JWT — nenhuma tela existe sem login.
                Cada conta pertence a um condomínio, e as 12 tabelas de dados são isoladas por
                tenant: um síndico do Edifício A nunca enxerga um dado do Edifício B, mesmo
                adivinhando o ID certo. Um síndico pode administrar mais de um prédio e alternar
                entre eles de verdade.
              </p>
              <div className="tag-linha">
                <span className="tag">Isolamento real por tenant</span>
                <span className="tag">Perfis: Síndico · Porteiro · Morador</span>
                <span className="tag tag-verde">Soft-delete com auditoria</span>
              </div>
            </div>
          </article>

          <article className="artigo">
            <span className="artigo-num serif">Art. 2º</span>
            <div className="artigo-corpo">
              <h2 className="artigo-titulo serif">Inteligência artificial real, em três frentes</h2>
              <p>
                &quot;IA Mania&quot; entende um pedido de reserva escrito em português corrido —
                <em> &quot;quero o salão dia 25, das 15h às 20h, para 20 pessoas&quot;</em> — extrai os
                dados e já confere no banco se há conflito de horário antes de sugerir a confirmação.
                O Livro de Ocorrências resume automaticamente o relato do morador. E o Síndico tem
                um assistente executivo que lê ocorrências, encomendas e alertas de pânico em tempo
                real antes de responder.
              </p>
              <div className="tag-linha">
                <span className="tag">Google Gemini 2.5</span>
                <span className="tag">Linguagem natural, não regex</span>
                <span className="tag tag-verde">Limite diário por usuário</span>
              </div>
            </div>
          </article>

          <article className="artigo">
            <span className="artigo-num serif">Art. 3º</span>
            <div className="artigo-corpo">
              <h2 className="artigo-titulo serif">Reservas de áreas comuns sem sobreposição</h2>
              <p>
                Salão de festas, churrasqueira e piscina/academia com agenda semanal visual. Toda
                reserva — manual ou via IA — passa pela mesma checagem real de conflito de horário
                no banco, e cancelamento é reversível (soft-delete), liberando o horário sem apagar
                histórico.
              </p>
              <div className="exhibit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/apresentacao/reservas.png" alt="Tela de Reservas do CondoManage" />
                <div className="exhibit-legenda">EXHIBIT A — /reservas, sessão real de síndico</div>
              </div>
            </div>
          </article>

          <article className="artigo">
            <span className="artigo-num serif">Art. 4º</span>
            <div className="artigo-corpo">
              <h2 className="artigo-titulo serif">Financeiro com PIX real, não uma imagem de mentira</h2>
              <p>
                2ª via de boleto com código de barras e <strong>PIX Copia e Cola real</strong>, gerado
                via API de Orders do Mercado Pago. A confirmação de pagamento chega por webhook
                assinado — o morador não tem um botão de &quot;eu já paguei, confia&quot; clicando sozinho.
              </p>
              <div className="tag-linha">
                <span className="tag tag-verde">Mercado Pago · API de Orders</span>
                <span className="tag">Webhook com assinatura validada</span>
              </div>
              <div className="exhibit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/apresentacao/area-morador.png" alt="Área do Morador — Financeiro" />
                <div className="exhibit-legenda">EXHIBIT B — /area-morador, aba Financeiro &amp; 2ª Via</div>
              </div>
            </div>
          </article>

          <article className="artigo">
            <span className="artigo-num serif">Art. 5º</span>
            <div className="artigo-corpo">
              <h2 className="artigo-titulo serif">Portaria: acesso, pânico e passagem de plantão</h2>
              <p>
                Liberação de visitante por QR Code ou por código numérico de 6 dígitos (mais fácil
                de digitar entre aparelhos diferentes). Botão de pânico de 1 clique dispara um
                banner em tempo real no painel do Síndico até ser resolvido. Livro de plantão com
                confirmação de leitura entre porteiros, sem depender de caderno físico.
              </p>
              <div className="exhibit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/apresentacao/portaria.png" alt="Central da Portaria" />
                <div className="exhibit-legenda">EXHIBIT C — /portaria, alertas de pânico e plantão</div>
              </div>
            </div>
          </article>

          <article className="artigo">
            <span className="artigo-num serif">Art. 6º</span>
            <div className="artigo-corpo">
              <h2 className="artigo-titulo serif">Enquetes com voto único por unidade</h2>
              <p>
                O Síndico cria a enquete, cada unidade vota uma vez (revotar corrige, não duplica),
                e o resultado percentual aparece em tempo real tanto pro Síndico quanto pro morador.
              </p>
            </div>
          </article>

          <article className="artigo">
            <span className="artigo-num serif">Art. 7º</span>
            <div className="artigo-corpo">
              <h2 className="artigo-titulo serif">Notificações que realmente saem da caixa de entrada</h2>
              <p>
                Disparo real de e-mail (Resend) e WhatsApp (Twilio) para avisos de encomenda,
                financeiro e comunicados — com auditoria permanente de cada envio no banco, não um
                log que some.
              </p>
            </div>
          </article>

          <article className="artigo">
            <span className="artigo-num serif">Art. 8º</span>
            <div className="artigo-corpo">
              <h2 className="artigo-titulo serif">Aplicativo instalável e 100% responsivo</h2>
              <p>
                Instalável como app nativo em Android, iOS e desktop (PWA). E — testado tela por
                tela, não só no código — a barra lateral vira uma gaveta deslizante em celular
                real, sem cobrir o conteúdo nem exigir zoom.
              </p>
              <div className="exhibit exhibit-mobile">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/apresentacao/mobile-menu.png" alt="Menu em gaveta no celular" />
                <div className="exhibit-legenda">EXHIBIT D — 390px de largura, tela real</div>
              </div>
            </div>
          </article>
        </section>

        <section className="ficha page">
          <h2 className="ficha-titulo serif">Ficha técnica</h2>
          <p className="ficha-sub">Como a plataforma é construída por baixo — pra quem vai perguntar.</p>
          <dl className="ficha-grade">
            <div className="ficha-item"><dt>Framework</dt><dd>Next.js 16 (App Router)</dd></div>
            <div className="ficha-item"><dt>Interface</dt><dd>React 19 + TypeScript + Tailwind</dd></div>
            <div className="ficha-item"><dt>Banco de dados</dt><dd>PostgreSQL real (Neon)</dd></div>
            <div className="ficha-item"><dt>Migrações</dt><dd>node-pg-migrate, versionadas</dd></div>
            <div className="ficha-item"><dt>Autenticação</dt><dd>JWT + bcrypt, cookie httpOnly</dd></div>
            <div className="ficha-item"><dt>IA</dt><dd>Google Gemini 2.5 Flash</dd></div>
            <div className="ficha-item"><dt>Pagamentos</dt><dd>Mercado Pago · PIX (API de Orders)</dd></div>
            <div className="ficha-item"><dt>Notificações</dt><dd>Resend (e-mail) + Twilio (WhatsApp)</dd></div>
            <div className="ficha-item"><dt>Monitoramento</dt><dd>Sentry</dd></div>
            <div className="ficha-item"><dt>Testes</dt><dd>Vitest, 14 testes de regra de negócio</dd></div>
            <div className="ficha-item"><dt>Instalação</dt><dd>PWA (Android / iOS / Desktop)</dd></div>
            <div className="ficha-item"><dt>Hospedagem</dt><dd>Vercel, deploy automático</dd></div>
          </dl>
        </section>

        <section className="paragrafo-unico page">
          <p className="eyebrow" style={{ marginBottom: 10 }}>Parágrafo único — o que ainda está sendo redigido</p>
          <h3 className="serif">Transparência antes de qualquer coisa</h3>
          <p>
            Um dossiê sério não esconde o que falta. O que está abaixo não são bugs — é o que
            separa &quot;MVP sólido&quot; de &quot;produto pronto pra faturar terceiros&quot;:
          </p>
          <ul className="lista-honesta">
            <li>Ativação de credenciais de produção do PIX (Mercado Pago) e do WhatsApp (Twilio) — hoje ambos já funcionam de ponta a ponta em ambiente de teste.</li>
            <li>Domínio de e-mail próprio verificado — hoje o envio real usa o domínio de testes do provedor.</li>
            <li>Camadas adicionais de segurança antes de um público maior: limite de tentativas de login, revogação de sessão e 2FA.</li>
            <li>Onboarding self-service para um novo condomínio se cadastrar sozinho, e um plano de cobrança para o próprio uso da plataforma.</li>
          </ul>
        </section>

        <section className="assinatura page">
          <p className="serif assinatura-texto">Pronto pra ver rodando com os dados do seu condomínio?</p>
          <a className="cta" href="/login">Entrar no CondoManage →</a>
          <div className="rodape-selo">CONDOMANAGE · DOSSIÊ TÉCNICO-COMERCIAL · DOCUMENTO VIVO, ATUALIZADO A CADA ENTREGA</div>
        </section>
      </main>
    </>
  );
}
