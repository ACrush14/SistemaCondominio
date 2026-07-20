export const metadata = {
  title: "CondoManage — Guia do Síndico",
  description: "Guia de início para síndicos: primeiro acesso, painel, financeiro, portaria e assistente de IA.",
};

export default function AjudaPage() {
  return (
    <>
      <style>{`
        .guia {
          --bg: #f5f7fb;
          --bg-elevated: #ffffff;
          --bg-sunken: #eef1f7;
          --ink: #16233b;
          --ink-soft: #4c5773;
          --ink-faint: #8891a6;
          --navy: #0a2540;
          --navy-2: #1e3a8a;
          --cyan: #0ea5e9;
          --cyan-ink: #0369a1;
          --green: #16a34a;
          --green-bg: #ecfdf3;
          --amber: #b45309;
          --amber-bg: #fef6e7;
          --rule: rgba(22, 35, 59, 0.10);
          --shadow: 0 1px 2px rgba(22,35,59,0.04), 0 10px 28px -14px rgba(22,35,59,0.18);
          background: var(--bg);
          color: var(--ink);
          font-family: "Segoe UI", ui-sans-serif, -apple-system, Roboto, Arial, sans-serif;
          font-size: 16px;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }

        @media (prefers-color-scheme: dark) {
          .guia {
            --bg: #0b1626;
            --bg-elevated: #101f34;
            --bg-sunken: #0d1a2c;
            --ink: #e8edf6;
            --ink-soft: #aab6cc;
            --ink-faint: #7284a0;
            --navy-2: #38bdf8;
            --cyan: #38bdf8;
            --cyan-ink: #7dd3fc;
            --green: #4ade80;
            --green-bg: rgba(74, 222, 128, 0.12);
            --amber: #fbbf24;
            --amber-bg: rgba(251, 191, 36, 0.12);
            --rule: rgba(232, 237, 246, 0.10);
            --shadow: 0 1px 0 rgba(232,237,246,0.04), 0 20px 40px -18px rgba(0,0,0,0.6);
          }
        }

        .guia * { box-sizing: border-box; }
        .guia a { color: var(--cyan-ink); }
        html { scroll-behavior: smooth; }

        .guia .shell { display: flex; min-height: 100vh; align-items: flex-start; }

        .guia .nav {
          position: sticky; top: 0;
          width: 270px; min-width: 270px; height: 100vh;
          background: var(--navy);
          color: #dbe6f5;
          padding: 28px 20px;
          overflow-y: auto;
        }
        .guia .nav-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
        .guia .nav-brand-mark {
          width: 30px; height: 30px; border-radius: 8px; background: var(--cyan);
          color: var(--navy); font-weight: 800; display: flex; align-items: center; justify-content: center;
          font-size: 0.95rem;
        }
        .guia .nav-brand-name { font-weight: 700; font-size: 1.02rem; color: #fff; }
        .guia .nav-sub { font-size: 0.78rem; color: #93a6c4; margin: 0 0 26px; }
        .guia .nav-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
        .guia .nav-list a {
          display: block; padding: 8px 10px; border-radius: 8px; font-size: 0.86rem;
          color: #c6d3e8; text-decoration: none; transition: background 0.15s;
        }
        .guia .nav-list a:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .guia .nav-list .num { display: inline-block; width: 1.4em; color: #6f88ab; font-variant-numeric: tabular-nums; }
        .guia .nav-back { display: block; margin-top: 22px; font-size: 0.8rem; color: #93a6c4; }

        .guia .main { flex: 1; min-width: 0; padding: 48px 56px 96px; max-width: 900px; margin: 0 auto; }
        .guia .eyebrow {
          font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
          font-size: 0.74rem; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--cyan-ink); font-weight: 700; margin: 0 0 10px;
        }
        .guia h1.title { font-size: clamp(1.8rem, 3.4vw, 2.5rem); line-height: 1.15; margin: 0 0 14px; text-wrap: balance; font-weight: 750; }
        .guia .lede { font-size: 1.08rem; color: var(--ink-soft); max-width: 62ch; margin: 0 0 8px; }

        .guia section.block { padding: 52px 0 8px; border-top: 1px solid var(--rule); scroll-margin-top: 24px; }
        .guia section.block:first-of-type { border-top: none; }
        .guia .block-head { display: flex; align-items: baseline; gap: 14px; margin-bottom: 6px; }
        .guia .block-num {
          font-family: ui-monospace, monospace; font-weight: 700; font-size: 0.95rem;
          color: var(--cyan-ink); background: var(--bg-sunken); border-radius: 8px;
          padding: 3px 9px; flex: none;
        }
        .guia h2.block-title { font-size: 1.5rem; margin: 0; font-weight: 700; }
        .guia .block-desc { color: var(--ink-soft); max-width: 66ch; margin: 10px 0 24px; }

        .guia .steps { list-style: none; margin: 0 0 20px; padding: 0; counter-reset: step; }
        .guia .steps > li {
          counter-increment: step;
          display: grid; grid-template-columns: 30px 1fr; gap: 14px;
          padding: 10px 0;
        }
        .guia .steps > li::before {
          content: counter(step);
          font-family: ui-monospace, monospace; font-weight: 700; font-size: 0.8rem;
          width: 26px; height: 26px; border-radius: 50%;
          background: var(--navy-2); color: #fff;
          display: flex; align-items: center; justify-content: center;
          margin-top: 1px;
        }
        .guia .steps strong { color: var(--ink); }
        .guia .steps .step-body { color: var(--ink-soft); }

        .guia code {
          font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
          font-size: 0.86em; background: var(--bg-sunken); padding: 0.1em 0.4em; border-radius: 5px;
        }

        .guia .shot {
          margin: 20px 0 8px; border-radius: 12px; overflow: hidden;
          border: 1px solid var(--rule); box-shadow: var(--shadow); background: var(--bg-elevated);
        }
        .guia .shot img { display: block; width: 100%; height: auto; }
        .guia .shot-cap {
          font-family: ui-monospace, monospace; font-size: 0.74rem; color: var(--ink-faint);
          padding: 8px 14px; border-top: 1px solid var(--rule); background: var(--bg-sunken);
        }

        .guia .callout {
          display: flex; gap: 12px; padding: 14px 16px; border-radius: 10px;
          margin: 18px 0; font-size: 0.93rem; border: 1px solid var(--rule);
        }
        .guia .callout.tip { background: var(--green-bg); border-color: rgba(22,163,74,0.22); }
        .guia .callout.warn { background: var(--amber-bg); border-color: rgba(180,83,9,0.22); }
        .guia .callout .ic { flex: none; font-weight: 800; font-size: 1.05rem; }
        .guia .callout.tip .ic { color: var(--green); }
        .guia .callout.warn .ic { color: var(--amber); }
        .guia .callout p { margin: 0; color: var(--ink-soft); }
        .guia .callout strong { color: var(--ink); }

        .guia .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 18px 0; }
        .guia .card {
          border: 1px solid var(--rule); border-radius: 10px; padding: 16px 18px;
          background: var(--bg-elevated); box-shadow: var(--shadow);
        }
        .guia .card h4 { margin: 0 0 6px; font-size: 0.98rem; }
        .guia .card p { margin: 0; color: var(--ink-soft); font-size: 0.9rem; }

        .guia ul.plain { margin: 0 0 18px; padding-left: 22px; color: var(--ink-soft); }
        .guia ul.plain li { margin: 6px 0; }
        .guia ul.plain strong { color: var(--ink); }

        .guia .faq { border-top: 1px solid var(--rule); padding: 16px 0; }
        .guia .faq:first-child { border-top: none; }
        .guia .faq h4 { margin: 0 0 6px; font-size: 0.98rem; }
        .guia .faq p { margin: 0; color: var(--ink-soft); }

        .guia footer.end {
          margin-top: 60px; padding-top: 24px; border-top: 1px solid var(--rule);
          color: var(--ink-faint); font-size: 0.86rem;
        }

        @media (max-width: 860px) {
          .guia .shell { flex-direction: column; }
          .guia .nav { position: static; width: 100%; height: auto; }
          .guia .main { padding: 32px 20px 64px; }
          .guia .grid2 { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="guia">
        <div className="shell">
          <nav className="nav">
            <div className="nav-brand">
              <div className="nav-brand-mark">C</div>
              <div className="nav-brand-name">CondoManage</div>
            </div>
            <p className="nav-sub">Guia de início — Síndico</p>
            <ul className="nav-list">
              <li><a href="#primeiro-acesso"><span className="num">01</span> Primeiro acesso</a></li>
              <li><a href="#painel"><span className="num">02</span> Seu painel principal</a></li>
              <li><a href="#configurar"><span className="num">03</span> Configurar o condomínio</a></li>
              <li><a href="#comunicacao"><span className="num">04</span> Falar com os moradores</a></li>
              <li><a href="#financeiro"><span className="num">05</span> Financeiro e boletos</a></li>
              <li><a href="#portaria"><span className="num">06</span> Portaria e segurança</a></li>
              <li><a href="#ocorrencias"><span className="num">07</span> Ocorrências e reservas</a></li>
              <li><a href="#ia"><span className="num">08</span> Assistente executivo (IA)</a></li>
              <li><a href="#instalar"><span className="num">09</span> Instalar no celular</a></li>
              <li><a href="#duvidas"><span className="num">10</span> Dúvidas comuns</a></li>
            </ul>
            <a className="nav-back" href="/">← Voltar ao sistema</a>
          </nav>

          <main className="main">
            <p className="eyebrow">Guia do síndico · CondoManage</p>
            <h1 className="title">Tudo o que você precisa pra colocar seu condomínio pra rodar</h1>
            <p className="lede">
              Este guia leva você do primeiro login até o uso do dia a dia — comunicação com moradores, cobrança,
              portaria e o assistente de IA. Nenhum passo aqui é teórico: é exatamente o que existe no sistema hoje.
            </p>

            <section className="block" id="primeiro-acesso">
              <div className="block-head"><span className="block-num">01</span><h2 className="block-title">Primeiro acesso</h2></div>
              <p className="block-desc">Sua conta de síndico já vem criada — você recebeu (ou vai receber) um e-mail e uma senha provisória.</p>
              <ol className="steps">
                <li><strong>Acesse o site do seu condomínio</strong><div className="step-body">Abra o link que você recebeu (algo como <code>seudominio.com/login</code>) no navegador do computador ou celular.</div></li>
                <li><strong>Entre com e-mail e senha</strong><div className="step-body">Use as credenciais fornecidas na ativação da sua conta.</div></li>
                <li><strong>Esqueceu a senha?</strong><div className="step-body">Clique em &quot;Esqueceu a senha?&quot; na tela de login. Você recebe um código de 6 dígitos por e-mail, válido por 15 minutos, pra criar uma senha nova.</div></li>
              </ol>
              <div className="callout tip">
                <span className="ic">✓</span>
                <p><strong>Sua senha é só sua.</strong> Ninguém da equipe do CondoManage — nem suporte — precisa dela pra te ajudar. Nunca compartilhe.</p>
              </div>
            </section>

            <section className="block" id="painel">
              <div className="block-head"><span className="block-num">02</span><h2 className="block-title">Seu painel principal</h2></div>
              <p className="block-desc">É a primeira tela depois do login — sua central de comando. Nela você vê, de imediato:</p>
              <ul className="plain">
                <li><strong>Ocorrências pendentes</strong> — reclamações/relatos de moradores que ainda precisam de resposta sua.</li>
                <li><strong>Unidades e moradores</strong> — quantas unidades têm morador cadastrado.</li>
                <li><strong>Status da portaria</strong> — se está com alguém de plantão registrado.</li>
                <li><strong>Assistente Executivo IA</strong> — resume suas prioridades do dia (mais na seção 08).</li>
                <li><strong>Mural de Comunicados</strong> e <strong>Enquetes & Votações</strong> em tempo real.</li>
              </ul>
              <div className="shot">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/apresentacao/painel-sindico.png" alt="Painel do Síndico" />
                <div className="shot-cap">Painel do Síndico — visão geral</div>
              </div>
            </section>

            <section className="block" id="configurar">
              <div className="block-head"><span className="block-num">03</span><h2 className="block-title">Configurar o condomínio</h2></div>
              <p className="block-desc">Antes de tudo, cadastre quem vai usar o sistema com você.</p>
              <ol className="steps">
                <li><strong>Cadastre o porteiro</strong><div className="step-body">Menu <code>Moradores & Usuários</code> → novo usuário → perfil <strong>Porteiro</strong>. Ele vai logar com o próprio e-mail e senha.</div></li>
                <li><strong>Cadastre os moradores</strong><div className="step-body">Mesma tela, perfil <strong>Morador</strong>, vinculando a unidade (ex: Apto 204). Ou oriente o próprio morador a se cadastrar sozinho pela tela pública de cadastro — a conta já nasce vinculada ao seu condomínio.</div></li>
                <li><strong>Confira os vínculos</strong><div className="step-body">Se você administra mais de um prédio, use o botão <code>🏢 Prédios SaaS</code> no topo do painel pra alternar entre eles.</div></li>
              </ol>
              <div className="callout warn">
                <span className="ic">!</span>
                <p><strong>Contas de Síndico e Porteiro só podem ser criadas por um síndico já logado.</strong> Só o morador tem cadastro público — é uma proteção de segurança deliberada.</p>
              </div>
            </section>

            <section className="block" id="comunicacao">
              <div className="block-head"><span className="block-num">04</span><h2 className="block-title">Falar com os moradores</h2></div>
              <p className="block-desc">Três formas de chegar até o morador, cada uma pro seu propósito.</p>
              <div className="grid2">
                <div className="card"><h4>📢 Mural de Comunicados</h4><p>Avisos que ficam fixados, visíveis pra todos na Área do Morador.</p></div>
                <div className="card"><h4>📊 Enquetes & Votações</h4><p>Crie uma votação com opções livres; resultado aparece em tempo real, com trava de 1 voto por unidade.</p></div>
                <div className="card"><h4>📲 E-mail & WhatsApp</h4><p>Disparo direto pra um morador específico — útil pra avisos individuais (encomenda chegou, débito em aberto).</p></div>
                <div className="card"><h4>🤖 Assistente de reservas</h4><p>O morador conversa em português normal com a &quot;IA Mania&quot; pra reservar áreas — você não precisa mediar.</p></div>
              </div>
              <div className="callout warn">
                <span className="ic">!</span>
                <p><strong>Envio por WhatsApp depende de configuração adicional</strong> (conta Twilio) que pode não estar ativa ainda no seu plano — confirme com o suporte se as mensagens de WhatsApp não estiverem chegando.</p>
              </div>
            </section>

            <section className="block" id="financeiro">
              <div className="block-head"><span className="block-num">05</span><h2 className="block-title">Financeiro e boletos</h2></div>
              <p className="block-desc">O morador emite a própria 2ª via e paga por PIX real — você só acompanha.</p>
              <ul className="plain">
                <li>Boletos podem ser gerados manualmente por você, ou automaticamente todo mês pra unidades sem cobrança ainda no período.</li>
                <li>O morador vê tudo na aba <strong>Financeiro & 2ª Via</strong> da Área do Morador: valor, vencimento, detalhamento de despesas, e um QR Code PIX de verdade pra pagar.</li>
                <li>O pagamento é confirmado automaticamente quando o PIX cai — você não precisa dar baixa manual no dia a dia.</li>
              </ul>
              <div className="shot">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/apresentacao/area-morador.png" alt="Área do Morador — financeiro" />
                <div className="shot-cap">Área do Morador — o que o morador vê ao emitir a 2ª via</div>
              </div>
            </section>

            <section className="block" id="portaria">
              <div className="block-head"><span className="block-num">06</span><h2 className="block-title">Portaria e segurança</h2></div>
              <p className="block-desc">Pensado pra ser operado pelo porteiro, mas você acompanha tudo do seu painel.</p>
              <ul className="plain">
                <li><strong>Liberação de visitantes:</strong> o morador gera um código de 6 dígitos (ou QR Code) com validade de 24h; o porteiro digita ou escaneia pra liberar.</li>
                <li><strong>Livro de Plantão:</strong> troca de turno registrada e assinada digitalmente por quem está de plantão.</li>
                <li><strong>Botão de Pânico:</strong> se o porteiro aciona, aparece um alerta vermelho piscando no seu painel até você marcar como resolvido.</li>
              </ul>
              <div className="shot">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/apresentacao/portaria.png" alt="Tela da Portaria" />
                <div className="shot-cap">Tela da Portaria — livro de plantão e liberação de visitantes</div>
              </div>
            </section>

            <section className="block" id="ocorrencias">
              <div className="block-head"><span className="block-num">07</span><h2 className="block-title">Ocorrências e reservas</h2></div>
              <p className="block-desc">O morador registra um relato (barulho, vazamento, reclamação); a IA resume automaticamente pra você bater o olho rápido e responder.</p>
              <p className="block-desc">Reservas de áreas comuns (salão, churrasqueira, academia) já bloqueiam automaticamente conflito de horário — duas famílias não conseguem reservar o mesmo espaço na mesma hora, nem manualmente nem pela IA.</p>
              <div className="shot">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/apresentacao/reservas.png" alt="Tela de Reservas" />
                <div className="shot-cap">Reservas — bloqueio automático de conflito de horário</div>
              </div>
            </section>

            <section className="block" id="ia">
              <div className="block-head"><span className="block-num">08</span><h2 className="block-title">Assistente executivo (IA)</h2></div>
              <p className="block-desc">No seu painel, pergunte em português normal — por exemplo:</p>
              <ul className="plain">
                <li><em>&quot;Resuma as prioridades da semana&quot;</em></li>
                <li><em>&quot;Tem algum alerta urgente agora?&quot;</em></li>
                <li><em>&quot;Quantas ocorrências estão em aberto?&quot;</em></li>
              </ul>
              <p className="block-desc">A resposta é baseada nos dados reais do seu condomínio no momento da pergunta — ocorrências, alertas de pânico e encomendas pendentes — não é um texto genérico.</p>
              <div className="callout tip">
                <span className="ic">✓</span>
                <p><strong>Limite diário:</strong> 10 perguntas por dia por usuário, somando os 3 pontos de IA do sistema (assistente executivo, reservas e resumo de ocorrências). Passou disso, tenta de novo amanhã.</p>
              </div>
            </section>

            <section className="block" id="instalar">
              <div className="block-head"><span className="block-num">09</span><h2 className="block-title">Instalar no celular</h2></div>
              <p className="block-desc">O CondoManage funciona como um aplicativo, sem precisar de loja de app.</p>
              <ol className="steps">
                <li><strong>Abra o site pelo navegador do celular</strong><div className="step-body">Chrome (Android) ou Safari (iPhone).</div></li>
                <li><strong>Toque em &quot;Adicionar à tela inicial&quot;</strong><div className="step-body">No menu do navegador — o ícone do CondoManage aparece junto com seus outros apps.</div></li>
              </ol>
              <div className="shot" style={{ maxWidth: 280 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/apresentacao/mobile-menu.png" alt="Menu mobile" />
                <div className="shot-cap">Navegação em tela de celular</div>
              </div>
            </section>

            <section className="block" id="duvidas">
              <div className="block-head"><span className="block-num">10</span><h2 className="block-title">Dúvidas comuns</h2></div>
              <div className="faq">
                <h4>Posso administrar mais de um condomínio com a mesma conta?</h4>
                <p>Sim, se sua conta tiver vínculo com mais de um prédio. Use o seletor &quot;🏢 Prédios SaaS&quot; no painel pra trocar o condomínio ativo.</p>
              </div>
              <div className="faq">
                <h4>Um morador pode ver dados de outro condomínio por engano?</h4>
                <p>Não — o isolamento é garantido no nível do banco de dados e da sessão, não só na tela. Cada conta só acessa o próprio condomínio.</p>
              </div>
              <div className="faq">
                <h4>O que fazer se eu excluir algo por engano (usuário, reserva, enquete)?</h4>
                <p>A exclusão não é definitiva no banco — fale com o suporte técnico pra reverter. Ainda não existe um botão de &quot;desfazer&quot; na própria tela.</p>
              </div>
              <div className="faq">
                <h4>O que faço se uma notificação por e-mail não chegou?</h4>
                <p>Confirme com o suporte se o domínio de envio já está totalmente configurado pro seu condomínio — isso pode variar conforme a fase de implantação.</p>
              </div>
            </section>

            <footer className="end">CondoManage — guia de início para síndicos. Em caso de dúvida não coberta aqui, procure o suporte técnico do sistema.</footer>
          </main>
        </div>
      </div>
    </>
  );
}
