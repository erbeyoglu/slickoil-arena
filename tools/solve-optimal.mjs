// Senaryoların optimal maliyetini KANITLAR — beyan edileni doğrulamakla yetinmez.
//
// Problem bir min-cost flow: kaynak → kuyular (kapasite) → boru hatları (birim maliyet
// = kuyu + rafineri) → rafineriler (kapasite) → hedef. `demand` birim akış itilir.
//
// Yöntem: ardışık en kısa yollar (successive shortest paths) + düğüm potansiyelleri
// (Bellman-Ford ile başlatılır, sonra Dijkstra). Tüm kapasiteler ve talep tam sayı
// olduğundan çözüm tam sayıdır. Algoritma bittiğinde artık grafta negatif maliyetli
// çevrim kalmaz — bu, LP dualitesi gereği OPTİMALLİK KANITIDIR. Ayrıca aşağıda
// tamamlayıcı gevşeklik (complementary slackness) koşulları ayrıca sınanır.
//
// Ölçekleme: maliyetler 2.5 gibi ondalıklı; ×2 ile tam sayıya çevrilir (COST_SCALE).
// Kapasiteler ve talep 10'un katı; ÷10 ile çalışılır (FLOW_SCALE) — böylece bulunan
// optimal akış otomatik olarak 10'un katıdır, yani oyun içinde erişilebilirdir.
//
// Kullanım: node tools/solve-optimal.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const box = {};
new Function("module", readFileSync(join(ROOT, "scenarios.js"), "utf8") +
  "\nmodule.exports={SCENARIOS,evaluate,optimalFlowArray};")(box);
const { SCENARIOS, evaluate, optimalFlowArray } = box.exports;

const COST_SCALE = 2;   // 2.5 → 5
const FLOW_SCALE = 10;  // 40 → 4
const INF = Number.MAX_SAFE_INTEGER;

// === MIN-COST FLOW (SSP + potansiyeller) ===

class MinCostFlow {
  constructor(n) {
    this.n = n;
    this.g = Array.from({ length: n }, () => []);
  }
  addEdge(u, v, cap, cost) {
    this.g[u].push({ to: v, cap, cost, rev: this.g[v].length });
    this.g[v].push({ to: u, cap: 0, cost: -cost, rev: this.g[u].length - 1 });
  }
  // s'den t'ye tam olarak `need` akış iter; [maliyet, itilen] döndürür.
  run(s, t, need) {
    const { n, g } = this;
    const h = new Array(n).fill(0);   // düğüm potansiyelleri
    let flow = 0, cost = 0;

    // Tüm maliyetler >= 0 (birim maliyet = kuyu + rafineri, ikisi de pozitif),
    // bu yüzden h = 0 ile başlamak güvenli; Bellman-Ford gerekmiyor.
    while (flow < need) {
      const dist = new Array(n).fill(INF);
      const inQueue = new Array(n).fill(false);
      const prevV = new Array(n).fill(-1);
      const prevE = new Array(n).fill(-1);
      dist[s] = 0;

      // Dijkstra (küçük graf; O(n^2) yeterli ve heap hatası riski yok)
      for (;;) {
        let u = -1, best = INF;
        for (let i = 0; i < n; i++) if (!inQueue[i] && dist[i] < best) { best = dist[i]; u = i; }
        if (u === -1) break;
        inQueue[u] = true;
        for (let ei = 0; ei < g[u].length; ei++) {
          const e = g[u][ei];
          if (e.cap <= 0) continue;
          const nd = dist[u] + e.cost + h[u] - h[e.to];
          if (nd < dist[e.to]) { dist[e.to] = nd; prevV[e.to] = u; prevE[e.to] = ei; }
        }
      }
      if (dist[t] === INF) break; // artık yol yok

      for (let i = 0; i < n; i++) if (dist[i] < INF) h[i] += dist[i];

      // darboğaz
      let push = need - flow;
      for (let v = t; v !== s; v = prevV[v]) push = Math.min(push, g[prevV[v]][prevE[v]].cap);
      for (let v = t; v !== s; v = prevV[v]) {
        const e = g[prevV[v]][prevE[v]];
        e.cap -= push;
        g[v][e.rev].cap += push;
      }
      flow += push;
      cost += push * h[t];
    }
    this.potentials = h;
    return [cost, flow];
  }
}

// === Senaryoyu ağa çevir ===
// düğümler: 0 = kaynak, 1..W = kuyular, W+1..W+R = rafineriler, son = hedef
function build(scen) {
  const W = scen.wells.length, R = scen.refs.length;
  const S = 0, T = W + R + 1;
  const mcf = new MinCostFlow(T + 1);
  const linkEdge = [];

  scen.wells.forEach((w, i) => mcf.addEdge(S, 1 + i, w.cap / FLOW_SCALE, 0));
  scen.refs.forEach((r, j) => mcf.addEdge(1 + W + j, T, r.cap / FLOW_SCALE, 0));

  scen.links.forEach(([wi, ri], li) => {
    const unit = (scen.wells[wi].cost + scen.refs[ri].cost) * COST_SCALE;
    const cap = Math.min(scen.wells[wi].cap, scen.refs[ri].cap) / FLOW_SCALE;
    const u = 1 + wi;
    linkEdge[li] = { u, idx: mcf.g[u].length };
    mcf.addEdge(u, 1 + W + ri, cap, unit);
  });

  return { mcf, S, T, W, R, linkEdge };
}

function solve(scen) {
  const { mcf, S, T, linkEdge } = build(scen);
  const [scaledCost, scaledFlow] = mcf.run(S, T, scen.demand / FLOW_SCALE);

  // Akışı geri ölçekle: gönderilen = orijinal kap - kalan kap
  const flows = scen.links.map((_, li) => {
    const { u, idx } = linkEdge[li];
    const e = mcf.g[u][idx];
    const sent = mcf.g[e.to][e.rev].cap; // ters kenardaki kapasite = itilen akış
    return sent * FLOW_SCALE;
  });

  return {
    cost: (scaledCost * FLOW_SCALE) / COST_SCALE,
    delivered: scaledFlow * FLOW_SCALE,
    flows,
    potentials: mcf.potentials,
    mcf
  };
}

// === Optimallik sertifikası: artık grafta negatif indirgenmiş maliyet var mı? ===
// Bir min-cost akış, ancak ve ancak artık graf negatif maliyetli çevrim içermiyorsa
// optimaldir. Potansiyeller h ile: her artık kenar için c(u,v) + h[u] - h[v] >= 0.
function certifyOptimal(mcf) {
  const h = mcf.potentials;
  const violations = [];
  for (let u = 0; u < mcf.n; u++) {
    for (const e of mcf.g[u]) {
      if (e.cap <= 0) continue;                 // yalnızca artık kapasitesi olan kenarlar
      if (h[u] === undefined || h[e.to] === undefined) continue;
      const reduced = e.cost + h[u] - h[e.to];
      if (reduced < 0) violations.push({ u, v: e.to, reduced });
    }
  }
  return violations;
}

// === Bağımsız alt sınır: LP zayıf dualitesi ===
//
// WHY: yukarıdaki sertifika, çözücünün kendi ürettiği potansiyellere ve artık grafa
// güvenir. Çözücüde bir hata olsa sertifika da onunla birlikte yanılabilir. Zayıf
// dualite ise bunu bağımsız kapatır: HERHANGİ bir π potansiyel vektörü için
//
//     min-maliyet  >=  F·(π_t − π_s)  −  Σ_e  u_e · [ −(c_e + π_u − π_v) ]₊
//
// eşitsizliği, akışın optimal olup olmadığından bağımsız olarak DAİMA doğrudur.
// (Türetimi: kapasite kısıtlarını π ile gevşetip Lagrange duali alınır.)
// Sağ taraf, beyan edilen çözümün maliyetine EŞİT çıkarsa, o çözümden daha ucuzu
// olamaz — yani beyan edilen çözüm optimaldir. Bu, ölçekli tam sayı aritmetiğiyle
// yapılır; yuvarlama hatası yoktur.
function dualLowerBound(scen, h) {
  const W = scen.wells.length;
  const S = 0, T = W + scen.refs.length + 1;
  const F = scen.demand / FLOW_SCALE;

  // Orijinal (artık olmayan) kenarlar: (u, v, kapasite, maliyet)
  const edges = [];
  scen.wells.forEach((w, i) => edges.push([S, 1 + i, w.cap / FLOW_SCALE, 0]));
  scen.refs.forEach((r, j) => edges.push([1 + W + j, T, r.cap / FLOW_SCALE, 0]));
  scen.links.forEach(([wi, ri]) => {
    const unit = (scen.wells[wi].cost + scen.refs[ri].cost) * COST_SCALE;
    const cap = Math.min(scen.wells[wi].cap, scen.refs[ri].cap) / FLOW_SCALE;
    edges.push([1 + wi, 1 + W + ri, cap, unit]);
  });

  let penalty = 0;
  for (const [u, v, cap, c] of edges) {
    const reduced = c + h[u] - h[v];
    if (reduced < 0) penalty += cap * (-reduced);   // [·]₊
  }
  const scaledLB = F * (h[T] - h[S]) - penalty;
  return (scaledLB * FLOW_SCALE) / COST_SCALE;      // gerçek para birimine geri ölçekle
}

// === Çalıştır ===
const EXPECTED = { 1: 690, 2: 920, 3: 1245 };
let failures = 0;

for (const round of Object.keys(SCENARIOS)) {
  const scen = SCENARIOS[round];
  console.log(`\n${"=".repeat(64)}\n${scen.title}  (talep ${scen.demand})`);

  const sol = solve(scen);
  const declared = scen.optimal.cost;

  // 1) solver talebi karşılayabildi mi?
  const feasible = sol.delivered === scen.demand;
  console.log(`  solver teslimatı        : ${sol.delivered} / ${scen.demand} ${feasible ? "" : "← UYGUN ÇÖZÜM YOK"}`);

  // 2) optimallik sertifikası
  const violations = certifyOptimal(sol.mcf);
  console.log(`  optimallik sertifikası  : ${violations.length === 0
    ? "artık grafta negatif indirgenmiş maliyetli kenar YOK → optimal"
    : `${violations.length} İHLAL (!)`}`);

  // 3) solver'ın bulduğu maliyet
  console.log(`  solver optimal maliyet  : $${sol.cost}`);
  console.log(`  scenarios.js'te yazan   : $${declared}`);
  console.log(`  LP referansı (beklenen) : $${EXPECTED[round]}`);

  // 4) beyan edilen çözüm gerçekten optimal mi?
  const declaredEval = evaluate(scen, optimalFlowArray(scen));
  const match = sol.cost === declared && declared === EXPECTED[round] && declaredEval.cost === sol.cost;
  console.log(`  beyan edilen çözüm      : maliyet $${declaredEval.cost}, uygun=${declaredEval.feasible}`);

  // 5) solver'ın akışı 10'un katı mı (oyun içinde erişilebilir mi)
  const stepOk = sol.flows.every(f => f % scen.step === 0);
  console.log(`  solver akışları 10'un katı: ${stepOk}`);

  // 6) çözücüden BAĞIMSIZ alt sınır (LP zayıf dualitesi)
  const lb = dualLowerBound(scen, sol.potentials);
  const lbProves = lb === declaredEval.cost;
  console.log(`  dual alt sınır          : $${lb}  ${lbProves
    ? "= beyan edilen maliyet → daha ucuzu MATEMATİKSEL OLARAK İMKANSIZ"
    : `≠ $${declaredEval.cost} (!) alt sınır ispatı başarısız`}`);

  const ok = feasible && violations.length === 0 && match && stepOk && declaredEval.feasible && lbProves;
  if (!ok) failures++;
  console.log(`  SONUÇ: ${ok ? "OPTİMALLİK KANITLANDI" : "SORUN VAR"}`);

  if (sol.cost !== declared) {
    console.log(`\n  !! scenarios.js $${declared} diyor, solver $${sol.cost} buldu.`);
    console.log(`  solver'ın çözümü:`);
    sol.flows.forEach((f, li) => {
      if (f > 0) {
        const [w, r] = scen.links[li];
        console.log(`    Kuyu ${scen.wells[w].name} → Rafineri ${scen.refs[r].name}: ${f} varil @ $${scen.wells[w].cost + scen.refs[r].cost}`);
      }
    });
  }
}

console.log(`\n${"=".repeat(64)}`);
console.log(failures ? `${failures} senaryoda SORUN VAR` : "Üç senaryonun da optimal maliyeti bağımsız bir min-cost flow çözücüsüyle kanıtlandı.");
process.exitCode = failures ? 1 : 0;
