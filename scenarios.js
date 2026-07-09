// Slick Oil Arena — senaryo verileri
// Orijinal oyun: Michael Watson (Opex Analytics / LLamasoft), web versiyonu: Rémi Lequette
// Bu genişletilmiş sürüm: IE101 sınıf yarışması için hazırlanmıştır.
// Optimal çözümler LP (min-cost flow) ile önceden hesaplanmıştır.

const SCENARIOS = {
  1: {
    key: "r1",
    title: "Tur 1 — Kuruluş",
    story: "Slick Oil'in yeni operasyon müdürüsünüz. Müşteriye 100 varil ulaştırın — en düşük maliyetle. Birim maliyet = kuyu maliyeti + rafineri maliyeti.",
    demand: 100,
    step: 10,
    wells: [
      { name: "1", cost: 3,   cap: 40 },
      { name: "2", cost: 12,  cap: 50 },
      { name: "3", cost: 4,   cap: 40 },
      { name: "4", cost: 6,   cap: 100 },
      { name: "5", cost: 10,  cap: 100 },
      { name: "6", cost: 2.5, cap: 100 }
    ],
    refs: [
      { name: "A", cost: 4, cap: 100 },
      { name: "B", cost: 2, cap: 40 },
      { name: "C", cost: 6, cap: 80 },
      { name: "D", cost: 1, cap: 100 },
      { name: "E", cost: 8, cap: 80 }
    ],
    links: [[0,0],[0,1],[1,1],[1,2],[1,3],[2,1],[2,2],[2,4],[3,0],[3,4],[4,3],[4,4],[5,2],[5,4]],
    optimal: {
      cost: 690,
      flows: [[0,0,40],[2,1,40],[5,2,20]], // [wellIdx, refIdx, akış]
      note: "Açgözlü strateji en ucuz hattı (1→B, $5) kapar ve $710'da kalır. Optimal, B'nin kıt kapasitesini Kuyu 3'e verir."
    }
  },

  2: {
    key: "r2",
    title: "Tur 2 — Kriz",
    story: "KRİZ! En ucuz kuyunuz (Kuyu 6) arızalandı ve tamamen devre dışı. Üstelik müşteri talebi 120 varile çıktı. Aynı ağ, yeni gerçekler.",
    demand: 120,
    step: 10,
    wells: [
      { name: "1", cost: 3,   cap: 40 },
      { name: "2", cost: 12,  cap: 50 },
      { name: "3", cost: 4,   cap: 40 },
      { name: "4", cost: 6,   cap: 100 },
      { name: "5", cost: 10,  cap: 100 },
      { name: "6", cost: 2.5, cap: 0, broken: true }
    ],
    refs: [
      { name: "A", cost: 4, cap: 100 },
      { name: "B", cost: 2, cap: 40 },
      { name: "C", cost: 6, cap: 80 },
      { name: "D", cost: 1, cap: 100 },
      { name: "E", cost: 8, cap: 80 }
    ],
    links: [[0,0],[0,1],[1,1],[1,2],[1,3],[2,1],[2,2],[2,4],[3,0],[3,4],[4,3],[4,4],[5,2],[5,4]],
    optimal: {
      cost: 920,
      flows: [[0,0,40],[2,1,40],[3,0,40]],
      note: "Aynı tuzak yine kurulu: 1→B ($5) cazip görünür ama açgözlü yaklaşım $1000'e çıkar. Optimal $920."
    }
  },

  3: {
    key: "r3",
    title: "Tur 3 — Büyüme",
    story: "Şirket yeni bir saha satın aldı: 10 kuyu, 8 rafineri, 34 boru hattı. Talep 250 varil. Gerçek dünya problemleri böyle görünür — bol şans.",
    demand: 250,
    step: 10,
    wells: [
      { name: "1",  cost: 3,   cap: 30 },
      { name: "2",  cost: 12,  cap: 30 },
      { name: "3",  cost: 10,  cap: 50 },
      { name: "4",  cost: 2.5, cap: 80 },
      { name: "5",  cost: 9,   cap: 60 },
      { name: "6",  cost: 4,   cap: 80 },
      { name: "7",  cost: 2,   cap: 40 },
      { name: "8",  cost: 2.5, cap: 30 },
      { name: "9",  cost: 12,  cap: 30 },
      { name: "10", cost: 3,   cap: 40 }
    ],
    refs: [
      { name: "A", cost: 2, cap: 50 },
      { name: "B", cost: 7, cap: 100 },
      { name: "C", cost: 8, cap: 120 },
      { name: "D", cost: 2, cap: 60 },
      { name: "E", cost: 6, cap: 40 },
      { name: "F", cost: 4, cap: 40 },
      { name: "G", cost: 1, cap: 80 },
      { name: "H", cost: 5, cap: 120 }
    ],
    links: [
      [0,0],[0,2],[0,4],[0,6],
      [1,5],[1,6],
      [2,0],[2,2],[2,3],
      [3,0],[3,1],[3,3],[3,6],
      [4,1],[4,3],[4,6],[4,7],
      [5,2],[5,6],[5,7],
      [6,0],[6,2],[6,3],[6,4],
      [7,0],[7,4],[7,6],
      [8,1],[8,2],[8,5],[8,7],
      [9,4],[9,5],[9,6]
    ],
    optimal: {
      cost: 1245,
      flows: [[0,0,30],[3,3,40],[3,6,40],[5,6,10],[5,7,20],[6,0,20],[6,3,20],[7,6,30],[9,5,40]],
      note: "Optimal çözüm 9 farklı hat kullanıyor. Açgözlü strateji bile $1475'te kalır (%18.5 sapma). Bu boyutta el ile optimumu bulmak fiilen imkansızdır — LP çözücü milisaniyede bulur."
    }
  }
};

// Yardımcılar ------------------------------------------------------------

function unitCost(scen, li) {
  const [w, r] = scen.links[li];
  return scen.wells[w].cost + scen.refs[r].cost;
}

// flows: her link için akış dizisi → {wUsed, rUsed, delivered, cost, feasible}
function evaluate(scen, flows) {
  const wUsed = scen.wells.map(() => 0);
  const rUsed = scen.refs.map(() => 0);
  let delivered = 0, cost = 0;
  scen.links.forEach(([w, r], i) => {
    const f = flows[i] || 0;
    wUsed[w] += f; rUsed[r] += f;
    delivered += f;
    cost += f * (scen.wells[w].cost + scen.refs[r].cost);
  });
  const okW = wUsed.every((u, i) => u <= scen.wells[i].cap);
  const okR = rUsed.every((u, i) => u <= scen.refs[i].cap);
  return { wUsed, rUsed, delivered, cost, feasible: okW && okR && delivered === scen.demand };
}

// optimal.flows ([w,r,f] üçlüleri) → link-indeksli akış dizisi
function optimalFlowArray(scen) {
  const flows = scen.links.map(() => 0);
  for (const [w, r, f] of scen.optimal.flows) {
    const i = scen.links.findIndex(([lw, lr]) => lw === w && lr === r);
    if (i >= 0) flows[i] = f;
  }
  return flows;
}

function fmtMoney(x) {
  return "$" + (Math.round(x * 10) / 10).toLocaleString("tr-TR");
}
