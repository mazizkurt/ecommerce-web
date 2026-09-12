import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { notifyOrderPlaced } from "@/lib/notifications";
import { failCardOrder, loadPaymentOrder, markOrderInReview, markOrderPaid } from "@/lib/orders";
import { getProvider, getProviderConfig } from "@/lib/payments";
import type { VerifyResult } from "@/lib/payments/types";

// Ödeme sağlayıcısı müşteriyi (form POST veya GET ile) buraya geri gönderir.
// Sonuç her zaman sağlayıcının API'sinden sunucu tarafında doğrulanır.

const redirectTo = (location: string) =>
  new Response(null, { status: 303, headers: { Location: location } });

async function handle(request: Request, ctx: RouteContext<"/api/payments/[provider]/callback">) {
  const { provider: providerId } = await ctx.params;
  const url = new URL(request.url);
  const params: Record<string, string> = Object.fromEntries(url.searchParams);

  if (request.method === "POST") {
    const type = request.headers.get("content-type") ?? "";
    if (type.includes("application/json")) {
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      for (const [k, v] of Object.entries(body)) if (typeof v === "string") params[k] = v;
    } else {
      const form = await request.formData().catch(() => null);
      form?.forEach((v, k) => {
        if (typeof v === "string") params[k] = v;
      });
    }
  }

  const provider = getProvider(providerId);
  const order = params.order ? await loadPaymentOrder({ token: params.order }) : null;
  if (!provider || !order) return redirectTo("/");

  const orderPage = `/siparis/${order.token}?yeni=1`;

  let result: VerifyResult;
  try {
    result = await provider.verify({ order, config: await getProviderConfig(provider), params });
  } catch (e) {
    console.error(`[payments:${providerId}] verify`, e);
    result = { status: "invalid", message: "Ödeme doğrulanamadı." };
  }

  switch (result.status) {
    case "paid": {
      if (await markOrderPaid(order.id, result)) after(() => notifyOrderPlaced(order.id));
      revalidatePath("/", "layout");
      return redirectTo(orderPage);
    }
    case "review": {
      if (await markOrderInReview(order.id, result)) after(() => notifyOrderPlaced(order.id));
      return redirectTo(orderPage);
    }
    case "failed": {
      await failCardOrder(order.id, result.message, result.data);
      revalidatePath("/", "layout");
      return redirectTo(`/odeme?odeme=basarisiz&mesaj=${encodeURIComponent(result.message)}`);
    }
    default:
      // Geçersiz/eksik bildirim: siparişe dokunma, müşteriyi sipariş sayfasına gönder.
      return redirectTo(`/siparis/${order.token}`);
  }
}

export const GET = handle;
export const POST = handle;
