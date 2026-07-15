// Slick Oil Arena — Gezgin Satıcı Problemi (TSP) senaryoları
//
// Hikâye Slick Oil evreninde geçer: bakım ekibi depodan çıkar, her kuyuyu tam bir kez
// ziyaret eder ve depoya döner. Amaç en kısa turu bulmaktır. Mesafe birimi km.
//
// Mesafe: TSPLIB EUC_2D standardı → round(sqrt(dx² + dy²)). Tamsayıdır; yuvarlama
// belirsizliği yoktur ve optimum kesin bir tamsayıdır.
//
// Optimumlar ÜÇ BAĞIMSIZ KESİN yöntemle doğrulanmıştır (bkz. tools/tsp-solve.mjs):
//   1. Held–Karp dinamik programlama  — O(2ⁿ·n²), kesin
//   2. Dal-sınır (MST alt sınırı ile) — kesin, tamamen farklı kod yolu
//   3. Kaba kuvvet                    — yalnızca n = 6 için (60 tur)
// Ayrıca Held–Karp ALT SINIRI (1-tree + Lagrange gevşetmesi) üç senaryoda da optimuma
// eşittir; bu, çözücünün doğruluğundan bağımsız bir optimallik sertifikasıdır.
//
// UYARI: "Held–Karp" iki ayrı şeyin adıdır. Yukarıdaki (1) KESİN bir dinamik
// programlamadır. "Held–Karp sınırı" ise bir ALT SINIRDIR ve sezgisellerin/dal-sınırın
// içinde kullanılır; tek başına optimum vermez. Burada ikisi de, ayrı amaçlarla kullanılır.
//
// Turların tamamı için tur sayısı = (n−1)! / 2  (depo sabit, ayna turları aynı sayılır).

const TSP_SCENARIOS = {
  1: {
    key: "r1",
    title: "Tur 1 — Bakım Turu",
    title_en: "Round 1 — Maintenance Run",
    story: "Bakım ekibi depodan (D) çıkacak, 5 kuyunun her birine tam bir kez uğrayacak ve depoya dönecek. Kuyulara ziyaret sırasına göre dokun. En kısa turu bulabilir misin?",
    story_en: "The maintenance crew leaves the depot (D), visits each of the 5 wells exactly once, and returns. Tap the wells in the order you want to visit them. Can you find the shortest tour?",
    // [x, y] — 0..100 ızgarası. 0. şehir DEPODUR.
    cities: [[71, 48], [68, 81], [53, 33], [73, 12], [22, 44], [43, 56]],
    tours: "60",
    optimal: {
      cost: 190,
      tour: [0, 3, 2, 4, 5, 1],
      note: "Tek bir optimal tur var: D→3→2→4→5→1→D. Açgözlü strateji (\"hep en yakın kuyuya git\") 233 km'de kalır — optimumdan %22.6 uzak. Yalnızca 60 farklı tur olduğu için el ile bulunabilir. Asıl mesele sonraki turda.",
      note_en: "There is exactly one optimal tour: D→3→2→4→5→1→D. The greedy strategy (\"always go to the nearest well\") stalls at 233 km — 22.6% above the optimum. With only 60 possible tours you can find it by hand. The real lesson comes next round."
    },
    greedy: { cost: 233 }
  },

  2: {
    key: "r2",
    title: "Tur 2 — Saha Genişledi",
    title_en: "Round 2 — The Field Grew",
    story: "Saha büyüdü: 11 kuyu. Tur sayısı 60'tan 20 milyona çıktı. Sezgin hâlâ işe yarıyor mu?",
    story_en: "The field has grown: 11 wells. The number of possible tours jumped from 60 to 20 million. Does your intuition still hold?",
    cities: [[90, 74], [9, 74], [28, 58], [51, 18], [76, 58], [76, 41], [42, 76], [61, 82], [36, 42], [87, 22], [21, 25], [16, 92]],
    tours: "19.958.400",
    optimal: {
      cost: 293,
      tour: [0, 7, 6, 11, 1, 2, 8, 10, 3, 9, 5, 4],
      note: "19.958.400 farklı tur var. Bir insan için imkânsız; bir bilgisayar için, saniyede bir milyon tur denerse, yalnızca 20 saniye. Açgözlü strateji 384 km'de kalır (%31.1 sapma). Şehir sayısı biraz daha artınca ne olduğunu sonraki turda göreceğiz.",
      note_en: "There are 19,958,400 distinct tours. Impossible for a human; for a computer testing a million tours per second, just 20 seconds. The greedy strategy stalls at 384 km (31.1% off). Next round we will see what happens when the city count grows a little more."
    },
    greedy: { cost: 384 }
  },

  3: {
    key: "r3",
    title: "Tur 3 — Bütün Saha",
    title_en: "Round 3 — The Whole Field",
    story: "17 kuyu. Sadece 6 kuyu eklendi — ama tur sayısı 20 milyondan 177 trilyona çıktı. Yine de en iyisini bulmaya çalış.",
    story_en: "17 wells. Only six more than last round — yet the number of tours went from 20 million to 177 trillion. Try to find the best one anyway.",
    cities: [[64, 78], [71, 12], [43, 37], [14, 86], [76, 64], [35, 69], [56, 43], [79, 32], [82, 78], [88, 63], [23, 23], [67, 31], [63, 91], [9, 42], [83, 90], [85, 48], [39, 81], [18, 59]],
    tours: "177.843.714.048.000",
    optimal: {
      cost: 334,
      tour: [0, 16, 5, 3, 17, 13, 10, 2, 6, 11, 1, 7, 15, 9, 4, 8, 14, 12],
      note: "Geçen turda 6 kuyu daha az vardı ve kaba kuvvet 20 saniye sürüyordu. Şimdi 177.843.714.048.000 tur var: aynı bilgisayar 5,6 YIL çalışır. Açgözlü strateji 427 km'de kalır (%27.8 sapma). Held–Karp dinamik programlaması ise aramayı 2ⁿ·n²'ye indirir (85 milyon işlem) ve optimumu çeyrek saniyede bulur. Üstel bir uzayı taramakla, o uzayı kırmak aynı şey değildir. Yöneylem Araştırması bunun için var.",
      note_en: "Last round had six fewer wells and brute force took 20 seconds. Now there are 177,843,714,048,000 tours: the same computer would run for 5.6 YEARS. The greedy strategy stalls at 427 km (27.8% off). Held–Karp dynamic programming shrinks the search to 2ⁿ·n² (85 million operations) and finds the optimum in a quarter of a second. Searching an exponential space and breaking it are not the same thing. That is what Operations Research is for."
    },
    greedy: { cost: 427 }
  }
};

// Yardımcılar ------------------------------------------------------------

// TSPLIB EUC_2D: tamsayı mesafe.
function tspDist(scen, i, j) {
  const dx = scen.cities[i][0] - scen.cities[j][0];
  const dy = scen.cities[i][1] - scen.cities[j][1];
  return Math.round(Math.sqrt(dx * dx + dy * dy));
}

// Çözüm = ziyaret sırası. Depo (0) dizinin başındadır ve sonda tekrar EDİLMEZ;
// tur tamamlandığında kapanış kenarı otomatik eklenir.
// Örn. [0, 3, 2] → depo → 3 → 2 (henüz kapanmadı, kısmi tur).
function tspEvaluate(scen, tour) {
  const n = scen.cities.length;
  const complete = tour.length === n && new Set(tour).size === n && tour[0] === 0;

  let cost = 0;
  for (let i = 0; i + 1 < tour.length; i++) cost += tspDist(scen, tour[i], tour[i + 1]);
  if (complete) cost += tspDist(scen, tour[tour.length - 1], 0);   // depoya dön

  return { cost, feasible: complete, delivered: tour.length, demand: n };
}

// Mesafe biçimi. Slick Oil'deki fmtMoney'nin karşılığı.
function fmtDist(km) {
  const locale = typeof i18nLocale === "function" ? i18nLocale() : "tr-TR";
  return Math.round(km).toLocaleString(locale) + " km";
}
