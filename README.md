# E-Ticaret Sitesi + Yönetim Paneli

Next.js 16 (App Router) + PostgreSQL ile yazılmış, butik kadın giyim mağazası tasarımında bir
e-ticaret sitesi ve yönetim paneli.

- **Mağaza:** kayan duyuru bandı, açılır menülü header, video/görsel slider, kampanya ve
  kategori bannerları, "Sepetteki Fiyat" gösterimli ürün kartları, kategori/filtre/sıralama,
  ürün detay (galeri, beden ve renk seçimi, Hemen Al, WhatsApp ile sipariş), sepet çekmecesi,
  kuponlu ödeme, kredi kartı (iyzico) / havale / kapıda ödeme, sipariş takip, favoriler,
  üyelik ve şifre sıfırlama, yorumlar, e-bülten, çerez onayı, mobil alt menü.
- **Yönetim paneli (`/admin`):** özet, siparişler (durum, kargo, düzenleme, elle sipariş,
  iade, silme), ürünler (görseller, beden/stok, renk grupları, SEO, kopyalama), kategoriler,
  kuponlar, bannerlar, yorumlar, sayfalar, müşteriler, bülten aboneleri, ödeme yöntemleri ve
  ayarlar (genel, görünüm, anasayfa, metinler, fiyat & kargo, e-posta, SEO & analitik,
  yöneticiler).

## Kurulum

Gereksinim: Node 20+ ve PostgreSQL 14+.

```bash
bun install
createdb ecommerce_web      # boş bir veritabanı oluşturun
cp .env.example .env        # DATABASE_URL ve yönetici e-posta/şifresini düzenleyin
bun run setup               # tabloları oluşturur + örnek verileri yükler
bun run dev
```

- Mağaza: http://localhost:3000 — Yönetim paneli: http://localhost:3000/admin
- `.env`'de `ADMIN_EMAIL` / `ADMIN_PASSWORD` yoksa ilk yönetici `admin@example.com` / `admin123`
  olur — **ilk girişte Ayarlar → Yöneticiler sayfasından değiştirin.**

## Komutlar

| Komut | Açıklama |
|---|---|
| `bun run dev` | Geliştirme sunucusu |
| `bun run build && bun run start` | Üretim derlemesi ve sunucu |
| `bun run db:push` | Şema değişikliklerini veritabanına doğrudan uygular (geliştirme) |
| `bun run db:generate` / `bun run db:migrate` | Şemadan SQL migration üretir / canlı veritabanına uygular |
| `bun run db:seed` | Veritabanı boşsa örnek katalog + yönetici oluşturur |
| `bun run db:reset` | Katalog ve siparişleri silip örnek verileri yeniden yükler (kullanıcı, ayar, kupon korunur) |
| `bun run db:studio` | Veritabanını tarayıcıda görüntüleme (Drizzle Studio) |
| `bun run typecheck` / `bun run lint` | Tip kontrolü / lint |

## Ödeme sağlayıcıları (kredi kartı)

Ödeme altyapısı sağlayıcı (provider) mimarisindedir: `lib/payments/` altındaki her dosya bir
sağlayıcıdır ve **Panel → Ödeme Yöntemleri** sayfasında ayar formu otomatik oluşur.

**iyzico'yu açmak için:**
1. iyzico üye işyeri panelinden (test için sandbox-merchant.iyzipay.com) API anahtarı ve
   güvenlik anahtarını alın.
2. Panel → Ödeme Yöntemleri → iyzico: anahtarları girin, ortamı seçin (Test/Canlı), taksit
   seçeneklerini yazın ve "Ödeme sayfasında göster"i açın.
3. Canlıda **Ayarlar → Genel → Site adresi**'ni `https://...` olarak girin; iyzico geri dönüş
   adresinin SSL'li olmasını şart koşar.

Akış: sipariş "Ödeme Bekleniyor" durumunda oluşturulur ve stok ayrılır → müşteri iyzico'nun
güvenli ödeme sayfasına gider → dönüşte ödeme iyzico API'sinden **sunucu tarafında doğrulanır**
(tutar ve sipariş numarası eşleşmesi dahil) → sipariş onaylanır ve e-postalar gönderilir.
Ödeme başarısızsa veya 45 dakika içinde tamamlanmazsa sipariş iptal edilir, stok ve kupon
serbest kalır, müşterinin sepeti korunur. Panelden tam/kısmi iade yapılabilir (aynı gün iptal,
sonrasında iade).

Anahtarları panele yazmak istemezseniz ortam değişkeni kullanabilirsiniz:
`IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_MODE` (sandbox/live), `IYZICO_INSTALLMENTS`.

Geliştirme ortamında (NODE_ENV≠production) gerçek para çekmeyen bir **"Test Ödeme"**
sağlayıcısı da görünür; kartlı akışı denemek içindir, canlıda otomatik gizlenir.

**Yeni sağlayıcı eklemek (PayTR, Param, Stripe…):** `lib/payments/types.ts` içindeki
`PaymentProvider` arayüzünü uygulayan bir dosya yazıp `lib/payments/index.ts` listesine
eklemeniz yeterli (`iyzico.ts` örnek alınabilir). Geri dönüş adresi
`/api/payments/<id>/callback` otomatik hazırlanır.

## E-posta bildirimleri

Panel → Ayarlar → E-posta: **Resend** (önerilir) veya **SMTP** (Gmail, Yandex, hosting).
Müşteriye sipariş alındı / ödeme onaylandı / kargoya verildi / teslim edildi / iptal
e-postaları, size yeni sipariş bildirimi ve "şifremi unuttum" e-postaları gönderilir.
Sayfadaki "Test e-postası gönder" ile deneyin; son gönderimler ve hatalar aynı sayfada listelenir.
Gizli değerler ortam değişkeninden de verilebilir: `RESEND_API_KEY`, `SMTP_PASSWORD`.

## Yapı

```
app/(shop)/                Mağaza sayfaları
app/admin/                 Yönetim paneli (giris + (panel) altındaki sayfalar)
app/api/payments/          Ödeme sağlayıcısı geri dönüşleri
app/api/admin/             Görsel yükleme ve CSV dışa aktarma
app/uploads/               Yüklenen dosyaları servis eder (storage/uploads)
app/sitemap.ts, robots.ts  SEO dosyaları
components/shop|admin/     Mağaza / panel bileşenleri
lib/db/                    Drizzle şeması ve bağlantı (PostgreSQL / node-postgres)
lib/actions/               Server Action'lar (mağaza, hesap, panel)
lib/payments/              Ödeme sağlayıcıları (iyzico, test)
lib/email/, notifications  E-posta gönderimi, şablonlar ve bildirimler
lib/settings-shared.ts     Panelden yönetilen tüm ayarlar ve varsayılanları
proxy.ts                   /admin ve /hesabim için oturum yönlendirmesi
scripts/seed.ts            Örnek veri
```

Tüm tutarlar veritabanında **kuruş** cinsinden tamsayı olarak tutulur. Sipariş sırasında fiyat,
kupon ve stok her zaman sunucuda yeniden hesaplanır; stok düşümü transaction içinde satır
kilidiyle yapılır, sipariş numaraları (100001, 100002…) PostgreSQL identity sütunuyla üretilir.

## Canlıya almadan önce

1. **Örnek içerikleri değiştirin:** ürünler/görseller (Unsplash örnekleri), "(Örnek yorum)"
   yorumları, logo ve iletişim bilgileri, IBAN.
2. **Yasal metinler:** Mesafeli Satış Sözleşmesi, Ön Bilgilendirme, KVKK/Gizlilik, Çerez
   Politikası ve İade Koşulları'nı bir hukukçuyla hazırlayıp Sayfalar menüsünden girin.
3. **Ödeme ve e-posta:** iyzico canlı anahtarlarını ve e-posta servisini ayarlayın; test
   e-postası ve küçük tutarlı gerçek bir ödeme ile deneyin.
4. **Barındırma:** Veritabanı olarak yönetilen bir PostgreSQL (Neon, Supabase, Railway…)
   kullanılabilir. Yüklenen görseller `storage/uploads/` klasöründedir; kalıcı diski olan bir
   sunucu (VPS, Railway, Render) en basit seçenektir.
5. Ayarlar → Genel → **Site adresi** ve `.env` içindeki `NEXT_PUBLIC_SITE_URL` alanını gerçek
   alan adınızla doldurun, HTTPS kullanın; Search Console'a `/sitemap.xml` adresini ekleyin.
