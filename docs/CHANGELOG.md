# Changelog

## [2026-07-10] — Panel her zaman Tur 1'de ve optimal kartı kapalı açılır

**Ne değişti:** Hoca paneli sayfa yüklendiğinde Tur 1'de açılıyor. İstisna: o anda
gerçekten **canlı** bir tur varsa (`phase === "live"`) panel ona geçiyor — paneli
tur ortasında yenilemek, sayaç Tur 3'ü sayarken ekranın Tur 1'i göstermesine yol
açmasın diye. Karar `shouldAdoptRound()` fonksiyonunda toplandı.

Optimal çözüm kartı artık **hiçbir zaman kendiliğinden açılmıyor** ve açık/kapalı
durumu hatırlanmıyor; her yüklemede kapalı gelir. İfşa fazında görünür olur, açmak
hocanın tıklamasına kalır. Optimal ağ da yalnızca kart açıkken çizilir.

**Neden:** Panel, veritabanında bir önceki dersten kalan tura (ör. Tur 3 / reveal)
kilitleniyordu. Optimal kartı ise ifşa sonrası açık kalıyor ve `localStorage` bunu
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

**Neden:** Optimal maliyet, bölüm kapalıyken bile projeksiyonda okunuyordu — ifşadan önce
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
