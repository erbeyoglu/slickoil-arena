// Slick Oil Arena — TSP ağ çizici (öğrenci + hoca ekranı ortak)
//
// renderNetwork'ün (oil) TSP karşılığı. Aynı imza: (svgEl, scen, tour, ui, onTap).
// Çözüm = ziyaret sırası dizisi (tspEvaluate ile aynı). Depo (0) her zaman başta.
//
// Şehirler 0..100 ızgarasında; viewBox tek ve responsive (oil'deki kompakt/geniş
// ayrımına gerek yok — burada düğüm KUTUSU yok, yalnızca küçük daireler; ölçek
// telefonda da projeksiyonda da okunur kalır).

const TSP_PAD = 12; // ızgara kenarından pay (etiket/daire taşmasın)

function renderTspNetwork(svgEl, scen, tour, ui, onTap) {
  const pts = scen.cities;
  const n = pts.length;
  const ev = tspEvaluate(scen, tour);

  const VB = 100 + 2 * TSP_PAD;
  svgEl.setAttribute("viewBox", `${-TSP_PAD} ${-TSP_PAD} ${VB} ${VB}`);
  svgEl.innerHTML = "";
  svgEl.classList.add("tsp");

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

    el("circle", { cx: X(i), cy: Y(i), r: isDepot ? 6 : 5, class: cls });
    // etiket: depo "D", ziyaret edilen şehir sıra numarası (depo hariç), diğerleri boş
    const label = isDepot ? "D" : visited ? String(order) : "";
    if (label) txt(X(i), Y(i) + 2.4, label, "tsp-order" + (isDepot ? " tsp-order-depot" : ""));

    // tıklanabilir görünmez hit alanı (onTap varsa)
    if (onTap) {
      const hit = el("circle", { cx: X(i), cy: Y(i), r: 8, class: "tsp-hit", "data-city": i });
      hit.addEventListener("click", (e) => { e.stopPropagation(); onTap(i); });
    }
  });

  return ev;
}
