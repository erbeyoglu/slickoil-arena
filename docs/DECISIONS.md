# Mimari Kararlar (ADR)

## ADR-001 — Statik site + Firebase Realtime Database

**Tarih:** 2026-07-09
**Durum:** Kabul edildi

**Bağlam:** 40 kişilik bir sınıfta, 35 dakikalık bir ders içinde çalışacak, telefondan
QR ile girilen, canlı leaderboard'lu bir yarışma gerekiyor. Kurulum süresi ve ders
sırasındaki arıza riski, mühendislik zarafetinden daha önemli.

**Değerlendirilen seçenekler:**
- Statik site + Firebase RTDB — Artı: build yok, sunucu yok, gerçek zamanlı dinleyici hazır, ücretsiz kotada kalır. Eksi: istemciye güven; sunucu tarafı doğrulama yok.
- Node/WebSocket sunucusu (Render, Fly.io) — Artı: skorları sunucuda doğrulayabiliriz. Eksi: soğuk başlatma, ders sırasında ayakta tutma sorumluluğu, dağıtım karmaşası.
- Sunucusuz, yalnız yerel (tek makine) — Artı: en basit. Eksi: öğrenciler kendi telefonlarından oynayamaz; oyunun tüm sosyal enerjisi kaybolur.

**Karar:** Statik site + RTDB. Ders içi bir oyunda hile riski, ayakta kalmayan bir
sunucunun riskinin yanında önemsiz.

**Sonuçları:** Dağıtım = `git push`. Buna karşılık maliyet hesabı istemcide kalır ve
güvenilmezdir; bu bilinçli bir kabul (bkz. ARCHITECTURE.md → tasarım kısıtları).

---

## ADR-002 — Skorlar append-only, ama silinebilir

**Tarih:** 2026-07-09
**Durum:** Kabul edildi

**Bağlam:** İlk taslak kurallar saf append-only idi (`".write": "!data.exists()"`).
Bu kural, hoca panelindeki "Skorları sıfırla" butonunu da sessizce engelliyordu —
silme işlemi de bir yazmadır ve hedef düğümde veri vardır.

**Değerlendirilen seçenekler:**
- A. Silme koşulu ekle (`|| !newData.exists()`) — Artı: panel çalışır, turlar arası hızlı reset. Eksi: teoride herkes skor silebilir.
- B. Kural değişmesin, sıfırlama Console'dan elle — Artı: sıfır risk. Eksi: ders ortasında Console açmak; buton yanıltıcı biçimde çalışmaz durur.
- C. Firebase Auth ile hoca yetkisi — Artı: en sağlam. Eksi: ~20 dk kurulum, ders anında bir bağımlılık daha.

**Karar:** A. Silinebilir ama **değiştirilemez**: var olan bir skorun üzerine yazılamaz,
yalnızca kaldırılabilir. Bir öğrencinin skorları kasten silmesi, panelden tek tuşla
sıfırlayamamanın ders içi maliyetinden daha düşük bir risk.

**Sonuçları:** `btnWipe` çalışır. Sıfır risk gerekirse `|| !newData.exists()` koşulu
kaldırılır ve sıfırlama Console → Data sekmesinden yapılır.

---

## ADR-003 — Optimumlar veri olarak saklanır, çalışma anında çözülmez

**Tarih:** 2026-07-09
**Durum:** Kabul edildi

**Bağlam:** Her senaryonun optimal maliyeti ve akışı gerekiyor: histogramdaki referans
çizgisi, puanlama ve ifşa ekranı için.

**Değerlendirilen seçenekler:**
- Optimumu istemcide bir LP/min-cost-flow çözücüsüyle hesapla — Artı: senaryo verisi değişince otomatik güncellenir. Eksi: tarayıcıya çözücü kütüphanesi girer (build/bağımlılık), ders sırasında yanlış çalışma riski.
- Optimumu önceden LP ile çöz, `scenarios.js` içine sabit yaz — Artı: sıfır bağımlılık, deterministik. Eksi: senaryo verisi elle değişirse optimum sessizce yanlış kalır.

**Karar:** Önceden çözülmüş sabit değerler ($690 / $920 / $1245), ve bu değerlerin
tutarlılığını koruyan bir doğrulama scripti (`tools/verify-scenarios.mjs`).

**Sonuçları:** Site bağımlılıksız kalır. Senaryo verisi değişirse script kırmızı yanar —
ama optimumu **yeniden hesaplamaz**; yalnızca beyan edilen çözümün hâlâ uygulanabilir
olduğunu ve beyan edilen maliyeti verdiğini kontrol eder. Senaryo değişirse LP yeniden
çözülmelidir.

---

## ADR-004 — İki dillilik: sözlük tabanlı, çerçevesiz

**Tarih:** 2026-07-10
**Durum:** Kabul edildi

**Bağlam:** Ders hem Türkçe hem İngilizce verilebiliyor; arayüzün tamamı (senaryo
hikâyeleri ve ağ etiketleri dahil) iki dilde gerekiyor. Site build'siz kalmalı.

**Değerlendirilen seçenekler:**
- i18next / Polyglot gibi bir kütüphane — Artı: çoğullama, biçimlendirme hazır. Eksi: yeni bağımlılık, CDN çağrısı; bu projede çoğullama gereği yok.
- Her dil için ayrı HTML dosyası (`index.en.html`) — Artı: sıfır JS. Eksi: her düzeltme iki dosyada; DRY ihlali, sürüklenme kaçınılmaz.
- Tek sözlük + `data-i18n` işaretleri + `t()` — Artı: bağımlılık yok, tek gerçek kaynak, metinler makineyle denetlenebilir. Eksi: dinamik metinlerde `t()` çağrısı unutulabilir.

**Karar:** Tek sözlük (`i18n.js`). "Unutulan `t()`" riskini denetimle karşılıyoruz:
iki sözlüğün anahtar kümeleri eşit mi, kullanılan her anahtar tanımlı mı, ölü metin
var mı, `{değişken}` isimleri iki dilde tutuyor mu — hepsi kontrol edilebilir.

**Sonuçları:** Yeni metin iki sözlüğe de eklenmeli. Senaryo metinleri `title` /
`title_en` çiftleri olarak yaşar; üçüncü bir dil eklenirse bu şema (`title_xx`)
sözlük yapısına (`title: {tr, en}`) dönüştürülmelidir.

---

## ADR-005 — Optimal maliyet katlanmış başlıkta gösterilmez

**Tarih:** 2026-07-10
**Durum:** Kabul edildi

**Bağlam:** Hoca paneli projeksiyondadır. Optimal çözüm bölümünün başlığı
"Optimal çözüm — $690" yazıyordu; bölüm kapalıyken bile bu satır perdede okunuyordu,
yani ifşadan önce cevabı sızdırıyordu. Oyunun tüm dramatik yapısı bu sayının
saklanmasına dayanır.

**Karar:** Başlık yalnızca "Optimal çözüm" der. Maliyet, bölüm açıldığında gövdede
büyük puntoyla belirir. Ayrıca bölüm, `state.phase === "reveal"` olana dek hiç
görünmez.

**Consequences / Sonuçları:** "✨ Optimali göster" düğmesi kaldırılmadı — o düğme
paneli değil, **öğrenci telefonlarındaki** ifşa fazını tetikler. Ne yaptığı belirsiz
kalmasın diye adı "Optimali sınıfa aç" (EN: "Reveal to class") oldu.
