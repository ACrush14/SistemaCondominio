import crypto from "crypto";

const API_BASE = "https://api.mercadopago.com";

function obterAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  }
  return token;
}

export interface CobrancaPix {
  orderId: string;
  pixCopiaCola: string;
  status: string;
}

// Cria uma cobrança PIX real via API de Orders do Mercado Pago (Checkout Transparente).
// Retorna o id do pedido (pra rastrear no webhook) e o código copia-e-cola de verdade.
export async function criarCobrancaPix(params: {
  valor: number;
  referenciaExterna: string;
  emailPagador: string;
}): Promise<CobrancaPix> {
  const accessToken = obterAccessToken();
  const valorFormatado = params.valor.toFixed(2);

  const resposta = await fetch(`${API_BASE}/v1/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `${params.referenciaExterna}-${Date.now()}`,
    },
    body: JSON.stringify({
      type: "online",
      total_amount: valorFormatado,
      external_reference: params.referenciaExterna,
      processing_mode: "automatic",
      transactions: {
        payments: [
          {
            amount: valorFormatado,
            payment_method: { id: "pix", type: "bank_transfer" },
            expiration_time: "P3D",
          },
        ],
      },
      payer: { email: params.emailPagador },
    }),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      `Erro ao criar cobrança PIX no Mercado Pago: ${dados.message || JSON.stringify(dados)}`
    );
  }

  const pagamento = dados.transactions?.payments?.[0];
  const pixCopiaCola = pagamento?.payment_method?.qr_code;

  if (!pixCopiaCola) {
    throw new Error("Mercado Pago não retornou o código PIX (qr_code) na resposta.");
  }

  return {
    orderId: dados.id,
    pixCopiaCola,
    status: dados.status,
  };
}

export interface StatusOrder {
  status: string;
  statusDetail: string | null;
}

// Consulta o status atual de um pedido — usado pelo webhook pra confirmar o pagamento
// antes de marcar o boleto como PAGO (nunca confia só no payload da notificação).
export async function consultarOrder(orderId: string): Promise<StatusOrder> {
  const accessToken = obterAccessToken();

  const resposta = await fetch(`${API_BASE}/v1/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(`Erro ao consultar pedido ${orderId} no Mercado Pago: ${dados.message || JSON.stringify(dados)}`);
  }

  return {
    status: dados.status,
    statusDetail: dados.transactions?.payments?.[0]?.status_detail ?? null,
  };
}

// Valida a assinatura x-signature de uma notificação de webhook do Mercado Pago.
// Algoritmo documentado: manifest = "id:{dataId em minúsculas};request-id:{x-request-id};ts:{ts};",
// assinado com HMAC-SHA256 usando o segredo do webhook, comparado com o valor v1 do header.
export function validarAssinaturaWebhook(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string | null
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("MERCADOPAGO_WEBHOOK_SECRET não configurado.");
  }
  if (!xSignature || !xRequestId || !dataId) {
    return false;
  }

  const partes = Object.fromEntries(
    xSignature.split(",").map((parte) => {
      const [chave, valor] = parte.split("=");
      return [chave.trim(), (valor || "").trim()];
    })
  );
  const ts = partes.ts;
  const v1Recebido = partes.v1;
  if (!ts || !v1Recebido) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const v1Calculado = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  // Comparação em tempo constante — evita vazar informação por timing attack.
  const bufRecebido = Buffer.from(v1Recebido, "hex");
  const bufCalculado = Buffer.from(v1Calculado, "hex");
  if (bufRecebido.length !== bufCalculado.length) return false;
  return crypto.timingSafeEqual(bufRecebido, bufCalculado);
}
