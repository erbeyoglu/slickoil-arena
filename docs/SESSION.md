# Session: 2026-07-15

**Şu anki durum:**
- Site iki oyunlu: **Slick Oil** (min-cost flow) + **TSP** (gezgin satıcı).
- Yerelde tamamlandı ve CDP tarayıcı testleriyle doğrulandı. **Henüz PUSH EDİLMEDİ.**
- ⚠️ **İki bekleyen kullanıcı aksiyonu**: Firebase kurallarını Console'a yapıştırmak +
  push onayı. Bunlar olmadan TSP/Oil teslimleri canlıda 401 döner.

## Bu oturumda yapılanlar

**TSP verisi + ispat** (`tsp-scenarios.js`, `tools/tsp-lib.mjs`, `tools/tsp-solve.mjs`):
6/12/18 şehir, optimumlar 190/293/334 km, üç bağımsız kesin yöntemle (Held–Karp DP,
dal-sınır, kaba kuvvet) kanıtlandı. Held–Karp alt sınırı = optimum (sertifika). İspat
aracı hikâye metnindeki her sayıyı veriden doğrular.

**Problem modülü mimarisi** (3 aşama, her biri commit'li):
- A: `problems.js` — kabuk `PROBLEM.*` üzerinden çalışır, oil davranışı bit-for-bit korundu.
- B: `tsp-network.js` + TSP kontrol çubuğu (Geri al/Temizle) + i18n `tsp.*` namespace.
- C: panelde Oil/TSP seçici + `scores/<problem>/rN` + `state.problem` + iki ayrı klasman.

`scenarios.js` `evaluate`'ine `demand` eklendi (iki problem aynı şekil). Güvenlik
kuralları `scores/<problem>/$round`'a güncellendi.

## Test durumu (hepsi geçti)

CDP gerçek tarayıcı, Firebase'e yazmadan: Oil submit 17, boru 9, sandbox 27, gap 16;
TSP oyunu 21; problem geçişi 15; namespace 7. Node: senaryo/optimallik ispatları,
`verify-i18n` (namespace-aware). Test scriptleri `scratchpad`'de (repoda değil).

## Bekleyen kullanıcı aksiyonları (SONRAKİ ADIM)

1. **Firebase kuralları.** `database.rules.json` içeriğini Firebase Console → Realtime
   Database → Rules'a yapıştırıp Publish. Yeni şema `scores/<problem>/$round`. Eski
   kurallar yeni yola yazmayı 401'ler. Publish sonrası REST testiyle doğrulanmalı.
2. **Push.** Kod local'de commit'li. Kullanıcı onayıyla `git push`. Push + kurallar
   yapıştırılınca canlı site iki oyunlu olur.

## Bilinen sınırlar

- Tek-teslim kuralı istemci tarafında (panel "ilk teslim geçerli" ile etkisizleştirir).
- `revealedRounds` ve deneme alanı çözümleri panelin `localStorage`/belleğinde — başka
  makinede panel açılırsa klasman yeniden kilitli görünür.
- TSP status başlığı "6 cities" der (depo dahil); hikâye "5 wells" der. Küçük, kabul edildi.
- Aynı takma adı iki öğrenci kullanırsa skorları birleşir (problem başına).

## Ders akışı notu

İki oyun aynı derste ~70+ dk. Panelde önce Oil (3 tur), sonra TSP seçip (3 tur). Her
problemin kendi genel klasmanı; "dersin tek galibi" yoktur.
