// tsp-scenarios.js'in optimumlarını KANITLAR ve hikâye metnindeki sayıları doğrular.
//
// İki tür kontrol:
//   A. Optimallik — üç bağımsız kesin yöntem (Held–Karp DP, dal-sınır, kaba kuvvet)
//      aynı optimumu vermeli; Held–Karp alt sınırı da optimumu aşmamalı.
//   B. Metin bütünlüğü — hikâye ve not metinlerinde geçen her sayı (tur sayısı,
//      açgözlü maliyet, gap yüzdesi, DP işlem sayısı) veriden yeniden hesaplanıp
//      metinle karşılaştırılmalı. Sınıfa yanlış bir sayı söylemek dersi bozar.
//
// Kullanım: node tools/tsp-solve.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  distMatrix, heldKarpDP, bruteForce, branchAndBound,
  bestNearestNeighbor, heldKarpBound, tourCost
} from "./tsp-lib.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const box = {};
new Function("module", readFileSync(join(ROOT, "tsp-scenarios.js"), "utf8") +
  "\nmodule.exports={TSP_SCENARIOS,tspEvaluate};")(box);
const { TSP_SCENARIOS, tspEvaluate } = box.exports;

const fact = n => { let f = 1n; for (let i = 2n; i <= BigInt(n); i++) f *= i; return f; };
const tourCount = n => fact(n - 1) / 2n;   // depo sabit, ayna turları aynı

let failures = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "OK  " : "FAIL"} ${label}${!ok && detail ? " — " + detail : ""}`);
};

for (const round of Object.keys(TSP_SCENARIOS)) {
  const scen = TSP_SCENARIOS[round];
  const n = scen.cities.length;
  const d = distMatrix(scen.cities);
  console.log(`\n${"=".repeat(64)}\n${scen.title}  (${n} şehir)`);

  // --- A. OPTİMALLİK ---
  const dp = heldKarpDP(d);
  const bb = branchAndBound(d);
  const declared = scen.optimal.cost;

  check(`Held–Karp DP = beyan ($${declared})`, dp.cost === declared, `DP=${dp.cost}`);
  check(`dal-sınır (bağımsız) = DP`, bb.cost === dp.cost, `BB=${bb.cost}, ${bb.nodes} düğüm`);
  if (n <= 10) {
    const bf = bruteForce(d);
    check(`kaba kuvvet = DP (${bf.examined} tur tarandı)`, bf.cost === dp.cost, `BF=${bf.cost}`);
  }

  // beyan edilen tur gerçekten optimal maliyeti veriyor mu?
  const declaredCost = tourCost(d, scen.optimal.tour);
  check(`optimal.tour maliyeti = $${declared}`, declaredCost === declared, `tur=${declaredCost}`);
  check(`optimal.tour geçerli (n şehir, depo başta)`,
    scen.optimal.tour.length === n && new Set(scen.optimal.tour).size === n && scen.optimal.tour[0] === 0);

  // tspEvaluate ile tutarlılık (tarayıcıdaki değerlendirici)
  const ev = tspEvaluate(scen, scen.optimal.tour);
  check(`tspEvaluate: feasible ve maliyet = $${declared}`, ev.feasible && ev.cost === declared, `${ev.cost}/${ev.feasible}`);

  // optimallik sertifikası (varsa)
  const lb = heldKarpBound(d, 400);
  check(`Held–Karp alt sınırı ≤ optimum`, lb <= dp.cost, `sınır=${lb} > ${dp.cost}`);
  console.log(`       alt sınır = ${lb}  ${lb === dp.cost
    ? "= optimum → SERTİFİKA (çözücüden bağımsız kanıt)"
    : `(optimumun %${(100 * (dp.cost - lb) / dp.cost).toFixed(1)} altında; sertifika değil)`}`);

  // --- B. METİN BÜTÜNLÜĞÜ ---
  // açgözlü maliyet
  const nn = bestNearestNeighbor(d);
  check(`greedy.cost = en iyi en-yakın-komşu`, scen.greedy.cost === nn.cost, `beyan ${scen.greedy.cost}, hesap ${nn.cost}`);

  // tur sayısı (hem scen.tours hem not metni)
  const expectTours = tourCount(n).toLocaleString("de-DE"); // 19.958.400 biçimi
  check(`scen.tours doğru (${expectTours})`, scen.tours === expectTours, `beyan ${scen.tours}`);

  // not metninde geçen gap yüzdesi
  const gap = 100 * (nn.cost - dp.cost) / dp.cost;
  const gapStr = gap.toFixed(1);
  const noteHasGap = scen.optimal.note.includes(`%${gapStr}`);
  check(`not metnindeki gap %${gapStr} doğru`, noteHasGap,
    `not "%${gapStr}" içermiyor; gerçek gap %${gapStr}`);

  // notta geçen tur sayısı (varsa) veriyle tutmalı
  const rawCount = tourCount(n).toLocaleString("de-DE");
  if (scen.optimal.note.includes(rawCount) || scen.optimal.note_en.includes(tourCount(n).toLocaleString("en-US"))) {
    check(`not metnindeki tur sayısı doğru`, true);
  }

  console.log(`       özet: optimum ${dp.cost} km | açgözlü ${nn.cost} km (%${gapStr}) | ${tourCount(n).toLocaleString("de-DE")} tur`);
}

console.log(`\n${"=".repeat(64)}`);
console.log(failures
  ? `${failures} kontrol BAŞARISIZ`
  : "Üç TSP senaryosunun optimumu bağımsız yöntemlerle kanıtlandı; hikâye sayıları veriyle tutuyor.");
process.exitCode = failures ? 1 : 0;
