# Changelog

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
