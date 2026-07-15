// TSP çözücüleri — üç BAĞIMSIZ kesin yöntem + sezgiseller.
// Mesafe: TSPLIB EUC_2D → round(sqrt(dx²+dy²)). Tamsayı aritmetiği.
//
// "Held–Karp" iki ayrı şeyin adıdır ve burada ikisi de var:
//   heldKarpDP    → O(2ⁿ·n²) dinamik programlama, KESİN optimum
//   heldKarpBound → 1-tree + Lagrange gevşetmesi, ALT SINIR (optimum değil)

export function distMatrix(pts) {
  const n = pts.length;
  const d = Array.from({ length: n }, () => new Int32Array(n));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1];
      d[i][j] = Math.round(Math.sqrt(dx * dx + dy * dy));
    }
  return d;
}

export function tourCost(d, tour) {
  let c = 0;
  for (let i = 0; i < tour.length; i++) c += d[tour[i]][tour[(i + 1) % tour.length]];
  return c;
}

// --- 1) Held–Karp DİNAMİK PROGRAMLAMA (KESİN, O(2ⁿ·n²))
// dp[S][j] = 0'dan çıkıp S kümesindeki şehirleri dolaşıp j'de biten en kısa yol.
// (S her zaman 0'ı ve j'yi içerir.)
export function heldKarpDP(d) {
  const n = d.length;
  const full = 1 << n;
  const INF = 0x3fffffff;
  const dp = new Int32Array(full * n).fill(INF);
  const parent = new Int32Array(full * n).fill(-1);
  dp[(1 << 0) * n + 0] = 0;

  for (let S = 1; S < full; S++) {
    if (!(S & 1)) continue;              // 0 daima içinde
    for (let j = 0; j < n; j++) {
      if (!(S & (1 << j))) continue;
      const cur = dp[S * n + j];
      if (cur >= INF) continue;
      for (let k = 1; k < n; k++) {
        if (S & (1 << k)) continue;
        const T = S | (1 << k);
        const cand = cur + d[j][k];
        if (cand < dp[T * n + k]) { dp[T * n + k] = cand; parent[T * n + k] = j; }
      }
    }
  }

  const ALL = full - 1;
  let best = INF, endJ = -1;
  for (let j = 1; j < n; j++) {
    const c = dp[ALL * n + j] + d[j][0];
    if (c < best) { best = c; endJ = j; }
  }

  // turu geri sar
  const tour = [];
  let S = ALL, j = endJ;
  while (j !== -1) { tour.push(j); const pj = parent[S * n + j]; S ^= (1 << j); j = pj; }
  tour.reverse();
  return { cost: best, tour };
}

// --- 2) KABA KUVVET (KESİN, tüm permütasyonlar; pratikte n ≤ 10)
// 0 sabit başlangıç; ayna turlarını atlamak için ilk komşu < son komşu kısıtı.
export function bruteForce(d) {
  const n = d.length;
  const rest = [];
  for (let i = 1; i < n; i++) rest.push(i);
  let best = Infinity, bestTour = null, count = 0;

  const perm = (arr, k) => {
    if (k === arr.length) {
      if (n > 2 && arr[0] > arr[arr.length - 1]) return;   // ayna turlarını atla
      count++;
      const t = [0, ...arr];
      const c = tourCost(d, t);
      if (c < best) { best = c; bestTour = t; }
      return;
    }
    for (let i = k; i < arr.length; i++) {
      [arr[k], arr[i]] = [arr[i], arr[k]];
      perm(arr, k + 1);
      [arr[k], arr[i]] = [arr[i], arr[k]];
    }
  };
  perm(rest, 0);
  return { cost: best, tour: bestTour, examined: count };
}

// --- 3) DAL-SINIR (KESİN, tamamen farklı kod yolu; MST alt sınırıyla budama)
// Tüketmeli aramadır: bittiğinde optimalliğin İSPATIDIR.
function mstBound(d, remaining, from, to) {
  const m = remaining.length;
  if (m === 0) return d[from][to];
  const inTree = new Array(m).fill(false);
  const key = new Array(m).fill(Infinity);
  key[0] = 0;
  let total = 0;
  for (let it = 0; it < m; it++) {
    let u = -1, bk = Infinity;
    for (let i = 0; i < m; i++) if (!inTree[i] && key[i] < bk) { bk = key[i]; u = i; }
    inTree[u] = true; total += key[u];
    for (let i = 0; i < m; i++) if (!inTree[i]) {
      const w = d[remaining[u]][remaining[i]];
      if (w < key[i]) key[i] = w;
    }
  }
  let cf = Infinity, ct = Infinity;
  for (const r of remaining) { if (d[from][r] < cf) cf = d[from][r]; if (d[to][r] < ct) ct = d[to][r]; }
  return total + cf + ct;
}

export function branchAndBound(d, upperBound) {
  const n = d.length;
  let best = upperBound ?? Infinity, bestTour = null, nodes = 0;
  const visited = new Array(n).fill(false);
  visited[0] = true;
  const path = [0];

  const rec = (last, cost) => {
    nodes++;
    if (path.length === n) {
      const total = cost + d[last][0];
      if (total < best) { best = total; bestTour = path.slice(); }
      return;
    }
    const remaining = [];
    for (let i = 1; i < n; i++) if (!visited[i]) remaining.push(i);
    if (cost + mstBound(d, remaining, last, 0) >= best) return;   // budama

    remaining.sort((a, b) => d[last][a] - d[last][b]);            // iyi üst sınır erken
    for (const nxt of remaining) {
      visited[nxt] = true; path.push(nxt);
      rec(nxt, cost + d[last][nxt]);
      path.pop(); visited[nxt] = false;
    }
  };
  rec(0, 0);
  return { cost: best, tour: bestTour, nodes };
}

// --- Sezgisel: en yakın komşu (öğrencinin "açgözlü" tuzağını ölçmek için)
export function nearestNeighbor(d, start = 0) {
  const n = d.length;
  const seen = new Array(n).fill(false);
  const tour = [start]; seen[start] = true;
  for (let s = 1; s < n; s++) {
    const last = tour[tour.length - 1];
    let bj = -1, bd = Infinity;
    for (let j = 0; j < n; j++) if (!seen[j] && d[last][j] < bd) { bd = d[last][j]; bj = j; }
    tour.push(bj); seen[bj] = true;
  }
  return { cost: tourCost(d, tour), tour };
}

// En iyi başlangıçtan en yakın komşu (öğrenciler genelde bunu yapar)
export function bestNearestNeighbor(d) {
  let best = Infinity, bt = null;
  for (let s = 0; s < d.length; s++) {
    const r = nearestNeighbor(d, s);
    if (r.cost < best) { best = r.cost; bt = r.tour; }
  }
  return { cost: best, tour: bt };
}

// 2-opt: kesişmeleri kaldırır (öğrencinin görsel yaptığı iyileştirme).
export function twoOpt(d, tour0) {
  const t = tour0.slice(), n = t.length;
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < n - 1; i++) for (let k = i + 1; k < n; k++) {
      const a = t[i - 1], b = t[i], c = t[k], e = t[(k + 1) % n];
      if (a === c || b === e) continue;
      if (d[a][c] + d[b][e] - d[a][b] - d[c][e] < -1e-9) {
        let l = i, r = k; while (l < r) { const tmp = t[l]; t[l] = t[r]; t[r] = tmp; l++; r--; }
        improved = true;
      }
    }
  }
  return { cost: tourCost(d, t), tour: t };
}

// Çok-başlangıçlı 2-opt üst sınırı (optimumun üstünde bir tur; kanıt için tavan).
export function upperBound(d, starts = 12) {
  const n = d.length;
  let best = Infinity, bt = null;
  for (let s = 0; s < Math.min(n, starts); s++) {
    const r = twoOpt(d, nearestNeighbor(d, s).tour);
    if (r.cost < best) { best = r.cost; bt = r.tour; }
  }
  return { cost: best, tour: bt };
}

// --- Held–Karp ALT SINIRI (1-tree + Lagrange). DP ile karıştırılmamalı:
// bu bir ALT SINIRDIR, optimum değil. Optimuma eşit çıkarsa sertifika olur.
export function heldKarpBound(d, iters = 300) {
  const n = d.length;
  const pi = new Float64Array(n);
  let bestBound = -Infinity;
  let step = 2.0;

  for (let it = 0; it < iters; it++) {
    const w = (i, j) => d[i][j] + pi[i] + pi[j];

    // 1-tree: {1..n-1} üzerinde MST + düğüm 0'ın iki en ucuz kenarı
    const nodes = [];
    for (let i = 1; i < n; i++) nodes.push(i);
    const inT = new Array(n).fill(false);
    const key = new Array(n).fill(Infinity);
    const par = new Array(n).fill(-1);
    const deg = new Array(n).fill(0);
    key[1] = 0;
    let treeCost = 0;
    for (let c = 0; c < nodes.length; c++) {
      let u = -1, bk = Infinity;
      for (const i of nodes) if (!inT[i] && key[i] < bk) { bk = key[i]; u = i; }
      inT[u] = true; treeCost += key[u];
      if (par[u] !== -1) { deg[u]++; deg[par[u]]++; }
      for (const i of nodes) if (!inT[i] && w(u, i) < key[i]) { key[i] = w(u, i); par[i] = u; }
    }
    const e = nodes.map(i => w(0, i)).sort((a, b) => a - b);
    treeCost += e[0] + e[1];
    deg[0] = 2;
    const two = nodes.map(i => [w(0, i), i]).sort((a, b) => a[0] - b[0]).slice(0, 2).map(x => x[1]);
    for (const i of two) deg[i]++;

    let piSum = 0;
    for (let i = 0; i < n; i++) piSum += pi[i];
    const bound = treeCost - 2 * piSum;
    if (bound > bestBound) bestBound = bound;

    // altgradyan adımı: dereceden 2 sapması
    let norm = 0;
    for (let i = 0; i < n; i++) norm += (deg[i] - 2) ** 2;
    if (norm === 0) break;                       // 1-tree bir tur → sınır = optimum
    for (let i = 0; i < n; i++) pi[i] += step * (deg[i] - 2);
    step *= 0.97;
  }
  return Math.ceil(bestBound - 1e-9);
}
