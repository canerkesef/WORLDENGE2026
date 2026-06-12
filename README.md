# Ofis Kupası 2026 — Dünya Kupası Tahmin Yarışması

Şirket içi etkinlik için Next.js + Supabase tabanlı, çok kullanıcılı Dünya
Kupası 2026 tahmin uygulaması. Giriş/kayıt, maç başına skor tahmini, şampiyon
tahmini, otomatik puanlama ve canlı puan tablosu içerir.

## Özellikler

- **Giriş / Kayıt**: E-posta + şifre ile hesap oluşturma (Supabase Auth)
- **Tahminler**: Her maç için skor tahmini (maç başlamadan önce düzenlenebilir)
- **Şampiyon tahmini**: Şampiyon, finalist, 3.lük ve gol kralı tahmini
  (turnuva başlayınca kilitlenir)
- **Otomatik puanlama**: Maç sonucu girildiğinde veritabanı tetikleyicisi
  tüm tahminlerin puanını hesaplar
  - Tam skor tahmini → **5 puan**
  - Doğru sonuç (1 / X / 2) → **2 puan**
  - Yanlış → **0 puan**
- **Puan tablosu**: Canlı sıralama
- **Katılımcılar**: Departmana göre gruplanmış katılımcı listesi
- **Fikstür senkronizasyonu**: API-Football'dan (league=1, season=2026)
  maç ve sonuç verisi otomatik çekilir
- **Yönetim paneli**: Admin kullanıcılar fikstürü senkronize edebilir ve
  maç sonuçlarını manuel düzenleyebilir

## Kurulum

### 1. Supabase projesi oluşturun

1. [supabase.com](https://supabase.com) üzerinde ücretsiz bir proje açın.
2. **SQL Editor**'e gidin, `supabase/schema.sql` dosyasının tüm içeriğini
   yapıştırıp çalıştırın. Bu, tüm tabloları, güvenlik kurallarını (RLS),
   puanlama fonksiyonunu ve tetikleyicileri oluşturur.
3. **Project Settings > API** sayfasından şu üç değeri kopyalayın:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (gizli tutun!)
4. **Authentication > Providers**: Email girişinin açık olduğundan emin
   olun (varsayılan olarak açıktır).
5. **Authentication > URL Configuration**: Site URL'inizi (Vercel
   deploy adresiniz) ekleyin, e-posta onay linklerinin doğru çalışması için.

### 2. API-Football anahtarı alın (fikstür verisi için)

1. [dashboard.api-football.com](https://dashboard.api-football.com) üzerinde
   ücretsiz hesap açın (günlük 100 istek limiti yeterlidir).
2. API anahtarınızı kopyalayıp `API_FOOTBALL_KEY` olarak kullanın.

### 3. Ortam değişkenlerini ayarlayın

`.env.local.example` dosyasını `.env.local` olarak kopyalayın ve değerleri
doldurun:

```bash
cp .env.local.example .env.local
```

`CRON_SECRET` için rastgele bir değer üretin:

```bash
openssl rand -hex 32
```

### 4. Yerel geliştirme

```bash
npm install
npm run dev
```

`http://localhost:3000` adresinde uygulama açılır.

### 5. Vercel'e dağıtım

1. Bu projeyi GitHub'a yükleyin (veya Vercel CLI ile doğrudan deploy edin).
2. [vercel.com](https://vercel.com) üzerinde "New Project" ile reponuzu
   içe aktarın.
3. **Environment Variables** bölümüne `.env.local` içindeki tüm değerleri
   ekleyin (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `API_FOOTBALL_KEY`, `CRON_SECRET`).
4. Deploy edin. `vercel.json` içindeki cron tanımı sayesinde fikstür
   verisi her saat otomatik senkronize edilir.

### 6. Fikstürü ilk kez yükleyin

Deploy tamamlandıktan sonra, ya:

- **Vercel Cron'un ilk çalışmasını bekleyin** (saatlik), veya
- **Manuel tetikleyin**: tarayıcıdan veya bir HTTP istemcisiyle:

```bash
curl -X POST https://SITENIZ.vercel.app/api/sync-fixtures \
  -H "x-cron-secret: CRON_SECRET_DEGERINIZ"
```

Ya da Yönetim panelindeki "Fikstürü Senkronize Et" butonuna basıp
`CRON_SECRET` değerini girin.

### 7. Kendinizi admin yapın

İlk kayıt olduktan sonra, Supabase **SQL Editor**'de şunu çalıştırın
(e-postanızı yazın):

```sql
update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'sizin@sirket.com');
```

Artık `/admin` sayfasına erişebilir, fikstürü senkronize edebilir ve
maç sonuçlarını manuel düzenleyebilirsiniz.

## Puanlama mantığı

`supabase/schema.sql` içindeki `calculate_points` fonksiyonu:

| Tahmin | Puan |
|---|---|
| Tam skor doğru (ör. 2-1 -> 2-1) | 5 |
| Sonuç doğru (1/X/2) ama skor farklı | 2 |
| Sonuç de yanlış | 0 |

Maç sonucu admin panelinden "Bitti" olarak işaretlendiğinde veya
fikstür senkronizasyonu maçı FINISHED durumuna getirdiğinde, veritabanı
tetikleyicisi (trg_match_finished) otomatik olarak o maça ait tüm
tahminlerin puanını hesaplar.

## Klasör yapısı

```
app/
  page.tsx              -> Ana sayfa (hero, yaklaşan maçlar, mini lider tablosu)
  giris/, kayit/        -> Auth sayfaları
  tahminler/            -> Kullanıcının tahmin girdiği sayfa
  puan-tablosu/         -> Genel sıralama
  katilimcilar/         -> Katılımcı listesi
  admin/                -> Yönetim paneli (fikstür sync + sonuç girişi)
  api/sync-fixtures/    -> Manuel senkronizasyon endpoint'i
  api/cron-sync/        -> Vercel Cron tarafından çağrılan endpoint
components/             -> UI bileşenleri (MatchCard, formlar, vb.)
lib/supabase/           -> Supabase client/server/admin/middleware
lib/api-football/       -> API-Football entegrasyonu
supabase/schema.sql     -> Tüm veritabanı şeması (tablolar, RLS, fonksiyonlar)
```

## Tasarım notları

Görsel kimlik, stadyum skor tabelası temasına dayanır: koyu çim yeşili
zemin üzerinde altın/sarı LED rakamlar (mono font), kart kırmızısı vurgu
ve krem renkli "kağıt" zemin sayfa içerikleri için kullanılır.
