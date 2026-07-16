import { NextResponse } from "next/server";
import { validarAssinaturaWebhook, consultarOrder } from "../../../../lib/mercadopago";
import { marcarBoletoPagoPorOrderId } from "../../../../lib/store/financeiroDb";

// Endpoint público (sem sessão) chamado pelo próprio Mercado Pago quando o status de um
// pedido muda — é a única forma legítima de marcar um boleto como PAGO automaticamente
// (a marcação manual via UI virou exclusiva do síndico, ver .../[id]/pagar/route.ts).
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const dataId = url.searchParams.get("data.id");
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    const body = await req.json().catch(() => ({}));

    // Notificações de outros tópicos (ex: "payment" legado) não nos interessam aqui —
    // só tratamos "order", que é o tópico da API de Orders usada nesta integração.
    if (body.type && body.type !== "order") {
      return NextResponse.json({ recebido: true });
    }

    const idPedido = dataId || body.data?.id;
    if (!idPedido) {
      return NextResponse.json({ erro: "Notificação sem id de pedido." }, { status: 400 });
    }

    // Nunca confia no payload da notificação por si só — valida a assinatura antes de
    // fazer qualquer coisa. Sem MERCADOPAGO_WEBHOOK_SECRET configurado, falha fechado
    // (rejeita), nunca marca nada como pago sem poder confirmar que veio do Mercado Pago.
    const assinaturaValida = validarAssinaturaWebhook(xSignature, xRequestId, idPedido);
    if (!assinaturaValida) {
      console.error("Webhook Mercado Pago: assinatura inválida ou ausente.");
      return NextResponse.json({ erro: "Assinatura inválida." }, { status: 401 });
    }

    // Mesmo com assinatura válida, não confia no "status" que a notificação eventualmente
    // carregue — busca o status real e atual direto na API antes de dar baixa.
    const statusReal = await consultarOrder(idPedido);

    if (statusReal.status === "processed") {
      const boletoId = await marcarBoletoPagoPorOrderId(idPedido);
      if (boletoId) {
        console.log(`Boleto ${boletoId} marcado como PAGO via webhook Mercado Pago (pedido ${idPedido}).`);
      }
    }

    return NextResponse.json({ recebido: true });
  } catch (erro: unknown) {
    console.error("Erro ao processar webhook do Mercado Pago:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao processar notificação: " + msg }, { status: 500 });
  }
}
