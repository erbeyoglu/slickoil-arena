// Slick Oil Arena — SVG ağ çizici (öğrenci + hoca ekranı ortak)
// Her değişimde tam yeniden çizim yapar; küçük ağlar için yeterince hızlı.

const NET = { W: 760, nodeW: 128, nodeH: 46, wellX: 40, refX: 420, custX: 640 };

function netHeight(scen) {
  const rows = Math.max(scen.wells.length, scen.refs.length);
  return rows * 92 + 120;
}

function nodeY(i, count, H) {
  const span = H - 140;
  const dy = count > 1 ? span / (count - 1) : 0;
  return 80 + i * dy;
}

// selectedLink: seçili hattın indeksi (null olabilir)
// onTap(li): hatta dokununca çağrılır (null → etkileşimsiz)
function renderNetwork(svgEl, scen, flows, selectedLink, onTap) {
  const H = netHeight(scen);
  const ev = evaluate(scen, flows);
  svgEl.setAttribute("viewBox", `0 0 ${NET.W} ${H}`);
  svgEl.innerHTML = "";
  const NS = "http://www.w3.org/2000/svg";
  const el = (name, attrs, parent) => {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    (parent || svgEl).appendChild(e);
    return e;
  };
  const txt = (x, y, s, cls, anchor) => {
    const t = el("text", { x, y, class: cls || "", "text-anchor": anchor || "start" });
    t.textContent = s;
    return t;
  };

  const nW = scen.wells.length, nR = scen.refs.length;
  const wy = i => nodeY(i, nW, H), ry = i => nodeY(i, nR, H);
  const custY = H / 2;

  // ---- rafineri → müşteri hatları (altta kalsın)
  scen.refs.forEach((r, i) => {
    const used = ev.rUsed[i];
    const on = used > 0;
    el("line", {
      x1: NET.refX + NET.nodeW, y1: ry(i), x2: NET.custX, y2: custY,
      class: "pipe-static" + (on ? " pipe-on clink" : "")
    });
    if (on) {
      const mx = (NET.refX + NET.nodeW + 2 * NET.custX) / 3, my = (ry(i) + 2 * custY) / 3;
      el("rect", { x: mx - 22, y: my - 12, width: 44, height: 22, rx: 5, class: "flowtag flowtag-c" });
      txt(mx, my + 4, used, "flowtag-text", "middle");
    }
  });

  // ---- kuyu → rafineri hatları
  const mids = [];
  scen.links.forEach(([w, r], i) => {
    const x1 = NET.wellX + NET.nodeW, y1 = wy(w);
    const x2 = NET.refX, y2 = ry(r);
    const f = flows[i] || 0;
    const cls = ["pipe"];
    if (f > 0) cls.push("pipe-on");
    if (selectedLink === i) cls.push("pipe-sel");
    el("line", { x1, y1, x2, y2, class: cls.join(" "), "stroke-width": f > 0 ? 3 + f / 18 : 2 });
    // geniş görünmez dokunma alanı
    if (onTap) {
      const hit = el("line", { x1, y1, x2, y2, class: "pipe-hit" });
      hit.addEventListener("click", e => { e.stopPropagation(); onTap(i); });
    }
    mids.push({ i, x: (x1 + 2 * x2) / 3, y: (y1 + 2 * y2) / 3, x2: (2 * x1 + x2) / 3, y2b: (2 * y1 + y2) / 3 });
  });

  // aynı noktaya düşen etiketleri kaydır (orijinal oyundaki çakışma hilesi)
  mids.sort((a, b) => a.y - b.y);
  for (let k = 0; k < mids.length - 1; k++) {
    if (Math.abs(mids[k].y - mids[k + 1].y) < 1) {
      [mids[k], mids[k + 1]].forEach(m => { m.x = m.x2; m.y = m.y2b; });
    }
  }
  for (const m of mids) {
    const f = flows[m.i] || 0;
    if (f > 0 || selectedLink === m.i) {
      const g = el("g", { class: "flowtag-g" });
      const r = el("rect", { x: m.x - 24, y: m.y - 13, width: 48, height: 24, rx: 6, class: "flowtag" + (selectedLink === m.i ? " flowtag-sel" : "") }, g);
      const t = el("text", { x: m.x, y: m.y + 4, class: "flowtag-text", "text-anchor": "middle", "pointer-events": "none" }, g);
      t.textContent = f;
      if (onTap) { r.addEventListener("click", e => { e.stopPropagation(); onTap(m.i); }); r.style.cursor = "pointer"; }
    }
  }

  // ---- düğüm çizici
  function drawNode(x, y, name, cost, cap, used, kind, broken) {
    const g = el("g", { class: "node node-" + kind + (broken ? " node-broken" : "") });
    const over = used > cap;
    el("rect", { x, y: y - NET.nodeH / 2, width: NET.nodeW, height: NET.nodeH, rx: 10, class: "node-box" + (over ? " node-over" : "") + (used > 0 ? " node-active" : "") }, g);
    // isim rozeti
    const bx = kind === "well" ? x + NET.nodeW - 16 : x + 16;
    el("circle", { cx: bx, cy: y, r: 14, class: "node-badge" }, g);
    txt(bx, y + 5, name, "node-name", "middle").setAttribute("pointer-events", "none");
    // maliyet | kapasite
    const lx = kind === "well" ? x + 12 : x + 36;
    txt(lx, y + 5, broken ? "ARIZA" : `$${cost} | ${cap}🛢`, "node-label" + (broken ? " node-label-broken" : ""));
    // doluluk çubuğu
    el("rect", { x, y: y + NET.nodeH / 2 + 4, width: NET.nodeW, height: 6, rx: 3, class: "cap-track" }, g);
    if (cap > 0) {
      el("rect", { x, y: y + NET.nodeH / 2 + 4, width: NET.nodeW * Math.min(used, cap) / cap, height: 6, rx: 3, class: "cap-fill" + (over ? " cap-over" : "") }, g);
    }
    return g;
  }

  scen.wells.forEach((w, i) => drawNode(NET.wellX, wy(i), w.name, w.cost, w.cap, ev.wUsed[i], "well", w.broken));
  scen.refs.forEach((r, i) => drawNode(NET.refX, ry(i), r.name, r.cost, r.cap, ev.rUsed[i], "ref"));

  // ---- müşteri
  const done = ev.delivered === scen.demand;
  const overD = ev.delivered > scen.demand;
  const cg = el("g", { class: "node" });
  el("rect", { x: NET.custX, y: custY - 30, width: 112, height: 60, rx: 12, class: "cust-box" + (done ? " cust-done" : overD ? " cust-over" : "") }, cg);
  txt(NET.custX + 56, custY - 6, "MÜŞTERİ", "cust-title", "middle");
  txt(NET.custX + 56, custY + 16, `${ev.delivered} / ${scen.demand}🛢`, "cust-demand", "middle");
  el("rect", { x: NET.custX, y: custY + 36, width: 112, height: 6, rx: 3, class: "cap-track" }, cg);
  el("rect", { x: NET.custX, y: custY + 36, width: 112 * Math.min(ev.delivered, scen.demand) / scen.demand, height: 6, rx: 3, class: "cap-fill cap-cust" }, cg);

  // sütun başlıkları
  txt(NET.wellX, 34, "KUYULAR", "col-title");
  txt(NET.refX, 34, "RAFİNERİLER", "col-title");
  return ev;
}
