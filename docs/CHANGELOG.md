# Changelog

## [2026-07-10] — Hoca paneli yeniden düzenlendi, telefonda okunabilir ağ

**Ne değişti:** Hoca paneli dört katlanabilir satıra ayrıldı (QR / senaryo / sıralama +
histogram / optimal ifşası); açık-kapalı durumu tarayıcıda hatırlanıyor. Senaryo satırı
artık etkileşimli: hoca ağ üzerinde akış deneyebiliyor, maliyeti canlı görüyor. Telefon
için ikinci bir ağ geometrisi (`NET_COMPACT`) eklendi; ağ üzerindeki rakamlar ~%53–64
büyüdü. Akış etiketlerinin çakışma çözümü yeniden yazıldı. `headroom` mantığı
`scenarios.js`'e taşındı ve iki sayfa tarafından paylaşılıyor.

**Neden:** Projeksiyonda tek ekrana sığmayan bir panel, ders akışını kesiyordu. Telefonda
ağ üzerindeki rakamlar 7.7px'e iniyordu — 760 birimlik viewBox 390px'e sıkışıyordu.

**Etkisi:** Oyun mantığı, senaryo verileri, optimal çözümler ve puanlama formülü
değişmedi (`tools/verify-scenarios.mjs` doğruluyor). Düğüm kutuları 128 → 136 birim
genişledi; bu, `Kuyu 6`'nın `$2.5 | 100🛢` etiketinin isim rozetinin altına girdiği
mevcut bir taşmayı da giderdi.

**Dahil edilmedi:** Hoca deneme alanından "optimali uygula" kısayolu — kazara tıklamayla
optimumu sınıfa erken göstermesi riski var; ifşa zaten ayrı bir düğmeye bağlı.

## [2026-07-09] — Yayına alma: Firebase + GitHub Pages

**Ne değişti:** Firebase yapılandırması gerçek `slickoil-arena` projesiyle dolduruldu.
Güvenlik kuralları `database.rules.json` olarak repoya alındı ve skor silmeye izin
verecek biçimde düzeltildi. Repo GitHub Pages'te yayına alındı. Favicon, LICENSE,
`.gitignore`, `docs/` ve senaryo doğrulama scripti eklendi. `index.html` başlığı,
canonical/og-url etiketleri ve favicon bağlantısı eklendi; `hoca.html` arama
motorlarına kapatıldı (`robots: noindex`).

**Neden:** Ders içi kullanım için sitenin canlı, veritabanının kurallı, senaryo
verisinin de makine tarafından doğrulanabilir olması gerekiyordu.

**Etkisi:** Öğrenci adresi https://erbeyoglu.github.io/slickoil-arena/ üzerinden
QR ile erişilebilir. Hoca paneli aynı dizinde `hoca.html`. Oyun mantığı, senaryo
verileri, optimal çözümler ve puanlama formülü **değişmedi**.

**Dahil edilmedi:** Firebase Auth ile hoca yetkilendirmesi (ADR-002, seçenek C) ve
sunucu tarafı skor doğrulaması — ikisi de ders içi risk profilinde gereksiz görüldü.
