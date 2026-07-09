# Slick Oil Arena 🛢️

IE101 için çok turlu, canlı liderlik tablolu optimizasyon sınıf yarışması.
Michael Watson'ın (Opex Analytics / LLamasoft) klasik **Slick Oil** oyunundan uyarlanmıştır;
orijinal web versiyonu Rémi Lequette tarafından yazılmıştır: https://slickoilgame.github.io/

## Canlı adresler

| Kime | Adres |
|---|---|
| Öğrenci (QR ile) | https://erbeyoglu.github.io/slickoil-arena/ |
| Hoca paneli (projeksiyon) | https://erbeyoglu.github.io/slickoil-arena/hoca.html |

> Hoca paneli adresini paylaşmayın: tur başlatma/kapatma ve skor sıfırlama yetkisi kimlik doğrulaması istemez.

## Turlar

| Tur | Senaryo | Ağ | Talep | Optimal | Açgözlü tuzağı |
|---|---|---|---|---|---|
| 1 — Kuruluş | Klasik oyun | 6 kuyu × 5 rafineri, 14 hat | 100 | **$690** | $710 (%2.9) |
| 2 — Kriz | Kuyu 6 arızalı, talep ↑ | aynı ağ | 120 | **$920** | $1000 (%8.7) |
| 3 — Büyüme | Yeni saha | 10 kuyu × 8 rafineri, 34 hat | 250 | **$1245** | $1475 (%18.5) |

Tüm optimumlar LP (min-cost flow) ile doğrulanmıştır; akışlar 10'luk adımlarla
seçildiği için optimum oyun içinde erişilebilirdir (transportation polytope'un
tam birimsel yapısı sayesinde).

## Dosyalar

- `index.html` — öğrenci oyunu (telefon öncelikli). QR ile girilir.
- `hoca.html` — projektör paneli: tur başlat/kapat, canlı sıralama, histogram, optimal ifşa, genel klasman.
- `scenarios.js` — senaryo verileri + önceden çözülmüş optimumlar.
- `network.js` — ortak SVG ağ çizici.
- `style.css` — tasarım sistemi.
- `firebase-config.js` — Firebase yapılandırması (istemci tarafı; gizli değil).
- `database.rules.json` — Realtime Database güvenlik kuralları (Console'a yapıştırılan sürümün kaynağı).
- `favicon.svg` — petrol damlası simgesi.

## Kurulum (≈15 dk)

### 1. Firebase

1. https://console.firebase.google.com → **Add project** (Analytics gereksiz).
2. **Build → Realtime Database → Create database** (Belçika/europe-west1 uygun) → test modunda başlatın.
3. **Project settings → Your apps → Web app** ekleyin, çıkan config nesnesini `firebase-config.js` içine kopyalayın.
4. **Rules** sekmesine `database.rules.json` içeriğini yapıştırıp **Publish** deyin.

Kuralların özeti:

| Yol | İzin |
|---|---|
| `state` | Herkes okur ve yazar — hoca paneli tur durumunu buradan sürer. |
| `scores/$round` okuma | Herkes leaderboard'u okur. |
| `scores/$round` yazma | Yalnızca **yeni skor ekleme** ve **silme**. Var olan bir skor değiştirilemez. |
| `.validate` | `name` string ≤ 18 karakter, `cost` pozitif sayı, `timeSec` sayı. |

> **Neden silmeye izin var?** Hoca panelindeki "Skorları sıfırla" butonu `scores/rN`
> düğümünü kaldırır; saf append-only kural (`".write": "!data.exists()"`) bunu da
> engellediği için silme koşulu (`|| !newData.exists()`) eklendi. Bedeli: teoride
> herhangi biri skorları silebilir (değiştiremez). Sınıf içi kullanımda kabul edilebilir
> bir risk. Sıfır risk isteniyorsa bu koşulu kaldırın ve sıfırlamayı Firebase
> Console → Data sekmesinden elle yapın.

> Ders bitince kuralları kapatın (`".write": false`) ya da veritabanını temizleyin.
> Daha sıkı istenirse hoca yazma yetkisi Firebase Auth (e-posta/şifre) ile korunabilir.

### 2. GitHub Pages

1. Public repo: https://github.com/erbeyoglu/slickoil-arena
2. **Settings → Pages → Deploy from branch → main / root** (bu repoda zaten açık).
3. Öğrenci adresi: https://erbeyoglu.github.io/slickoil-arena/ — hoca paneli QR kodu otomatik üretir.
4. Hoca paneli: https://erbeyoglu.github.io/slickoil-arena/hoca.html

Sitede build adımı yoktur: `main`'e push, birkaç dakika içinde yayına çıkar.

## Ders akışı önerisi (~35 dk)

1. **Bağlam (3 dk).** "Bir petrol şirketinin operasyon müdürüsünüz." QR perdede, herkes takma adla girer.
2. **Tur 1 (5 dk).** Serbest deneme. Süre bitince tur otomatik kapanır; histogram + sıralamayı gösterin ama optimumu **henüz açıklamayın**.
3. **Kısa tartışma (3 dk).** "En düşük kaçtı? Daha iyisi var mı? Nereden bileceğiz?" — asıl soru budur.
4. **İfşa 1 (3 dk).** *Optimali göster*: $690 çizgisi histogramda belirir, optimal akış ağı ekrana gelir. 1→B tuzağını anlatın: en ucuz hat ($5) B'nin kıt 40 kapasitesini israf eder.
5. **Tur 2 (4 dk).** "Kuyu 6 patladı, talep 120!" — duyarlılık: veri değişince optimum kayar, sezgi yine yanıltır.
6. **Tur 3 (7 dk).** Büyük ağ. Kimse optimumu bulamayacak — mesele de bu.
7. **Final ifşası + punchline (5 dk).** Genel klasman, madalyalar; sonra: "Sınıfın en iyisi optimumdan %X uzaktaydı. LP çözücü bunu ~1 milisaniyede buldu. Gerçek problemler 600 kuyu × 500 rafineridir. **Yöneylem Araştırması bunun için var.**"

## Puanlama

- Tur puanı = `round(1000 × optimal / maliyet)` — yalnızca tam teslimatlı, kapasiteleri aşmayan çözümler gönderilebilir.
- Eşitlikte erken teslim öndedir. Tur kapanana kadar daha iyi çözüm tekrar gönderilebilir; her oyuncunun en iyisi sayılır.
- Genel klasman üç tur puanının toplamıdır. Optimumu tutturan 🏆 rozeti alır.

## Doğrulama

Senaryo verileri ve optimal çözümler değiştirilirse, tutarlılık şu komutla kontrol edilir
(bağımlılık yok, build yok):

```bash
node tools/verify-scenarios.mjs
```

Kontrol ettikleri: her turun `optimal.flows` akışı gerçekten talebi karşılıyor mu, kapasiteleri
aşıyor mu, `optimal.cost` ile hesaplanan maliyet aynı mı, akışlar `step` (10) katı mı ve
`optimal.flows` içindeki her `[kuyu, rafineri]` çifti `links` içinde tanımlı mı.

## Lisans

MIT — bkz. `LICENSE`. Eğitim amaçlıdır; orijinal oyunun sahipleriyle resmi bağlantısı yoktur.

## Atıf

- Oyun konsepti: **Michael Watson**, Opex Analytics / LLamasoft — bkz. [Slick Oil is back online](https://miketalksai.substack.com/p/slick-oil-is-back-online)
- Orijinal web uygulaması: **Rémi Lequette** — https://slickoilgame.github.io/
- Bu çok turlu yarışma sürümü: Özyeğin Üniversitesi IE101 dersi için hazırlanmıştır.
