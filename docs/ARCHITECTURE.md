# Mimari

Build adımı, paket yöneticisi ve sunucu tarafı kod yoktur. GitHub Pages statik
dosyaları servis eder; tek dinamik bileşen Firebase Realtime Database'dir.

```
                     Firebase Realtime Database
                     (europe-west1)
                     ├── state   {round, phase, duration, endsAt}
                     └── scores
                         ├── r1/<pushId> {name, cost, timeSec, ts}
                         ├── r2/...
                         └── r3/...
                              ▲                    │
                     yazar ───┘                    └─── dinler (on "value")
                       │                                  │
        ┌──────────────┴───────────┐        ┌─────────────┴──────────────┐
        │  index.html (öğrenci)    │        │  hoca.html (projeksiyon)   │
        │  telefon, QR ile girilir │        │  tur kontrolü + leaderboard│
        └──────────────┬───────────┘        └─────────────┬──────────────┘
                       │                                  │
                       └──────── scenarios.js ────────────┘
                                 network.js
                                 style.css
```

## Bileşenler

| Dosya | Sorumluluk |
|---|---|
| `index.html` | Öğrenci istemcisi: katılım, ağ üzerinde akış düzenleme, teslim, sonuç/açıklama ekranı. Tek yazma noktası: `scores/rN` altına push. |
| `hoca.html` | Kontrol paneli: `state` düğümünü yazar (lobby → live → closed → reveal), leaderboard/histogram/genel klasman çizer, QR üretir. Dört katlanabilir satır: QR, senaryo (deneme alanı), sıralama+histogram, optimal açıklaması. |
| `scenarios.js` | Üç senaryonun verisi, LP ile doğrulanmış optimumlar ve paylaşılan saf fonksiyonlar (`evaluate`, `headroom`, `optimalFlowArray`, `unitCost`, `fmtMoney`). |
| `network.js` | SVG ağ çizici. Oyun, hoca deneme alanı ve optimal açıklaması aynı çiziciyi kullanır. |
| `style.css` | Tasarım sistemi (renk değişkenleri, kart, buton, ağ stilleri). |
| `i18n.js` | TR/EN sözlüğü ve `t()`, `applyI18n()`, `scenTitle/scenStory/scenNote` yardımcıları. |
| `database.rules.json` | Güvenlik kuralları; Console'a yapıştırılan sürümün kaynağıdır. |
| `tools/verify-scenarios.mjs` | Senaryo verisi bütünlük testi. |

## Durum makinesi

`state.phase` tek gerçek kaynağıdır; her iki istemci de ona tepki verir.

```
lobby ──"Turu başlat"──▶ live ──süre bitti veya "Kapat"──▶ closed ──"Optimali göster"──▶ reveal
  ▲                                                                                        │
  └──────────────────────────── "Lobiye al" ───────────────────────────────────────────────┘
```

Süre dolduğunda `closed`'a geçişi **hoca paneli** yazar (`hoca.html`, `syncTimer`).
Öğrenci istemcisi yalnızca geri sayımı gösterir; kendi başına faz değiştirmez.

## Puanlama

- **Tur başına tek teslim.** `submitBtn` yalnızca talep tam karşılandığında aktiftir;
  basınca bir `confirm()` çıkar, onaydan sonra buton kalıcı olarak kilitlenir.
- Her oyuncunun bir turdaki **ilk** teslimi sayılır (`entryPerName`). WHY: kural tek
  teslimdir; "en ucuzu al" deseydik `localStorage`'ı temizleyip tekrar göndermek
  ödüllendirilirdi. Sıralamada eşitlikte erken teslim önde.
- **Uzaklık (gap)** = `100 × (maliyet − optimal) / optimal`. Genel klasman üç turun
  uzaklık ortalamasıdır (küçük kazanır); teslim edilmeyen tur `MISSING_ROUND_GAP` (%100).
- Tur puanı (`round(1000 × optimal / maliyet)`) yalnızca gösterilir, sıralamaz.

### Optimum sızıntısı ve görünürlük kuralı

Uzaklık yüzdesi, öğrencinin kendi maliyetiyle birleşince optimumu verir:
`optimal = maliyet / (1 + uzaklık/100)`. Aynısı puan için de geçerlidir. Bu yüzden:

| Ne | Ne zaman görünür |
|---|---|
| Uzaklık ve puan sütunları | o tur açıklandıktan sonra (`state.phase === "reveal"`) |
| Genel klasman | üç turun da optimali açıklandıktan sonra |
| Optimal çözüm kartı | açıklamadan sonra görünür, ama **kapalı**; hoca açar |

Açıklanmış turlar panelin `localStorage`'ında (`soa_revealed`) tutulur — `state`
düğümü tek bir turu taşıdığı için geçmişi veritabanında saklayamayız ve kurallar
yeni bir kök düğüm yazmaya izin vermez.

## Ağ çizimi: iki geometri

`network.js` iki yerleşim sabiti tutar ve SVG'nin **piksel genişliğine** göre seçer
(`netGeometry`, eşik 520px):

| | viewBox | Düğüm genişliği | Kullanım |
|---|---|---|---|
| `NET_WIDE` | 760 | 136 | projeksiyon, tablet, masaüstü |
| `NET_COMPACT` | 660 | 156 | telefon |

Kompakt geometri boru boşluklarını kısaltıp düğümleri genişletir; viewBox daraldığı
için aynı SVG telefonda daha büyük ölçekte çizilir. Fontlar `style.css` içindeki
`.net-compact` kurallarıyla büyütülür. Sonuç: 390px'lik bir ekranda akış rakamları
7.7px yerine ~11.8px.

Düğüm genişlikleri en uzun etikete (`$2.5 | 100🛢`) göre seçilmiştir. Punto veya
etiket biçimi değişirse `network.js` başındaki genişlik hesabı yeniden yapılmalıdır.

Akış etiketleri `layoutFlowTags` ile çakışmadan yerleştirilir: her etiket, hattı
üzerindeki yedi aday noktadan (t = 2/3, 1/3, …) boş olan ilkine konur; hepsi doluysa
hattından birkaç birim aşağı kaydırılır. Yalnızca **çizilecek** etiketler dikkate
alınır — akışı sıfır olan bir hat, görünen bir etiketi kaydırmamalıdır.

## Hoca deneme alanı

Panelin "Senaryo" satırındaki ağ etkileşimlidir: hoca boruya tıklayıp akış girebilir,
maliyeti ve teslimatı canlı görür. Bu tamamen yereldir — Firebase'e hiçbir şey
yazılmaz, skorları etkilemez. Her turun akışları ayrı tutulur (`scenFlows`), tur
değiştirip geri dönünce korunur.

Kapasite sınırı hesabı (`headroom`) öğrenci oyunuyla **aynı fonksiyondur**
(`scenarios.js`); iki ayrı kopya tutulmaz.

## Dil (TR / EN)

Tek sözlük (`i18n.js` → `I18N`), iki dil. Statik metinler HTML'de `data-i18n`
(veya `-html`, `-ph`, `-alt`) ile işaretlenir ve `applyI18n()` doldurur. Dinamik
metinler `t("anahtar", { değişken })` ile üretilir. Senaryo metinleri `scenarios.js`
içinde `title` / `title_en` çiftleri olarak durur; `scenTitle()`, `scenStory()`,
`scenNote()` doğru olanı seçer.

Dil değişince `applyI18n()` statik metinleri günceller ve her sayfa kendi dinamik
içeriğini yeniden çizer (`initLangToggle`'a verilen geri çağrı). Ağ SVG'si de yeniden
çizilir — sütun başlıkları ve "MÜŞTERİ" etiketi de çeviriye tabidir.

Seçim `localStorage` (`soa_lang`) içinde saklanır; ilk açılışta `navigator.language`
Türkçe ise TR, değilse EN.

> Yeni metin eklerken: anahtarı **iki sözlüğe de** ekleyin. Anahtar kümelerinin
> eşitliği, kullanılmayan ("ölü") metinler ve `{değişken}` uyumsuzlukları
> makineyle denetlenebilir; kod yalnızca sözlükte olan anahtarları kullanmalıdır.

## Bilinçli tasarım kısıtları

- **Kimlik doğrulama yok.** Oyuncular yalnızca takma ad girer; aynı adı iki kişi
  kullanırsa skorları `bestPerName` içinde birleşir. Ders içi kabul edilen bir sınırdır.
- **Sunucu tarafı doğrulama yok.** Maliyet istemcide hesaplanır; kararlı bir öğrenci
  konsoldan sahte (ama şema olarak geçerli) bir skor gönderebilir. Kurallar yalnızca
  şekli doğrular, çözümün gerçekliğini değil.
