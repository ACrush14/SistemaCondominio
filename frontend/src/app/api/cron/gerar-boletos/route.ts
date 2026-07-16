import { NextResponse } from "next/server";
import { pool } from "../../../../lib/store/db";
import { garantirTabelaCondominios } from "../../../../lib/store/condominiosDb";
import { garantirTabelaFinanceiro, gerarPixParaBoleto } from "../../../../lib/store/financeiroDb";

export async function GET(req: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json(
        { erro: "Variável de ambiente CRON_SECRET não está configurada no servidor." },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
    }

    await garantirTabelaCondominios();
    await garantirTabelaFinanceiro();

    const condominiosRes = await pool.query("SELECT id, nome FROM condominios");
    const condominios = condominiosRes.rows;

    const hoje = new Date();
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    const competencia = `${meses[hoje.getMonth()]}/${hoje.getFullYear()}`;
    const anoMesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

    let anoVenc = hoje.getFullYear();
    let mesVenc = hoje.getMonth();
    if (hoje.getDate() > 10) {
      mesVenc += 1;
      if (mesVenc > 11) {
        mesVenc = 0;
        anoVenc += 1;
      }
    }
    const mesPad = String(mesVenc + 1).padStart(2, "0");
    const dataVencimento = `${anoVenc}-${mesPad}-10`;

    let criadosCount = 0;
    let existiamCount = 0;

    for (const cond of condominios) {
      const condId = Number(cond.id);
      const usuariosRes = await pool.query(
        `SELECT DISTINCT unidade, condominio_id, MIN(id) as usuario_id
         FROM usuarios
         WHERE perfil = 'MORADOR'
           AND status = 'ATIVO'
           AND unidade IS NOT NULL
           AND unidade != ''
           AND condominio_id = $1
         GROUP BY unidade, condominio_id`,
        [condId]
      );

      for (const u of usuariosRes.rows) {
        const check = await pool.query(
          `SELECT 1 FROM boletos_financeiro
           WHERE condominio_id = $1
             AND unidade = $2
             AND (competencia = $3 OR TO_CHAR(criado_em, 'YYYY-MM') = $4)
           LIMIT 1`,
          [condId, u.unidade, competencia, anoMesAtual]
        );

        if (check.rows.length > 0) {
          existiamCount++;
        } else {
          const valorNum = 850.00;
          const uIdPad = String(u.usuario_id || 1).padStart(4, "0");
          const condIdPad = String(condId).padStart(3, "0");
          const uniqueSuffix = `${condIdPad}${uIdPad}`;
          const codigoBarras = `34191.79001 01043.510047 91020.150008 1 97890000085000-${uniqueSuffix}`;
          const detalhamento = JSON.stringify([
            { item: "Taxa Condominial Ordinária", valor: 680.0 },
            { item: "Fundo de Reserva (10%)", valor: 85.0 },
            { item: "Consumo Individual Água/Gás", valor: 85.0 },
          ]);

          const inserted = await pool.query(
            `INSERT INTO boletos_financeiro (
              unidade, competencia, valor_num, data_vencimento, status,
              codigo_barras, pix_copia_cola, detalhamento, condominio_id
            ) VALUES ($1, $2, $3, $4, 'PENDENTE', $5, '', $6::jsonb, $7)
            RETURNING id`,
            [u.unidade, competencia, valorNum, dataVencimento, codigoBarras, detalhamento, condId]
          );

          const emailRes = await pool.query("SELECT email FROM usuarios WHERE id = $1", [u.usuario_id]);
          const emailPagador = emailRes.rows[0]?.email || `financeiro+condominio${condId}@condomanage.app`;
          await gerarPixParaBoleto(inserted.rows[0].id, valorNum, emailPagador);

          criadosCount++;
        }
      }
    }

    const total = criadosCount + existiamCount;
    return NextResponse.json({
      sucesso: true,
      processados: total,
      criados: criadosCount,
      jaExistiam: existiamCount,
    });
  } catch (erro: unknown) {
    console.error("Erro na cron de gerar boletos:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json(
      { erro: "Erro ao gerar boletos recorrentes: " + msg },
      { status: 500 }
    );
  }
}
