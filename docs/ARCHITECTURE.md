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
| `index.html` | Öğrenci istemcisi: katılım, ağ üzerinde akış düzenleme, teslim, sonuç/ifşa ekranı. Tek yazma noktası: `scores/rN` altına push. |
| `hoca.html` | Kontrol paneli: `state` düğümünü yazar (lobby → live → closed → reveal), leaderboard/histogram/genel klasman çizer, QR üretir. |
| `scenarios.js` | Üç senaryonun verisi, LP ile doğrulanmış optimumlar ve paylaşılan saf fonksiyonlar (`evaluate`, `optimalFlowArray`, `unitCost`, `fmtMoney`). |
| `network.js` | SVG ağ çizici. Hem oyun hem de optimal ifşa aynı çizicidir. |
| `style.css` | Tasarım sistemi (renk değişkenleri, kart, buton, ağ stilleri). |
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

- Tur puanı = `round(1000 × optimal / maliyet)`; yalnızca talebi tam karşılayan ve
  kapasite aşmayan çözümler gönderilebilir (`submitBtn` aksi halde devre dışıdır).
- Her oyuncunun bir turdaki **en iyi** teslimi sayılır (`bestPerName`); eşitlikte erken teslim önde.
- Genel klasman üç turun puan toplamıdır.

## Bilinçli tasarım kısıtları

- **Kimlik doğrulama yok.** Oyuncular yalnızca takma ad girer; aynı adı iki kişi
  kullanırsa skorları `bestPerName` içinde birleşir. Ders içi kabul edilen bir sınırdır.
- **Sunucu tarafı doğrulama yok.** Maliyet istemcide hesaplanır; kararlı bir öğrenci
  konsoldan sahte (ama şema olarak geçerli) bir skor gönderebilir. Kurallar yalnızca
  şekli doğrular, çözümün gerçekliğini değil.
