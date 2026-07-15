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
çizgisi, puanlama ve açıklama ekranı için.

**Değerlendirilen seçenekler:**
- Optimumu istemcide bir LP/min-cost-flow çözücüsüyle hesapla — Artı: senaryo verisi değişince otomatik güncellenir. Eksi: tarayıcıya çözücü kütüphanesi girer (build/bağımlılık), ders sırasında yanlış çalışma riski.
- Optimumu önceden LP ile çöz, `scenarios.js` içine sabit yaz — Artı: sıfır bağımlılık, deterministik. Eksi: senaryo verisi elle değişirse optimum sessizce yanlış kalır.

**Karar:** Önceden çözülmüş sabit değerler ($690 / $920 / $1245), ve bu değerlerin
tutarlılığını koruyan bir doğrulama scripti (`tools/verify-scenarios.mjs`).

**Sonuçları:** Site bağımlılıksız kalır. Senaryo verisi değişirse `verify-scenarios.mjs`
kırmızı yanar — ama optimumu **yeniden hesaplamaz**; yalnızca beyan edilen çözümün hâlâ
uygulanabilir olduğunu ve beyan edilen maliyeti verdiğini kontrol eder.

**Güncelleme (2026-07-10):** Optimalliğin kendisi artık `tools/solve-optimal.mjs` ile
kanıtlanıyor — bağımsız bir min-cost flow çözücüsü, optimallik sertifikası ve LP zayıf
dualitesinden bağımsız bir alt sınır. Senaryo verisi değişirse bu script yeni optimumu
hesaplar; `scenarios.js`'teki değer elle güncellenmelidir.

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
yani açıklamadan önce cevabı sızdırıyordu. Oyunun tüm dramatik yapısı bu sayının
saklanmasına dayanır.

**Karar:** Başlık yalnızca "Optimal çözüm" der. Maliyet, bölüm açıldığında gövdede
büyük puntoyla belirir. Ayrıca bölüm, `state.phase === "reveal"` olana dek hiç
görünmez.

**Consequences / Sonuçları:** "✨ Optimali göster" düğmesi kaldırılmadı — o düğme
paneli değil, **öğrenci telefonlarındaki** açıklama fazını tetikler. Ne yaptığı belirsiz
kalmasın diye adı "Optimali sınıfa aç" (EN: "Reveal to class") oldu.

Ayrıca kart, açıklama fazında görünür olsa da **kapalı** gelir ve açık/kapalı durumu
`localStorage`'a yazılmaz (`SECT_NO_PERSIST`). Diğer satırlar hatırlanır; bu satır
her yüklemede kapalıdır. Cevabı perdeye getirmek için bilinçli bir tıklama gerekir.

---

## ADR-006 — Panel yüklenince Tur 1, ama canlı tur varsa ona geç

**Tarih:** 2026-07-10
**Durum:** Kabul edildi

**Bağlam:** `state` düğümü kalıcıdır. Ders bittiğinde içinde `{round: 3, phase: "reveal"}`
kalır ve panel ertesi hafta Tur 3'te, açıklama fazında açılırdı.

**Değerlendirilen seçenekler:**
- Her yüklemede koşulsuz Tur 1 — Artı: en basit, isteneni birebir yapar. Eksi: tur ortasında paneli yenilersen sayaç Tur 3'ü sayarken ekran Tur 1'i gösterir; hoca yanlış tura teslim başlatabilir.
- İlk anlık görüntüde yalnızca `phase === "live"` ise tura geç — Artı: normal durumların hepsinde (lobby / closed / reveal / boş) Tur 1 açılır; canlı turda tutarlılık korunur. Eksi: bir kural daha.

**Karar:** İkincisi. `shouldAdoptRound(firstSnapshot, state)` saf bir fonksiyondur ve
karar tablosu tarayıcıda doğrudan test edilir.

**Sonuçları:** "Sayfa yüklenince Tur 1" beklentisi pratikte her zaman karşılanır;
tek istisna, o anda gerçekten dönen bir turun olması — ki orada panelin ona
kilitlenmesi zaten istenen davranıştır.

---

## ADR-007 — İkinci oyun tek kabuğa yedirildi (ayrı sayfa değil)

**Tarih:** 2026-07-15
**Durum:** Kabul edildi

**Bağlam:** Slick Oil'in yanına TSP eklenecek. Aynı derste oynanacak.

**Değerlendirilen seçenekler:**
- Ayrı `tsp.html` / `tsp-hoca.html` sayfaları — Artı: izolasyon. Eksi: lobi, faz makinesi, sayaç, teslim akışı, tek-teslim kuralı, sıralama, i18n, güvenlik kuralları — hepsi ~%85 ortak — iki nüsha olur ve kaçınılmaz olarak birbirinden kayar.
- Tek kabuk + "problem modülü" soyutlaması — Artı: ortak mantık tek kopya; tek genel klasman altyapısı (gap boyutsuz). Eksi: bir soyutlama katmanı.

**Karar:** Tek kabuk. `problems.js` bir `ProblemModule` arayüzü tanımlar (evaluate,
render, emptySolution, optimalSolution, fmtCost, onTap, controls, demand). `index.html`
ve `hoca.html` kabuktur; aktif problemi `PROBLEM` değişkeninden okur.

**Ölçüm:** Kabuk JS'inin ~%85'i probleme kayıtsız çıktı (ölçüldü). Refactor üç aşamada
yapıldı (A: oil'i sarmala/davranış aynı, B: TSP modülü, C: seçici+namespace); her aşama
CDP tarayıcı testleriyle Slick Oil davranışının değişmediğini kanıtladı.

**Sonuçları:** Üçüncü bir problem eklemek = yeni bir `PROBLEMS.<key>` modülü + çizici +
`tsp.*` benzeri i18n bloğu. Kabuk dokunulmaz.

---

## ADR-008 — Firebase namespace ve iki ayrı klasman

**Tarih:** 2026-07-15
**Durum:** Kabul edildi

**Bağlam:** İki problem aynı `r1/r2/r3` tur anahtarlarını kullanıyor. Namespace olmadan
TSP r1 teslimi, Oil r1'in `scores/r1` düğümüne ve tek-teslim kilidine karışır.

**Karar:** Her şey problem başına isimlendirildi: `scores/<problem>/rN`, `state.problem`,
`localStorage` öneki `oil_r1`/`tsp_r1`, `soa_revealed_<problem>`. Genel klasman da problem
başınadır (kullanıcı kararı: birleşik 6-tur klasmanı değil, iki ayrı klasman).

**Sonuçları:** Güvenlik kuralları `scores/$problem/$round` derinliğine güncellendi.
Öğrenci bir problemi teslim etse de diğerini oynayabilir (kilitler bağımsız). "Dersin
en iyisi" diye tek kişi yoktur; her oyunun kendi şampiyonu olur.

---

## ADR-009 — TSP büyük + uniform + MIP ile kesin optimum

**Tarih:** 2026-07-15
**Durum:** Kabul edildi (ADR-008'deki küçük TSP'yi geçersiz kılar)

**Bağlam:** İlk TSP (6/12/18 şehir) ders amacına ters düştü: küçük görsel Euclidean
TSP'de öğrencinin 2-opt sezgisi tam optimali buluyordu (ölçüldü, %0.0). "Sezgi çöker"
mesajı küçük örneklerle verilemez — küçük = kolay (Knapsack'te de greedy %0.1).

**Değerlendirilen seçenekler:**
- Problemi değiştir (Knapsack vb.) — Eksi: onlar da küçükte kolay; kök sorun çözülmez.
- Küçük TSP tut, mesajı "kanıtla" yap — Eksi: "çat diye buldum" hissini yenmez.
- TSP'yi büyüt (elle imkânsız) — Artı: ölçek mesajı gerçek. Eksi: kesin optimum n>20'de Held–Karp DP ile imkânsız.

**Karar:** TSP'yi büyüt (20/40/60), noktaları uniform dağıt (sezgiyi zayıflatır), her
instance'ı sezgi-direnci ölçerek seç. Kesin optimum için **MIP çözücü** (PuLP+CBC, DFJ
alt-tur eleme) — kullanıcı önerisi. Held–Karp DP değil çünkü n=60'ta 2⁶⁰ bellek.

**Sonuçları:** Python + CBC bir geliştirme-zamanı bağımlılığıdır (yalnızca optimum
üretiminde; site bağımlılıksız). Doğrulama iki katmanlı: MIP=DP küçük referansta, ve
alt/üst sınır çerçevesi her turda. `tools/tsp-lib.mjs`'teki Held–Karp DP artık yalnızca
küçük-referans cross-check için durur (üretimde MIP). Üçüncü bir çok-büyük tur eklemek
= MIP'e yeni koordinat vermek (n≤100 saniyeler).
