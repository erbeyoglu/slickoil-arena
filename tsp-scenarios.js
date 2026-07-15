// Slick Oil Arena — Gezgin Satıcı Problemi (TSP) senaryoları
//
// Bakım ekibi depodan (0. şehir) çıkar, her durağı tam bir kez ziyaret eder, döner.
// Amaç en kısa tur. Mesafe: TSPLIB EUC_2D → round(sqrt(dx²+dy²)), tamsayı.
//
// Boyutlar büyüktür (20/40/60) ki öğrenci el ile optimumu bulamasın — asıl ders bu.
// Noktalar UNIFORM dağıtılmıştır (jittered grid): kümelenme yok, «dıştan dolaş»
// sezgisi zayıflar. Her instance öğrenci sezgisine (2-opt) karşı direnci ÖLÇÜLEREK
// seçilmiştir.
//
// Optimumlar bir MIP ÇÖZÜCÜ ile KESİN çözülmüştür (PuLP + CBC, DFJ alt-tur eleme).
// Held-Karp DP bu boyutta imkânsızdır (2ⁿ). Doğrulama: tools/tsp-solve.mjs.

const TSP_SCENARIOS = {
  1: {
    key: "r1",
    title: "Tur 1 — Küçük Rota",
    title_en: "Round 1 — Small Route",
    story: "20 durak. Bakım ekibi depodan (D) çıkıp hepsini gezip dönecek. Bu boyutta el ile iyi bir tur bulabilirsin — dene, sonraki turlarda ne olacağını gör.",
    story_en: "20 stops. The crew leaves the depot (D), visits them all, returns. At this size you can find a good tour by hand — try it, then see what happens in the next rounds.",
    cities: [
      [143,350], [918,377], [52,903], [468,539], [439,141], [33,85],
      [949,854], [311,451], [755,554], [919,692], [511,899], [80,688],
      [334,122], [324,584], [917,122], [669,832], [646,462], [469,308],
      [252,859], [726,140]
    ],
    tours: "6×10¹⁶ (17 haneli)",
    tours_en: "6×10¹⁶ (17 digits)",
    optimal: {
      cost: 4357,
      tour: [0, 5, 12, 4, 17, 19, 14, 1, 16, 8, 9, 6, 15, 10, 18, 2, 11, 13, 3, 7],
      note: "Bu boyutta el ile optimuma yaklaşabilirsin («dıştan git, yolları kesiştirme» sezgisi iyi çalışır). Açgözlü strateji (hep en yakın durağa git) 5375 km'de kalır — optimumdan %23.4 uzak. Asıl fark sonraki turlarda ortaya çıkar.",
      note_en: "At this size you can get close to the optimum by hand (the «go around the outside, don't cross paths» instinct works well). The greedy strategy (always go to the nearest stop) stalls at 5375 km — 23.4% above the optimum. The real gap shows up in later rounds."
    },
    greedy: { cost: 5375 }
  },
  2: {
    key: "r2",
    title: "Tur 2 — Büyüyen Saha",
    title_en: "Round 2 — Growing Field",
    story: "40 durak. Tur sayısı 47 haneli bir sayıya çıktı. El ile en iyisini bulmak artık çok zor — süren yeter mi?",
    story_en: "40 stops. The number of tours is now a 47-digit number. Finding the best by hand is very hard now — will your time be enough?",
    cities: [
      [198,772], [71,934], [825,426], [321,365], [687,248], [326,302],
      [507,110], [680,558], [485,294], [606,114], [174,105], [520,802],
      [534,417], [41,542], [217,584], [885,797], [72,773], [43,220],
      [736,898], [190,907], [630,955], [967,45], [632,377], [802,638],
      [327,781], [908,526], [812,731], [895,909], [44,72], [923,407],
      [365,892], [888,201], [603,752], [200,452], [500,940], [833,32],
      [308,41], [774,258], [238,232], [546,525]
    ],
    tours: "10⁴⁶ (47 haneli)",
    tours_en: "10⁴⁶ (47 digits)",
    optimal: {
      cost: 5661,
      tour: [0, 19, 1, 16, 13, 14, 33, 3, 5, 38, 17, 28, 10, 36, 6, 9, 35, 21, 31, 37, 4, 22, 8, 12, 39, 7, 2, 29, 25, 23, 26, 15, 27, 18, 20, 32, 11, 34, 30, 24],
      note: "El ile çizilen turlar tipik olarak optimumun %8-15 üstünde kalır; açgözlü strateji 7193 km (%27.1 sapma). Bu boyutta «kesişmeleri kaldırma» sezgisi bile optimumu garanti etmez. Bir MIP çözücü optimumu saniyeler içinde KESİN bulur.",
      note_en: "Hand-drawn tours typically stay 8-15% above the optimum; the greedy strategy hits 7193 km (27.1% off). At this size even the «remove crossings» instinct does not guarantee the optimum. A MIP solver finds the exact optimum in seconds."
    },
    greedy: { cost: 7193 }
  },
  3: {
    key: "r3",
    title: "Tur 3 — Bütün Ağ",
    title_en: "Round 3 — The Whole Network",
    story: "60 durak. Olası tur sayısı 80 haneli — gözlemlenebilir evrendeki atom sayısı kadar. El ile en iyisini bulmak imkânsız. Yine de en iyi turunu çizmeye çalış.",
    story_en: "60 stops. The number of possible tours has 80 digits — as many as the atoms in the observable universe. Finding the best by hand is impossible. Try your best tour anyway.",
    cities: [
      [82,845], [793,49], [845,530], [585,277], [204,205], [101,92],
      [562,36], [281,815], [813,274], [347,313], [455,662], [40,269],
      [673,792], [305,551], [466,221], [909,53], [283,201], [479,536],
      [460,420], [894,585], [423,283], [681,539], [54,932], [555,820],
      [794,777], [651,278], [439,50], [839,937], [80,729], [524,645],
      [531,427], [818,458], [299,478], [144,591], [162,345], [896,728],
      [835,230], [319,659], [978,807], [151,821], [312,935], [532,529],
      [194,933], [529,932], [832,706], [934,428], [925,913], [161,57],
      [153,707], [205,447], [645,175], [56,526], [478,834], [937,205],
      [411,913], [689,83], [325,19], [697,723], [583,224], [104,163]
    ],
    tours: "7×10⁷⁹ (80 haneli)",
    tours_en: "7×10⁷⁹ (80 digits)",
    optimal: {
      cost: 6624,
      tour: [0, 22, 42, 7, 40, 54, 43, 52, 23, 12, 57, 24, 27, 46, 38, 35, 44, 19, 2, 31, 45, 8, 36, 53, 15, 1, 55, 6, 26, 56, 47, 5, 59, 11, 34, 4, 16, 9, 20, 14, 58, 50, 25, 3, 30, 18, 17, 41, 21, 29, 10, 37, 13, 32, 49, 51, 33, 48, 28, 39],
      note: "80 haneli tur sayısı: saniyede bir trilyon tur deneyen bir bilgisayar bile evrenin yaşının katrilyonlarca katı sürede bitiremez. Ama bu KABA KUVVET. Bir MIP çözücü (dal-kesme + alt tur eleme) aynı optimumu saniyeler içinde KESİN bulur — çünkü akıllı arama, körü körüne saymaktan farklıdır. Açgözlü 8634 km (%30.3). Yöneylem Araştırması tam da bunun için var.",
      note_en: "An 80-digit tour count: even a computer testing a trillion tours per second could not finish in quadrillions of times the age of the universe. But that is BRUTE FORCE. A MIP solver (branch-and-cut + subtour elimination) finds the same optimum in seconds, EXACTLY — because smart search is not blind counting. Greedy 8634 km (30.3%). This is exactly what Operations Research is for."
    },
    greedy: { cost: 8634 }
  }
};

// Yardımcılar ------------------------------------------------------------

function tspDist(scen, i, j) {
  const dx = scen.cities[i][0] - scen.cities[j][0];
  const dy = scen.cities[i][1] - scen.cities[j][1];
  return Math.round(Math.sqrt(dx * dx + dy * dy));
}

function tspEvaluate(scen, tour) {
  const n = scen.cities.length;
  const complete = tour.length === n && new Set(tour).size === n && tour[0] === 0;
  let cost = 0;
  for (let i = 0; i + 1 < tour.length; i++) cost += tspDist(scen, tour[i], tour[i + 1]);
  if (complete) cost += tspDist(scen, tour[tour.length - 1], 0);
  return { cost, feasible: complete, delivered: tour.length, demand: n };
}

function fmtDist(km) {
  const locale = typeof i18nLocale === "function" ? i18nLocale() : "tr-TR";
  return Math.round(km).toLocaleString(locale) + " km";
}
