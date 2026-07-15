// Slick Oil Arena — problem modülü soyutlaması
//
// Site iki optimizasyon oyunu barındırır: "oil" (min-cost flow) ve "tsp" (gezgin
// satıcı). index.html ve hoca.html birer KABUKTUR; probleme özgü her şeyi buradaki
// PROBLEMS[key] modülünden okurlar. Böylece lobi, faz makinesi, teslim akışı,
// tek-teslim kuralı, sıralama ve dil katmanı tek kopya kalır.
//
// Yükleme sırası (her iki HTML'de): firebase-config → i18n → scenarios → network →
// tsp-scenarios → tsp-network → problems → (kabuğun inline script'i). Bu dosya
// aşağıdaki globallere güvenir: SCENARIOS, evaluate, optimalFlowArray, headroom,
// unitCost, fmtMoney (scenarios.js); renderNetwork (network.js); TSP_SCENARIOS,
// tspEvaluate, fmtDist (tsp-scenarios.js); renderTspNetwork (tsp-network.js).
//
// Bir modülün sağladığı arayüz:
//   key            "oil" | "tsp" — Firebase yolu (scores/<key>/rN), state.problem,
//                  localStorage öneki. İKİ PROBLEMDE FARKLI OLMALI (aksi halde
//                  r1/r2/r3 anahtarları çakışır — bkz. risk analizi).
//   scenarios      { 1, 2, 3 } → senaryo objesi
//   roundCount     tur sayısı (HUD "/ N")
//   durations      { 1, 2, 3 } → varsayılan süre (dk)
//   evaluate(scen, sol)      → { cost, feasible, delivered, demand }
//   emptySolution(scen)      → boş/başlangıç çözümü
//   optimalSolution(scen)    → optimal çözüm (reveal çizimi için)
//   optimalCost(scen)        → scen.optimal.cost
//   fmtCost(x)               → "$690" | "334 km"
//   render(svg, scen, sol, ui, onTap) → ev döndürür (renderNetwork imzası)
//   decorateOptimal(svg)     → reveal katmanı stilini uygular
//   onTap(scen, sol, ui, i)  → { sol, ui } (bir SVG elemanına dokunma sonucu)
//   controls                 → kontrol çubuğu betimi (kabuk hangi çubuğu göstereceğini
//                              bundan bilir): { kind: "flow" | "sequence" }
//
// Sözcük dağarcığı: "sol" (solution) = çözüm; "ui" = geçici düzenleme durumu
// (oil: {selected}; tsp: {}). İkisi de saf veridir, kabuk saklar.

const PROBLEMS = {
  oil: {
    key: "oil",
    scenarios: typeof SCENARIOS !== "undefined" ? SCENARIOS : null,
    roundCount: 3,
    durations: { 1: 5, 2: 4, 3: 7 },

    evaluate: (scen, sol) => evaluate(scen, sol),
    emptySolution: (scen) => scen.links.map(() => 0),
    optimalSolution: (scen) => optimalFlowArray(scen),
    optimalCost: (scen) => scen.optimal.cost,
    demand: (scen) => scen.demand,      // hedef teslimat (panel başlığı/hint)
    fmtCost: (x) => fmtMoney(x),

    render: (svg, scen, sol, ui, onTap) =>
      renderNetwork(svg, scen, sol, ui && ui.selected != null ? ui.selected : null, onTap),

    decorateOptimal: (svg) => {
      svg.querySelectorAll(".pipe-on").forEach((p) => p.classList.add("pipe-opt"));
      svg.querySelectorAll(".flowtag").forEach((p) => p.classList.add("flowtag-opt"));
    },

    // Boruya dokunma: seçimi aç/kapat. Çözüm bu adımda değişmez — akış, kontrol
    // çubuğundaki +10/−10/MAX ile değişir (bkz. controls.kind === "flow").
    onTap: (scen, sol, ui, i) => ({
      sol,
      ui: { ...ui, selected: ui && ui.selected === i ? null : i },
    }),

    initialUi: () => ({ selected: null }),

    controls: { kind: "flow" },
  },

  tsp: {
    key: "tsp",
    scenarios: typeof TSP_SCENARIOS !== "undefined" ? TSP_SCENARIOS : null,
    roundCount: 3,
    durations: { 1: 4, 2: 5, 3: 7 },

    evaluate: (scen, sol) => tspEvaluate(scen, sol),
    emptySolution: () => [0], // depo (0) her zaman turun başında
    optimalSolution: (scen) => scen.optimal.tour,
    optimalCost: (scen) => scen.optimal.cost,
    demand: (scen) => scen.cities.length,   // şehir sayısı (depo dahil)
    fmtCost: (x) => fmtDist(x),

    render: (svg, scen, sol, ui, onTap) =>
      renderTspNetwork(svg, scen, sol, ui, onTap),

    decorateOptimal: (svg) => {
      svg.querySelectorAll(".tsp-edge-on").forEach((e) => e.classList.add("tsp-edge-opt"));
    },

    // Şehre dokunma: turda değilse sona ekle. Depoya (0) tekrar dokunmak turu
    // kapatmaz (kapanış otomatik). Zaten turdaki bir şehre dokunmak yok sayılır;
    // geri alma "Geri al" düğmesiyle yapılır (controls.kind === "sequence").
    onTap: (scen, sol, ui, i) => {
      if (i === 0 || sol.includes(i)) return { sol, ui };
      return { sol: [...sol, i], ui };
    },

    initialUi: () => ({}),

    controls: { kind: "sequence" },
  },
};

// Node testleri için dışa aktarım (tarayıcıda PROBLEMS global kalır).
if (typeof module !== "undefined" && module.exports) {
  module.exports = { PROBLEMS };
}
