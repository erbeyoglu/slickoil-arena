# Session: 2026-07-15

**Şu anki durum:**
- Site iki oyunlu: **Slick Oil** (min-cost flow) + **TSP** (gezgin satıcı, 20/40/60 durak).
- TSP büyütüldü ve MIP ile kesin çözüldü. Yerelde tamamlandı, CDP ile doğrulandı.
- **Bu oturumdaki TSP-büyütme değişiklikleri henüz PUSH EDİLMEDİ.** (Önceki TSP altyapısı
  — Aşama A/B/C, 6/12/18 senaryolar — push edilmişti; bu oturum onları 20/40/60 ile değiştirdi.)

## Bu oturumda yapılanlar (TSP yeniden tasarım)

**Sorun:** Küçük görsel Euclidean TSP (6/12/18) ders amacına ters — öğrencinin 2-opt
sezgisi tam optimali buluyordu (%0.0, ölçüldü). Knapsack de küçükte kolay (%0.1).

**Çözüm:** TSP'yi büyüt (20/40/60 durak, elle imkânsız), noktaları uniform dağıt,
her instance'ı sezgi-direnci ölçerek seç. Gerçekçi öğrenci gap'i %3.9/%7.7/%10.4.

**MIP çözücü** (kullanıcı önerisi): `tools/tsp-mip-solve.py` (PuLP+CBC, DFJ alt-tur
eleme). n=100'ü ~40sn'de kesin çözer. Optimumlar 4357/5661/6624 km. Held–Karp DP bu
boyutta imkânsız (2ⁿ). MIP=DP küçük referansta doğrulandı (formülasyon güveni).

**Değişen dosyalar:** tsp-scenarios.js (yeni büyük instance'lar), tsp-network.js
(bounding-box ölçekleme, telefon için çakışmasız daire/hit), tools/tsp-lib.mjs (twoOpt,
upperBound), tools/tsp-solve.mjs (alt/üst sınır çerçevesi), tools/tsp-mip-solve.py (yeni),
problems.js (tsp durations/demand), style.css (tsp var ölçekleme), docs.

## Test durumu (hepsi geçti)

CDP gerçek tarayıcı, Firebase'e yazmadan: oil 69 (submit 17 + boru 9 + sandbox 27 + gap 16),
tsp oyun 14, panel switch 15, namespace 7 = 105 kontrol. Node: verify-scenarios,
solve-optimal, tsp-solve (alt≤opt≤üst her turda), verify-i18n. Test scriptleri scratchpad'de.

## Bekleyen kullanıcı aksiyonu

- **Push.** Kod local'de commit'li. Kullanıcı onayıyla `git push`. Firebase kuralları
  (scores/<problem>) ZATEN yayında (önceki oturumda) — TSP büyütme kural değiştirmez,
  yalnızca kod. Yani bu sefer sadece push + Pages doğrulama gerekir.

## Bilinen sınırlar / kararlar

- TSP telefonda oynanabilir: daire/hit en yakın çifte bağlı, çakışmıyor. Birkaç yakın
  çift (uniform jitter) sıkışık ama Undo var. Poisson-disk daha iyi olurdu, atlandı.
- MIP: geliştirme-zamanı aracı (Python+CBC). Site bağımlısız kalır.
- `tools/tsp-lib.mjs` Held–Karp DP artık yalnızca küçük-referans cross-check için (ADR-009).
- Tek-teslim, iki klasman, i18n namespace: önceki oturumdan; değişmedi.

## Ders akışı

Panelde önce Slick Oil (3 tur), sonra TSP seç (3 tur). Her problemin kendi klasmanı.
TSP mesajı: küçük rotada sen de yaklaşırsın; büyüdükçe çaresizleşirsin; MIP çözücü
177 haneli uzayı bile saniyede KESİN çözer. Yöneylem Araştırması bunun için var.
