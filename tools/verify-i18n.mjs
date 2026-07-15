// i18n bütünlük kontrolü — namespace-aware (t() resolver'ıyla aynı mantık).
//
// t() bir anahtarı önce "<problem>.<key>", yoksa çıplak "<key>" olarak çözer
// (bkz. i18n.js). Bu yüzden:
//   - Kullanılan anahtar K karşılanır ⇔ sözlükte K, oil.K veya tsp.K var.
//   - Sözlük anahtarı ölü değildir ⇔ çıplaksa K kodda kullanılıyor; "p.K" ise
//     K kodda kullanılıyor.
//
// Kullanım: node tools/verify-i18n.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => readFileSync(join(ROOT, f), "utf8");

const box = {};
new Function("module", "localStorage", "navigator", "document",
  read("i18n.js") + "\nmodule.exports={I18N};")(
  box, { getItem: () => null, setItem: () => {} }, { language: "tr" }, { documentElement: {} });
const { I18N } = box.exports;

const PROBLEM_KEYS = ["oil", "tsp"];
const FILES = ["index.html", "hoca.html", "network.js", "tsp-network.js", "scenarios.js", "tsp-scenarios.js"];
const DYNAMIC = { "phase.": ["lobby", "live", "closed", "reveal"] };

// --- kodda kullanılan anahtarları topla
const used = new Set();
for (const f of FILES) {
  const src = read(f);
  for (const m of src.matchAll(/\bt(?:All)?\(\s*"([^"]+)"/g)) used.add(m[1]);
  for (const m of src.matchAll(/\bt\([^)]*\?\s*"([^"]+)"\s*:\s*"([^"]+)"/g)) { used.add(m[1]); used.add(m[2]); }
  for (const a of ["data-i18n", "data-i18n-html", "data-i18n-ph", "data-i18n-alt"])
    for (const m of src.matchAll(new RegExp(a + '="([^"]+)"', "g"))) used.add(m[1]);
}
for (const [prefix, suffixes] of Object.entries(DYNAMIC))
  if (used.delete(prefix)) suffixes.forEach((s) => used.add(prefix + s));

const trKeys = new Set(Object.keys(I18N.tr));
const enKeys = new Set(Object.keys(I18N.en));

// Bir sözlük anahtarını çözümle: "tsp.game.hint" → {problem:"tsp", base:"game.hint"}
function parse(dk) {
  for (const p of PROBLEM_KEYS) if (dk.startsWith(p + ".")) return { problem: p, base: dk.slice(p.length + 1) };
  return { problem: null, base: dk };
}
// Kullanılan K karşılanıyor mu?
const satisfied = (k) => trKeys.has(k) || PROBLEM_KEYS.some((p) => trKeys.has(p + "." + k));

let problems = 0;
const report = (label, list) => { if (list.length) { problems += list.length; console.log(`  ${label}: ${list.join(", ")}`); } };

console.log(`Sözlük: tr=${trKeys.size}, en=${enKeys.size} anahtar | kodda kullanılan: ${used.size}\n`);

console.log("1) İki sözlük eşit mi");
report("EN'de eksik", [...trKeys].filter((k) => !enKeys.has(k)));
report("TR'de eksik", [...enKeys].filter((k) => !trKeys.has(k)));
console.log("   " + (problems ? "" : "eşit"));

console.log("\n2) Kullanılan her anahtar karşılanıyor mu (çıplak veya <problem>.<key>)");
const missing = [...used].filter((k) => !satisfied(k));
report("KARŞILANMIYOR", missing);
if (!missing.length) console.log("   hepsi karşılanıyor");

console.log("\n3) Ölü anahtar (sözlükte var, kod hiç kullanmıyor)");
const dead = [...trKeys].filter((dk) => {
  const { base } = parse(dk);
  if (base.startsWith("lang.")) return false;   // lang.* i18n.js içinde kullanılır
  return !used.has(base);
});
report("ölü", dead);
if (!dead.length) console.log("   ölü metin yok");

console.log("\n4) {değişken} isimleri tr/en tutuyor mu");
const vars = (s) => (String(s).match(/\{(\w+)\}/g) || []).sort().join(",");
const mism = [...trKeys].filter((k) => enKeys.has(k) && vars(I18N.tr[k]) !== vars(I18N.en[k]));
report("uyumsuz", mism.map((k) => `${k}[tr:${vars(I18N.tr[k])}|en:${vars(I18N.en[k])}]`));
if (!mism.length) console.log("   uyumlu");

console.log("\n5) Boş çeviri");
const empty = [...trKeys].filter((k) => !String(I18N.tr[k]).trim() || !String(I18N.en[k] ?? "").trim());
report("boş", empty);
if (!empty.length) console.log("   yok");

console.log(problems ? `\n${problems} SORUN` : "\ni18n bütünlüğü tam (namespace dahil).");
process.exitCode = problems ? 1 : 0;
