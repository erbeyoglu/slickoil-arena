// Slick Oil Arena — TSP ağ çizici (öğrenci + hoca ekranı ortak)
//
// renderNetwork'ün (oil) TSP karşılığı. Aynı imza: (svgEl, scen, tour, ui, onTap).
// Çözüm = ziyaret sırası dizisi (tspEvaluate ile aynı). Depo (0) her zaman başta.
//
// Şehirler 0..100 ızgarasında; viewBox tek ve responsive (oil'deki kompakt/geniş
// ayrımına gerek yok — burada düğüm KUTUSU yok, yalnızca küçük daireler; ölçek
// telefonda da projeksiyonda da okunur kalır).

function renderTspNetwork(svgEl, scen, tour, ui, onTap) {
  const pts = scen.cities;
  const n = pts.length;
  const ev = tspEvaluate(scen, tour);

  // viewBox = koordinatların sınırlayıcı kutusu (herhangi bir koordinat aralığı
  // çalışır: 0..100 de 0..1000 de). Boyutlar bu ölçeğe orantılıdır.
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  const PAD = span * 0.09;
  svgEl.setAttribute("viewBox", `${minX - PAD} ${minY - PAD} ${(maxX - minX) + 2 * PAD} ${(maxY - minY) + 2 * PAD}`);
  svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svgEl.innerHTML = "";
  svgEl.classList.add("tsp");
  svgEl.classList.remove("net-compact");  // aynı SVG önce oil çizmiş olabilir

  // Nokta/yazı boyutu şehir sayısına ve koordinat ölçeğine (span) göre: az şehirde
  // büyük ve rahat, çok şehirde (60+) küçük ki çakışmasın. Izgara hücresi ~span/√n.
  // En yakın şehir çifti: hem daire hem dokunma alanı bunu geçmemeli (çakışma/yanlış
  // seçim olmasın). En yakın çift mesafesini bul.
  let minGap = Infinity;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1];
    const g = Math.sqrt(dx * dx + dy * dy);
    if (g < minGap) minGap = g;
  }
  // Daire yarıçapı: şehir sayısına göre ölçekli, ama komşu daireye değmeyecek kadar küçük.
  const R = Math.min(span * Math.max(0.011, Math.min(0.04, 0.3 / Math.sqrt(n))), minGap * 0.42);
  const fontSize = R * 1.35;
  const strokeW = Math.max(R * 0.3, span * 0.0016);
  // Dokunma alanı: parmakla telefon için mümkün olduğunca geniş, ama komşunun yarısını geçmesin.
  const hitR = Math.min(R * 2.4, minGap * 0.49);
  svgEl.style.setProperty("--tsp-font", fontSize + "px");
  svgEl.style.setProperty("--tsp-stroke", strokeW);

  const NS = "http://www.w3.org/2000/svg";
  const el = (name, attrs, parent) => {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    (parent || svgEl).appendChild(e);
    return e;
  };
  const txt = (x, y, s, cls) => {
    const t = el("text", { x, y, class: cls, "text-anchor": "middle", "pointer-events": "none" });
    t.textContent = s;
    return t;
  };
  const X = (i) => pts[i][0];
  const Y = (i) => pts[i][1];

  // ---- turdaki kenarlar (ziyaret sırası) — altta kalsın
  const edge = (a, b) =>
    el("line", { x1: X(a), y1: Y(a), x2: X(b), y2: Y(b), class: "tsp-edge tsp-edge-on" });
  for (let k = 0; k + 1 < tour.length; k++) edge(tour[k], tour[k + 1]);
  if (ev.feasible && tour.length > 1) edge(tour[tour.length - 1], tour[0]); // depoya kapanış

  // ---- şehirler
  pts.forEach((p, i) => {
    const order = tour.indexOf(i);
    const isDepot = i === 0;
    const visited = order >= 0;
    const cls =
      "tsp-city " +
      (isDepot ? "tsp-city-depot" : visited ? "tsp-city-visited" : "tsp-city-idle");

    el("circle", { cx: X(i), cy: Y(i), r: isDepot ? R * 1.15 : R, class: cls });
    // etiket: depo "D", ziyaret edilen şehir sıra numarası (depo hariç), diğerleri boş
    const label = isDepot ? "D" : visited ? String(order) : "";
    if (label) txt(X(i), Y(i) + fontSize * 0.35, label, "tsp-order" + (isDepot ? " tsp-order-depot" : ""));

    // tıklanabilir görünmez hit alanı (onTap varsa); komşuya taşmayan en geniş çember
    if (onTap) {
      const hit = el("circle", { cx: X(i), cy: Y(i), r: hitR, class: "tsp-hit", "data-city": i });
      hit.addEventListener("click", (e) => { e.stopPropagation(); onTap(i); });
    }
  });

  return ev;
}
