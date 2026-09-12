import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import type { orderItems, orders } from "@/lib/db/schema";
import { formatDate, formatPrice } from "@/lib/format";
import { type Settings, siteUrlFrom } from "@/lib/settings";

export type OrderWithItems = typeof orders.$inferSelect & {
  items: (typeof orderItems.$inferSelect)[];
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const HEX = /^#[0-9a-fA-F]{6}$/;

function layout(s: Settings, heading: string, content: string) {
  const base = siteUrlFrom(s);
  const logoSrc = s.logoUrl ? (s.logoUrl.startsWith("http") ? s.logoUrl : `${base}${s.logoUrl}`) : "";
  const logo = logoSrc
    ? `<img src="${esc(logoSrc)}" alt="${esc(s.storeName)}" style="max-height:48px;border:0">`
    : `<span style="font-family:Georgia,'Times New Roman',serif;font-size:28px;letter-spacing:5px;color:#000">${esc(s.logoText)}</span>`;
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#111">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff">
<tr><td style="padding:28px;text-align:center;border-bottom:1px solid #eeeeee"><a href="${esc(base)}" style="text-decoration:none">${logo}</a></td></tr>
<tr><td style="padding:28px;font-size:14px;line-height:1.6"><h1 style="font-size:20px;font-weight:bold;margin:0 0 16px">${esc(heading)}</h1>${content}</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid #eeeeee;font-size:12px;color:#777777;text-align:center">${esc(s.storeName)}${s.phone ? ` · ${esc(s.phone)}` : ""}${s.email ? ` · ${esc(s.email)}` : ""}</td></tr>
</table></td></tr></table></body></html>`;
}

function button(s: Settings, href: string, label: string) {
  const bg = HEX.test(s.colorPrimary) ? s.colorPrimary : "#000000";
  const fg = HEX.test(s.colorPrimaryText) ? s.colorPrimaryText : "#ffffff";
  return `<p style="margin:24px 0"><a href="${esc(href)}" style="display:inline-block;background:${bg};color:${fg};padding:12px 24px;text-decoration:none;font-weight:bold;font-size:14px">${esc(label)}</a></p>`;
}

function orderTable(order: OrderWithItems) {
  const rows = order.items
    .map(
      (i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${esc(i.name)}<br><span style="color:#777;font-size:12px">Beden: ${esc(i.size)} · ${i.quantity} adet</span></td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${formatPrice(i.unitPrice * i.quantity)}</td></tr>`,
    )
    .join("");
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:4px 0;${bold ? "font-weight:bold;font-size:15px" : "color:#555"}">${label}</td><td style="padding:4px 0;text-align:right;${bold ? "font-weight:bold;font-size:15px" : ""}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:16px 0">${rows}
${line("Ara Toplam", formatPrice(order.subtotal))}
${order.discount > 0 ? line("Sepet İndirimi", `-${formatPrice(order.discount)}`) : ""}
${order.couponDiscount > 0 ? line(`Kupon (${esc(order.couponCode)})`, `-${formatPrice(order.couponDiscount)}`) : ""}
${line("Kargo", order.shippingFee ? formatPrice(order.shippingFee) : "Ücretsiz")}
${order.paymentFee > 0 ? line("Kapıda Ödeme Bedeli", formatPrice(order.paymentFee)) : ""}
${line("Toplam", formatPrice(order.total), true)}</table>`;
}

function address(order: OrderWithItems) {
  return `<p style="margin:0;color:#555">${esc(order.firstName)} ${esc(order.lastName)}<br>${esc(order.address)}<br>${esc(order.district)} / ${esc(order.city)}<br>${esc(order.phone)}</p>`;
}

const orderLink = (s: Settings, o: OrderWithItems) => `${siteUrlFrom(s)}/siparis/${o.token}`;

export function orderReceivedEmail(s: Settings, o: OrderWithItems) {
  const bank =
    o.paymentMethod === "bank_transfer" && o.paymentStatus === "pending" && s.iban
      ? `<div style="border:1px solid #111;padding:14px;margin:16px 0"><b>Havale / EFT Bilgileri</b><br>Banka: ${esc(s.bankName || "-")}<br>Alıcı: ${esc(s.accountHolder || "-")}<br>IBAN: <span style="font-family:monospace">${esc(s.iban)}</span><br>Tutar: <b>${formatPrice(o.total)}</b><br><span style="color:#555;font-size:12px">Açıklama kısmına sipariş numaranızı (#${o.orderNo}) yazmayı unutmayın.</span></div>`
      : "";
  const paid = o.paymentStatus === "paid" ? `<p>Ödemeniz başarıyla alındı.</p>` : "";
  return {
    subject: `Siparişiniz alındı - #${o.orderNo}`,
    html: layout(
      s,
      `Teşekkürler ${o.firstName}, siparişiniz alındı!`,
      `<p>#${o.orderNo} numaralı siparişiniz ${formatDate(o.createdAt)} tarihinde oluşturuldu. Ödeme yöntemi: ${PAYMENT_METHOD_LABELS[o.paymentMethod]}.</p>${paid}${bank}${orderTable(o)}<p style="margin:16px 0 4px;font-weight:bold">Teslimat adresi</p>${address(o)}${button(s, orderLink(s, o), "Siparişimi Görüntüle")}`,
    ),
  };
}

export function newOrderAdminEmail(s: Settings, o: OrderWithItems) {
  return {
    subject: `Yeni sipariş #${o.orderNo} - ${formatPrice(o.total)}`,
    html: layout(
      s,
      `Yeni sipariş: #${o.orderNo}`,
      `<p>${esc(o.firstName)} ${esc(o.lastName)} (${esc(o.email)}) yeni bir sipariş verdi. Ödeme: ${PAYMENT_METHOD_LABELS[o.paymentMethod]}${o.paymentStatus === "paid" ? " (ödendi)" : ""}.</p>${o.note ? `<p style="background:#fff8e1;padding:10px">Müşteri notu: ${esc(o.note)}</p>` : ""}${orderTable(o)}${address(o)}${button(s, `${siteUrlFrom(s)}/admin/siparisler/${o.id}`, "Panelde Aç")}`,
    ),
  };
}

export function orderShippedEmail(s: Settings, o: OrderWithItems) {
  const tracking = o.trackingNo
    ? `<p style="background:#f4f4f4;padding:12px">Kargo firması: <b>${esc(o.cargoCompany || "-")}</b><br>Takip numarası: <b>${esc(o.trackingNo)}</b></p>`
    : "";
  return {
    subject: `Siparişiniz kargoya verildi - #${o.orderNo}`,
    html: layout(s, "Siparişiniz yola çıktı!", `<p>Merhaba ${esc(o.firstName)}, #${o.orderNo} numaralı siparişiniz kargoya verildi.</p>${tracking}${button(s, orderLink(s, o), "Siparişimi Takip Et")}`),
  };
}

export function orderDeliveredEmail(s: Settings, o: OrderWithItems) {
  return {
    subject: `Siparişiniz teslim edildi - #${o.orderNo}`,
    html: layout(s, "Siparişiniz teslim edildi", `<p>Merhaba ${esc(o.firstName)}, #${o.orderNo} numaralı siparişiniz teslim edildi. Bizi tercih ettiğiniz için teşekkür ederiz! Ürünlerimizi değerlendirmeyi unutmayın.</p>${button(s, siteUrlFrom(s), "Alışverişe Devam Et")}`),
  };
}

export function orderCancelledEmail(s: Settings, o: OrderWithItems) {
  return {
    subject: `Siparişiniz iptal edildi - #${o.orderNo}`,
    html: layout(s, "Siparişiniz iptal edildi", `<p>Merhaba ${esc(o.firstName)}, #${o.orderNo} numaralı siparişiniz iptal edildi.${o.paymentStatus === "paid" || o.paymentStatus === "refunded" ? " Ödemeniz varsa iadesi bankanıza bağlı olarak birkaç iş günü içinde hesabınıza yansır." : ""}</p><p>Sorularınız için bize ulaşabilirsiniz.</p>${button(s, orderLink(s, o), "Sipariş Detayı")}`),
  };
}

export function paymentReceivedEmail(s: Settings, o: OrderWithItems) {
  return {
    subject: `Ödemeniz onaylandı - #${o.orderNo}`,
    html: layout(s, "Ödemeniz onaylandı", `<p>Merhaba ${esc(o.firstName)}, #${o.orderNo} numaralı siparişinizin ödemesi (${formatPrice(o.total)}) onaylandı. Siparişiniz hazırlanmaya başlıyor.</p>${button(s, orderLink(s, o), "Siparişimi Görüntüle")}`),
  };
}

export function passwordResetEmail(s: Settings, name: string, link: string) {
  return {
    subject: `${s.storeName} - Şifre sıfırlama`,
    html: layout(s, "Şifrenizi sıfırlayın", `<p>Merhaba ${esc(name || "")},</p><p>Hesabınız için şifre sıfırlama talebinde bulunuldu. Yeni şifre belirlemek için aşağıdaki butona tıklayın. Bağlantı 1 saat geçerlidir.</p>${button(s, link, "Yeni Şifre Belirle")}<p style="color:#777;font-size:12px">Bu talebi siz yapmadıysanız bu e-postayı dikkate almayın.</p>`),
  };
}

export function testEmail(s: Settings) {
  return {
    subject: `${s.storeName} - Test e-postası`,
    html: layout(s, "E-posta ayarlarınız çalışıyor 🎉", `<p>Bu e-posta yönetim panelinden gönderilen bir testtir. Sipariş bildirimleri bu ayarlarla gönderilecek.</p>`),
  };
}
