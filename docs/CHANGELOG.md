# Changelog

## [2026-07-15] — TSP büyütüldü (20/40/60) + MIP çözücü ile kesin optimum

**Ne değişti:** TSP turları 6/12/18'den **20/40/60 durağa** çıkarıldı. Sebep ölçüldü:
küçük görsel Euclidean TSP'de öğrencinin "dıştan git, kesiştirme" sezgisi (çok-başlangıçlı
2-opt) üç senaryonun da tam optimalini buluyordu (%0.0) — ders ters tepiyordu. Aynı şey
Knapsack için de doğru çıktı (greedy %0.1): küçük örnekler kolaydır.

Çözüm: turları el ile çözülemeyecek kadar büyüt + noktaları **uniform** dağıt (jittered
grid; kümelenme yok, convex-hull sezgisi zayıflar) + her instance'ı öğrenci sezgisine
(2-opt) karşı direnci ÖLÇEREK seç. Sonuç gap'ler (gerçekçi tek-geçiş 2-opt): %3.9 / %7.7
/ %10.4; naif en-yakın-komşu %23-30. Büyük n'de öğrenci elle 2-opt'u zaten yapamaz.

**MIP çözücü:** Bu boyutta Held–Karp DP imkânsız (2ⁿ bellek). Optimumlar açık kaynak
bir MIP çözücüyle KESİN çözüldü — `tools/tsp-mip-solve.py` (PuLP + CBC, DFJ alt-tur
eleme, iteratif). Ölçüldü: n=100'ü bile ~40 sn'de kesin çözer. Bu bir geliştirme-zamanı
aracı; optimum önceden çözülüp veriye gömülür, site bağımlılıksız kalır (Slick Oil'de
LP optimumunu önceden çözmek gibi). Doğruluk: MIP formülasyonu küçük referanslarda
Held–Karp DP ile birebir aynı (190/293/334); `tools/tsp-solve.mjs` her turda bağımsız
alt sınır ≤ optimum ≤ üst sınır çerçevesini denetler (alt sınır MIP'i hiç aşmadı).

**Telefon:** TSP çizici bounding-box'a göre otomatik ölçekleniyor (koordinatlar 0-1000).
Daire ve dokunma alanı en yakın şehir çiftine bağlı — çakışmıyor, telefonda parmakla
yanlış şehir seçilemez (matematiksel garanti). Boyut ve yazı şehir sayısına göre.

**Etkisi:** Oil ve problem-modülü mimarisi değişmedi. TSP süreleri {1:3,2:4,3:5} dk.
Doğrulama: CDP regresyon 105 kontrol (oil 69 + tsp 14 + switch 15 + namespace 7).

## [2026-07-15] — İkinci oyun: Gezgin Satıcı (TSP) + problem modülü mimarisi

**Ne değişti:** Site artık iki optimizasyon oyunu barındırıyor. Hoca panelinde Oil/TSP
seçici; öğrenci telefonda aktif oyuna otomatik geçiyor. TSP: 6 / 12 / 18 şehir, öğrenci
şehirlere sırayla dokunuyor (Geri al / Temizle).

Mimari üç aşamada kuruldu:
- **A — problem modülü soyutlaması** (`problems.js`): `index.html` ve `hoca.html`
  probleme özgü her şeyi `PROBLEMS.oil` / `PROBLEMS.tsp` modülünden okur (evaluate,
  render, emptySolution, optimalSolution, fmtCost, onTap, controls). Kabuk davranışı
  bit-for-bit korundu.
- **B — TSP çizici + kontrol çubuğu + i18n namespace**: `tsp-network.js` (şehir tıklama,
  sıra numaraları, kısmi tur), `t()` problem-aware (`<problem>.<key>`), TSP metinleri.
- **C — problem seçici + Firebase namespace**: `scores/<problem>/rN`, `state.problem`,
  `localStorage` öneki `oil_`/`tsp_`, `revealedRounds` problem başına. İki oyunun
  skorları, tek-teslim kilitleri ve klasmanları bağımsız (ADR-006, kullanıcı kararı).

TSP optimumları (190 / 293 / 334 km) üç bağımsız kesin yöntemle kanıtlandı: Held–Karp
dinamik programlama, dal-sınır, kaba kuvvet (n=6). Held–Karp alt sınırı üçünde de
optimuma eşit → çözücüden bağımsız sertifika. `tools/tsp-solve.mjs` hikâye metnindeki
her sayıyı (tur sayısı, açgözlü maliyet, gap) veriden doğrular.

**Neden:** Slick Oil'in punchline'ı "sezgi yanılır, LP çözer". TSP daha güçlü: NP-zor.
6 şehir eklemek arama uzayını 20 milyondan 177 trilyona çıkarır (kaba kuvvet 20 sn → 5,6
yıl), DP ise saniyenin altında çözer. Gap boyutsuz olduğu için puanlama iki oyunda da aynı.

**Etkisi:** `scenarios.js`'e `evaluate` dönüşüne `demand` eklendi (tspEvaluate ile aynı
şekil; feasible/puanlama değişmedi). Senaryo verileri, Oil optimumları ve puanlama
formülü değişmedi. **Güvenlik kuralları `scores/<problem>/$round`'a göre güncellendi**
(Console'a yeniden yapıştırılmalı).

**Doğrulama:** CDP gerçek tarayıcı testleri — Oil regresyon (submit/boru/sandbox/gap 90
kontrol), TSP oyunu 21, problem geçişi 15, namespace ayrışması 7. i18n bütünlüğü
namespace-aware (`tools/verify-i18n.mjs`).

**Dahil edilmedi:** Birleşik (6 tur) klasman — kullanıcı iki ayrı klasman istedi.

## [2026-07-10] — Tek teslim hakkı, optimuma uzaklık, ortalama-uzaklık klasmanı

**Ne değişti:**
- Öğrenci tur başına **bir kez** teslim edebilir. "Teslim et" bir onay penceresi açar;
  onaydan sonra buton `✓ Teslim edildi — $X` olarak kilitlenir. Ağ isteği tamamlanmadan
  buton kilitlenir (çift dokunuş ikinci kayıt göndermesin).
- Canlı sıralamaya **uzaklık** sütunu eklendi: `100 × (maliyet − optimal) / optimal`.
- Genel klasman artık puan toplamı değil, üç turun **uzaklık ortalaması** (küçük kazanır).
  Teslim edilmeyen tur %100 uzaklık sayılır.
- Aynı isimden birden çok kayıt gelirse **ilk** teslim geçerlidir (eskiden en ucuzu).

**Neden ortalama uzaklık:** turların optimalleri farklı ($690 / $920 / $1245), dolayısıyla
`1000 × optimal / maliyet` puanları farklı ölçeklerde. Toplamak, pahalı turlara sessizce
daha fazla ağırlık verir. Uzaklık yüzdesi ölçeksizdir.

**Düzeltilen sızıntı:** uzaklık ve puan, maliyetle birlikte optimumu ele verir
(`optimal = maliyet / (1 + uzaklık/100)`). Puan sütunu zaten böyleydi ama **genel
klasman açıklamadan önce de gösteriliyordu**. Artık: uzaklık/puan sütunları yalnızca o tur
açıklandıktan sonra, genel klasman ise üç tur da açıklandıktan sonra görünür.
Açıklanmış turlar panelin `localStorage`'ında tutulur; "Skorları sıfırla → hepsi"
bu geçmişi de temizler.

**Dahil edilmedi:** tek teslim kuralının sunucu tarafında zorlanması. Kurallar
append-only olduğundan aynı isim ikinci bir kayıt yazabilir; panel bunu "ilk teslim
geçerli" diyerek etkisizleştirir. Gerçek zorlama Firebase Auth gerektirirdi.

## [2026-07-10] — Panel her zaman Tur 1'de ve optimal kartı kapalı açılır

**Ne değişti:** Hoca paneli sayfa yüklendiğinde Tur 1'de açılıyor. İstisna: o anda
gerçekten **canlı** bir tur varsa (`phase === "live"`) panel ona geçiyor — paneli
tur ortasında yenilemek, sayaç Tur 3'ü sayarken ekranın Tur 1'i göstermesine yol
açmasın diye. Karar `shouldAdoptRound()` fonksiyonunda toplandı.

Optimal çözüm kartı artık **hiçbir zaman kendiliğinden açılmıyor** ve açık/kapalı
durumu hatırlanmıyor; her yüklemede kapalı gelir. Açıklama fazında görünür olur, açmak
hocanın tıklamasına kalır. Optimal ağ da yalnızca kart açıkken çizilir.

**Neden:** Panel, veritabanında bir önceki dersten kalan tura (ör. Tur 3 / reveal)
kilitleniyordu. Optimal kartı ise açıklama sonrası açık kalıyor ve `localStorage` bunu
hatırlayarak bir sonraki derste projeksiyonda açık başlatabiliyordu.

**Etkisi:** Oyun mantığı, senaryo verileri ve puanlama değişmedi.

## [2026-07-10] — İki dillilik (TR/EN) ve panel düzeltmeleri

**Ne değişti:** Tüm arayüz iki dilli oldu. `i18n.js` sözlüğü, `data-i18n` işaretli statik
metinleri ve `t()` ile üretilen dinamik metinleri kapsıyor; senaryo başlıkları, hikâyeleri
ve optimal notları da çevrildi. Dil düğmesi her iki sayfada; seçim tarayıcıda saklanıyor,
ilk açılışta tarayıcı diline bakılıyor. Hoca panelinde: senaryo ağının yüksekliği
sınırlandı, optimal maliyet artık katlanmış bölüm **başlığında görünmüyor** (yalnızca bölüm
açılınca gövdede), ve "Optimali göster" düğmesi "Optimali sınıfa aç" olarak yeniden
adlandırıldı.

**Neden:** Optimal maliyet, bölüm kapalıyken bile projeksiyonda okunuyordu — açıklamadan önce
öğrenciye sızıyordu. Senaryo alanı ekrana sığmıyordu.

**Ağ yüksekliği:** `rowGap` 92 → 74 ve `padY` ayrı `padTop`/`padBot`'a bölündü; çizim
%17–18 kısaldı. Düğüm boyutları ve yazı puntoları **değişmedi** — yalnızca satır arası
boşluk azaldı. (Önce CSS `max-height` denenmişti; o, SVG'yi bütünüyle küçülterek
okunaksız hale getiriyordu.)

**Etkisi:** `fmtMoney` binlik ayıracını dile göre seçiyor ($1.245 / $1,245). Oyun mantığı,
senaryo sayıları, optimal çözümler ve puanlama formülü değişmedi.

**Düzeltilen hata:** "Skorları sıfırla → hepsi" hiçbir şey silmiyordu. Güvenlik kuralları
yazma iznini `scores/$round` seviyesinde verir, `scores` kökünde değil; `db.ref("scores").remove()`
401 dönüyordu ve `.catch()` olmadığı için hata sessizce yutuluyordu. Artık turlar tek tek
siliniyor ve başarısızlık kullanıcıya bildiriliyor.

**Dahil edilmedi:** "Optimali sınıfa aç" düğmesinin kaldırılması. Bu düğme yalnızca paneli
değil, `state.phase`'i `reveal` yaparak **öğrenci telefonlarındaki sonuç ekranını** da
açar; kaldırılsaydı öğrenciler optimumu hiç görmezdi. Bunun yerine adı, ne yaptığını
anlatacak biçimde değiştirildi.

## [2026-07-10] — Hoca paneli yeniden düzenlendi, telefonda okunabilir ağ

**Ne değişti:** Hoca paneli dört katlanabilir satıra ayrıldı (QR / senaryo / sıralama +
histogram / optimal açıklaması); açık-kapalı durumu tarayıcıda hatırlanıyor. Senaryo satırı
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
optimumu sınıfa erken göstermesi riski var; açıklama zaten ayrı bir düğmeye bağlı.

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
