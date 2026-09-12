# E-Ticaret Sitesi + Yönetim Paneli

Next.js 16 (App Router) ile yazılmış, butik kadın giyim mağazası tasarımında bir e-ticaret
sitesi ve yönetim paneli.

- **Mağaza:** kayan duyuru bandı, açılır menülü header, video/görsel slider, kampanya ve
  kategori bannerları, "Sepetteki Fiyat" gösterimli ürün kartları, kategori/filtre/sıralama,
  ürün detay (galeri, beden seçimi, Hemen Al, WhatsApp ile sipariş), sepet çekmecesi, ödeme,
  sipariş takip, favoriler, üyelik, yorumlar, e-bülten, mobil alt menü.
- **Yönetim paneli (`/admin`):** özet, siparişler (durum, kargo takip no, iptalde stok iadesi),
  ürünler (görsel yükleme, beden/stok), kategoriler, bannerlar, yorum onayı, içerik sayfaları,
  müşteriler, bülten aboneleri (CSV), ayarlar (sepet indirimi, kargo, ödeme yöntemleri, IBAN,
  iletişim).

## Kurulum

Gereksinim: PostgreSQL 14+ (yerelde Homebrew `postgresql@14` veya Docker).

```bash
bun install
createdb ecommerce_web      # boş bir veritabanı oluşturun
cp .env.example .env        # DATABASE_URL ve yönetici e-posta/şifresini düzenleyin
bun run setup               # tabloları oluşturur + örnek verileri yükler
bun run dev
```

- Mağaza: http://localhost:3000
- Yönetim paneli: http://localhost:3000/admin
  (`.env` yoksa varsayılan giriş `admin@example.com` / `admin123` — **ilk girişte Ayarlar
  sayfasından şifreyi değiştirin**)

## Komutlar

| Komut | Açıklama |
|---|---|
| `bun run dev` | Geliştirme sunucusu |
| `bun run build && bun run start` | Üretim derlemesi ve sunucu |
| `bun run db:push` | Şema değişikliklerini veritabanına doğrudan uygular (geliştirme) |
| `bun run db:generate` / `bun run db:migrate` | Şema değişikliğinden SQL migration üretir / canlı veritabanına uygular |
| `bun run db:seed` | Veritabanı boşsa örnek katalog + yönetici oluşturur |
| `bun run db:reset` | Katalog ve siparişleri silip örnek verileri yeniden yükler |
| `bun run db:studio` | Veritabanını tarayıcıda görüntüleme (Drizzle Studio) |
| `bun run typecheck` / `bun run lint` | Tip kontrolü / lint |

## Yapı

```
app/(shop)/        Mağaza sayfaları (anasayfa, kategori, ürün, sepet, ödeme, hesap...)
app/admin/         Yönetim paneli (giris + (panel) altındaki tüm sayfalar)
app/api/admin/     Görsel yükleme ve CSV dışa aktarma
app/uploads/       Yüklenen dosyaları servis eder (storage/uploads)
components/shop/   Mağaza bileşenleri
components/admin/  Panel bileşenleri
lib/db/            Drizzle şeması ve bağlantı (PostgreSQL / node-postgres)
lib/actions/       Server Action'lar (shop.ts: sipariş/üyelik, admin.ts: panel işlemleri)
proxy.ts           /admin ve /hesabim için oturum yönlendirmesi
scripts/seed.ts    Örnek veri
```

Tüm tutarlar veritabanında **kuruş** cinsinden tamsayı olarak tutulur. Sipariş sırasında
fiyat ve stok her zaman sunucuda yeniden hesaplanır; stok düşümü transaction içinde satır
kilidiyle yapılır, sipariş numaraları (100001, 100002…) PostgreSQL identity sütunuyla üretilir.

## Canlıya almadan önce

1. **Örnek içerikleri değiştirin:** ürünler/görseller (Unsplash örnekleri), "(Örnek yorum)"
   yorumları, logo yazısı ve iletişim bilgileri (Ayarlar), IBAN bilgileri.
2. **Yasal metinler:** Mesafeli Satış Sözleşmesi, Ön Bilgilendirme, KVKK/Gizlilik ve İade
   Koşulları sayfalarını bir hukukçuyla hazırlayıp Sayfalar menüsünden girin.
3. **Kredi kartı ile ödeme:** şu an Havale/EFT ve Kapıda Ödeme aktiftir. Kartlı ödeme için
   iyzico / PayTR gibi bir sanal POS sözleşmesi gerekir; API anahtarları alındığında ödeme
   adımı `lib/actions/shop.ts` → `placeOrder` içine eklenebilir.
4. **Barındırma:** Veritabanı olarak herhangi bir yönetilen PostgreSQL (Neon, Supabase,
   Railway, DigitalOcean vb.) kullanılabilir; `DATABASE_URL`'i ayarlayıp `bun run db:migrate`
   (veya ilk kurulumda `bun run setup`) çalıştırın. Yüklenen görseller `storage/uploads/`
   klasöründedir; kalıcı diski olan bir sunucu (VPS, Railway, Render) en basit seçenektir,
   Vercel gibi sunucusuz ortamlarda görseller için nesne depolama (S3/R2/Vercel Blob) gerekir.
5. `NEXT_PUBLIC_SITE_URL` değişkenini gerçek alan adınızla ayarlayın ve HTTPS kullanın.
