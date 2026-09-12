import type { PaymentProvider } from "./types";

/**
 * Yalnızca geliştirme ortamında görünen sahte sağlayıcı: gerçek para çekmeden
 * kartlı ödeme akışını (yönlendirme → geri dönüş → sipariş onayı) denemeye yarar.
 */
export const testProvider: PaymentProvider = {
  id: "test",
  name: "Test Ödeme (yalnızca geliştirme)",
  defaultTitle: "Test Ödeme",
  defaultDescription: "Gerçek ödeme alınmaz; başarılı/başarısız sonucu seçebileceğiniz bir test sayfasına gidersiniz.",
  adminHelp: "Canlı ortamda (NODE_ENV=production) bu sağlayıcı otomatik olarak gizlenir.",
  fields: [],
  isConfigured: () => true,

  async initialize({ order }) {
    const reference = `test_${order.token}`;
    return {
      ok: true,
      reference,
      redirectUrl: `/odeme/test-odeme?order=${order.token}&ref=${reference}`,
    };
  },

  async verify({ order, params }) {
    if (!params.ref || params.ref !== order.paymentRef) {
      return { status: "invalid", message: "Geçersiz referans." };
    }
    if (params.result === "success") {
      return { status: "paid", paymentId: `TEST-${order.orderNo}`, installment: 1, data: { test: true } };
    }
    return { status: "failed", message: "Test ödemesi başarısız olarak işaretlendi." };
  },

  async refund() {
    return { ok: true, message: "Test ödemesi iade edildi." };
  },
};
