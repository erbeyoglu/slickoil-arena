// tsp-scenarios.js doğrulaması — büyük n (20/40/60).
//
// Optimumlar bir MIP çözücü ile KESİN çözülmüştür (tools/tsp-mip-solve.py, PuLP+CBC,
// DFJ alt-tur eleme). Bu Node aracı MIP'i tekrar çalıştırmaz (Python bağımlılığı);
// bunun yerine gömülü optimumun MATEMATİKSEL OLARAK TUTARLI olduğunu doğrular:
//
//   1. optimal.tour geçerli: n şehir, depo (0) başta, hepsi benzersiz.
//   2. tspEvaluate(tour) == optimal.cost (gömülü değerlendiriciyle tutarlı).
//   3. Held–Karp 1-tree ALT SINIRI ≤ optimal.cost. Bir alt sınır optimumu AŞAMAZ;
//      aşarsa gömülü değer yanlıştır. (Bağımsız, MIP'ten farklı yöntem.)
//   4. 2-opt sezgisel ÜST SINIRI ≥ optimal.cost. Optimum her turdan küçük/eşittir.
//   5. Alt sınır ≤ optimum ≤ üst sınır aralığı raporlanır (dar = güçlü kanıt).
//   6. greedy.cost = en yakın komşu; hikâye gap sayıları veriyle tutar.
//
// MIP formülasyonunun doğruluğu küçük referanslarda Held–Karp DP ile ayrıca
// kanıtlanmıştır (bkz. tsp-mip-solve.py çıktısı; n≤12'de MIP == DP).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { distMatrix, heldKarpBound, upperBound, nearestNeighbor, tourCost } from "./tsp-lib.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const box = {};
new Function("module", readFileSync(join(ROOT, "tsp-scenarios.js"), "utf8") +
  "\nmodule.exports={TSP_SCENARIOS,tspEvaluate};")(box);
const { TSP_SCENARIOS, tspEvaluate } = box.exports;

let failures = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "OK  " : "FAIL"} ${label}${!ok && detail ? " — " + detail : ""}`);
};

for (const round of Object.keys(TSP_SCENARIOS)) {
  const scen = TSP_SCENARIOS[round];
  const n = scen.cities.length;
  const d = distMatrix(scen.cities);
  const opt = scen.optimal.cost;
  console.log(`\n${"=".repeat(60)}\n${scen.title}  (${n} şehir)`);

  // 1. tur geçerli
  check("optimal.tour geçerli (n şehir, depo başta, benzersiz)",
    scen.optimal.tour.length === n && new Set(scen.optimal.tour).size === n && scen.optimal.tour[0] === 0);

  // 2. değerlendirici tutarlı
  const ev = tspEvaluate(scen, scen.optimal.tour);
  check(`tspEvaluate = optimal.cost (${opt})`, ev.feasible && ev.cost === opt, `${ev.cost}/${ev.feasible}`);
  check("tourCost ile de tutarlı", tourCost(d, scen.optimal.tour) === opt);

  // 3. alt sınır optimumu aşmamalı
  const lb = heldKarpBound(d, 600);
  check(`Held–Karp alt sınırı ≤ optimum  (${lb} ≤ ${opt})`, lb <= opt, `sınır ${lb} > ${opt}`);

  // 4. üst sınır optimumdan küçük olmamalı
  const ub = upperBound(d, Math.min(n, 16));
  check(`2-opt üst sınırı ≥ optimum  (${ub.cost} ≥ ${opt})`, ub.cost >= opt, `üst ${ub.cost} < ${opt}`);

  // 5. aralık
  const gapLo = (100 * (opt - lb) / opt).toFixed(1);
  const gapHi = (100 * (ub.cost - opt) / opt).toFixed(1);
  console.log(`       aralık: alt ${lb} ≤ OPT ${opt} ≤ üst ${ub.cost}  (alt %${gapLo} düşük, üst %${gapHi} yüksek)`);

  // 6. greedy + hikâye
  const nn = nearestNeighbor(d, 0).cost;
  check(`greedy.cost = en yakın komşu (${nn})`, scen.greedy.cost === nn, `beyan ${scen.greedy.cost}`);
  const noteGap = (100 * (nn - opt) / opt).toFixed(1);
  check(`hikâye açgözlü gap %${noteGap} notta geçiyor`,
    scen.optimal.note.includes(`%${noteGap}`) || scen.optimal.note_en.includes(`${noteGap}%`),
    `not "%${noteGap}" içermiyor`);
}

console.log(`\n${"=".repeat(60)}`);
console.log(failures
  ? `${failures} kontrol BAŞARISIZ`
  : "TSP senaryoları tutarlı: her optimum, bağımsız alt/üst sınırların arasında; turlar ve hikâye sayıları veriyle tutuyor. (Kesin optimum: tsp-mip-solve.py)");
process.exitCode = failures ? 1 : 0;
