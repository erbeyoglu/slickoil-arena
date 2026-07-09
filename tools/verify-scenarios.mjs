// Senaryo verisi bütünlük testi — bağımlılıksız, build'siz.
// Kullanım:  node tools/verify-scenarios.mjs
//
// WHY: scenarios.js içindeki optimumlar LP (min-cost flow) ile ayrıca çözülmüştür.
// Bu script LP'yi tekrar çözmez; yalnızca dosyada BEYAN EDİLEN optimal akışın
// gerçekten uygulanabilir olduğunu ve beyan edilen maliyeti verdiğini doğrular.
// Senaryo verisi elle düzenlenirse ilk yakalayacak yer burasıdır.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// scenarios.js tarayıcı için yazılmış (module değil), bu yüzden değerlendirip dışa aktarıyoruz.
const src = readFileSync(join(ROOT, "scenarios.js"), "utf8");
const box = {};
new Function("module", src + "\nmodule.exports = { SCENARIOS, evaluate, optimalFlowArray };")(box);
const { SCENARIOS, evaluate, optimalFlowArray } = box.exports;

// LP ile doğrulanmış referans değerler — bu sayılar değişmemelidir.
const EXPECTED_COST = { 1: 690, 2: 920, 3: 1245 };

let failures = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "OK  " : "FAIL"} ${label}${!ok && detail ? " — " + detail : ""}`);
};

for (const round of Object.keys(SCENARIOS)) {
  const scen = SCENARIOS[round];
  console.log(`\n${scen.title}`);

  const missing = scen.optimal.flows.filter(
    ([w, r]) => scen.links.findIndex(([lw, lr]) => lw === w && lr === r) < 0
  );
  check("optimal.flows'daki her hat links içinde tanımlı", missing.length === 0, JSON.stringify(missing));

  const flows = optimalFlowArray(scen);
  const ev = evaluate(scen, flows);

  check(`talep karşılanıyor (${ev.delivered}/${scen.demand})`, ev.delivered === scen.demand);
  check("kapasiteler aşılmıyor ve çözüm uygulanabilir", ev.feasible);
  check("akışlar step katı", flows.every(f => f % scen.step === 0));
  check(
    `maliyet = $${EXPECTED_COST[round]} (LP referansı)`,
    ev.cost === EXPECTED_COST[round],
    `hesaplanan $${ev.cost}`
  );
  check(
    "scenarios.js içindeki optimal.cost hesaplananla aynı",
    scen.optimal.cost === ev.cost,
    `beyan $${scen.optimal.cost} vs hesap $${ev.cost}`
  );
}

console.log(failures ? `\n${failures} kontrol BAŞARISIZ` : "\nTüm senaryolar doğrulandı.");
process.exitCode = failures ? 1 : 0;
