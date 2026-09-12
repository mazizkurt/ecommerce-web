import { createHmac, randomBytes } from "node:crypto";
import {
  type PaymentOrder,
  type PaymentProvider,
  type ProviderConfig,
  splitOrderAmounts,
  toDecimal,
} from "./types";

const BASE_URLS: Record<string, string> = {
  sandbox: "https://sandbox-api.iyzipay.com",
  live: "https://api.iyzipay.com",
};

type IyzicoResponse = Record<string, unknown> & {
  status?: string;
  errorCode?: string;
  errorMessage?: string;
};

/** iyzico HMACSHA256 (IYZWSv2) kimlik doğrulamasıyla istek gönderir. */
async function request(config: ProviderConfig, path: string, body: object): Promise<IyzicoResponse> {
  const randomKey = `${Date.now()}${randomBytes(6).toString("hex")}`;
  const json = JSON.stringify(body);
  const signature = createHmac("sha256", config.secretKey)
    .update(randomKey + path + json)
    .digest("hex");
  const authorization = Buffer.from(
    `apiKey:${config.apiKey}&randomKey:${randomKey}&signature:${signature}`,
  ).toString("base64");

  const res = await fetch((BASE_URLS[config.mode] ?? BASE_URLS.sandbox) + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `IYZWSv2 ${authorization}`,
      "x-iyzi-rnd": randomKey,
    },
    body: json,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  try {
    return (await res.json()) as IyzicoResponse;
  } catch {
    return { status: "failure", errorMessage: `iyzico HTTP ${res.status}` };
  }
}

const errorText = (r: IyzicoResponse) =>
  r.errorMessage ? `${r.errorMessage}${r.errorCode ? ` (${r.errorCode})` : ""}` : "Bilinmeyen hata";

const gsm = (phone: string) => `+90${phone.replace(/\D/g, "").slice(-10)}`;

const formatDate = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");

function installments(config: ProviderConfig) {
  const list = (config.installments || "1")
    .split(",")
    .map((x) => Number.parseInt(x.trim(), 10))
    .filter((n) => [1, 2, 3, 4, 6, 9, 12].includes(n));
  return list.length ? [...new Set(list)] : [1];
}

function buyerAndAddresses(order: PaymentOrder, ip: string) {
  const contactName = `${order.firstName} ${order.lastName}`;
  const address = `${order.address} ${order.district}`;
  const addr = { contactName, city: order.city, country: "Turkey", address };
  return {
    buyer: {
      id: order.userId ? `u${order.userId}` : `g${order.orderNo}`,
      name: order.firstName,
      surname: order.lastName,
      gsmNumber: gsm(order.phone),
      email: order.email,
      // TC kimlik no toplanmadığında iyzico'nun kabul ettiği varsayılan değer.
      identityNumber: "11111111111",
      registrationAddress: address,
      registrationDate: formatDate(order.createdAt),
      lastLoginDate: formatDate(new Date()),
      ip,
      city: order.city,
      country: "Turkey",
    },
    shippingAddress: addr,
    billingAddress: addr,
  };
}

export const iyzico: PaymentProvider = {
  id: "iyzico",
  name: "iyzico",
  defaultTitle: "Kredi / Banka Kartı",
  defaultDescription:
    "Kart bilgilerinizi iyzico güvenli ödeme sayfasında girersiniz; taksit seçenekleri ödeme sırasında gösterilir.",
  adminHelp:
    "API anahtarlarını iyzico üye işyeri panelinden (Ayarlar → Firma Ayarları) alın. Test için sandbox-merchant.iyzipay.com üzerinden ücretsiz sandbox hesabı açabilirsiniz.",
  fields: [
    {
      key: "mode",
      label: "Ortam",
      type: "select",
      options: [
        { value: "sandbox", label: "Test (sandbox)" },
        { value: "live", label: "Canlı" },
      ],
      defaultValue: "sandbox",
    },
    { key: "apiKey", label: "API Anahtarı", type: "secret", required: true },
    { key: "secretKey", label: "Güvenlik Anahtarı (Secret Key)", type: "secret", required: true },
    {
      key: "installments",
      label: "Taksit seçenekleri",
      type: "text",
      placeholder: "1,2,3,6,9",
      hint: "Virgülle ayırın. Sadece peşin için 1 yazın. (1, 2, 3, 4, 6, 9, 12)",
      defaultValue: "1,2,3,6,9",
    },
  ],

  isConfigured: (config) => !!config.apiKey && !!config.secretKey,

  async initialize({ order, config, callbackUrl, ip }) {
    const split = splitOrderAmounts(order);
    const basketItems = [
      ...split.products.map((p) => ({
        id: p.id,
        name: p.name.slice(0, 100),
        category1: "Giyim",
        itemType: "PHYSICAL",
        price: toDecimal(p.amount),
      })),
      ...(split.shipping > 0
        ? [{ id: "kargo", name: "Kargo Ücreti", category1: "Kargo", itemType: "VIRTUAL", price: toDecimal(split.shipping) }]
        : []),
      ...(split.fee > 0
        ? [{ id: "hizmet", name: "Hizmet Bedeli", category1: "Hizmet", itemType: "VIRTUAL", price: toDecimal(split.fee) }]
        : []),
    ];

    const res = await request(config, "/payment/iyzipos/checkoutform/initialize/auth/ecom", {
      locale: "tr",
      conversationId: order.token,
      price: toDecimal(order.total),
      paidPrice: toDecimal(order.total),
      currency: "TRY",
      basketId: String(order.orderNo),
      paymentGroup: "PRODUCT",
      callbackUrl,
      enabledInstallments: installments(config),
      ...buyerAndAddresses(order, ip),
      basketItems,
    });

    if (res.status !== "success" || typeof res.paymentPageUrl !== "string") {
      return { ok: false, message: `Ödeme başlatılamadı: ${errorText(res)}` };
    }
    return { ok: true, redirectUrl: res.paymentPageUrl, reference: String(res.token) };
  },

  async verify({ order, config, params }) {
    const token = params.token;
    if (!token || token !== order.paymentRef) {
      return { status: "invalid", message: "Geçersiz ödeme bildirimi." };
    }
    const res = await request(config, "/payment/iyzipos/checkoutform/auth/ecom/detail", {
      locale: "tr",
      conversationId: order.token,
      token,
    });
    const data = {
      paymentStatus: res.paymentStatus,
      paymentId: res.paymentId,
      fraudStatus: res.fraudStatus,
      price: res.price,
      paidPrice: res.paidPrice,
      installment: res.installment,
      cardAssociation: res.cardAssociation,
      cardFamily: res.cardFamily,
      binNumber: res.binNumber,
      lastFourDigits: res.lastFourDigits,
      errorMessage: res.errorMessage,
    };

    if (res.status !== "success" || res.paymentStatus !== "SUCCESS") {
      return { status: "failed", message: res.errorMessage ? String(res.errorMessage) : "Ödeme tamamlanamadı.", data };
    }
    // Tutar ve sepet numarası siparişle birebir eşleşmeli.
    if (res.basketId !== String(order.orderNo) || Math.round(Number(res.price) * 100) !== order.total) {
      return { status: "failed", message: "Ödeme tutarı siparişle eşleşmiyor.", data };
    }
    const paymentId = String(res.paymentId ?? "");
    const installment = Number(res.installment) || 1;
    if (Number(res.fraudStatus) === -1) {
      return { status: "failed", message: "Ödeme iyzico tarafından reddedildi.", data };
    }
    if (Number(res.fraudStatus) === 0) {
      return { status: "review", paymentId, message: "Ödeme iyzico güvenlik incelemesinde.", data };
    }
    return { status: "paid", paymentId, installment, data };
  },

  async refund({ order, config, amount, ip }) {
    if (!order.paymentId) return { ok: false, message: "Bu siparişte iyzico ödeme numarası yok." };
    // Aynı gün tam iptal (bankaya hiç yansımaz); olmazsa iade.
    if (amount >= order.total) {
      const cancel = await request(config, "/payment/cancel", {
        locale: "tr",
        conversationId: order.token,
        paymentId: order.paymentId,
        ip,
      });
      if (cancel.status === "success") return { ok: true, message: "Ödeme iyzico üzerinden iptal edildi." };
    }
    const refund = await request(config, "/v2/payment/refund", {
      locale: "tr",
      conversationId: order.token,
      paymentId: order.paymentId,
      price: toDecimal(amount),
      currency: "TRY",
      ip,
    });
    if (refund.status === "success") {
      return { ok: true, message: `${toDecimal(amount)} TL iyzico üzerinden iade edildi.` };
    }
    return { ok: false, message: `İade başarısız: ${errorText(refund)}` };
  },
};
