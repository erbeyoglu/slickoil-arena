// Slick Oil Arena — SVG ağ çizici (öğrenci + hoca ekranı ortak)
// Her değişimde tam yeniden çizim yapar; küçük ağlar için yeterince hızlı.

// İki geometri: geniş ekran (projeksiyon) ve dar ekran (telefon).
//
// WHY: SVG viewBox genişliği ekran genişliğine ölçeklenir. 760 birimlik çizim
// 390px'lik bir telefonda 0.51 katına iner ve 15px'lik akış rakamı ~7.7px olur —
// okunmaz. Dar ekranda boru boşluklarını kısaltıp düğümleri genişleterek viewBox'ı
// 620 birime indiriyoruz; ölçek 0.63'e çıkıyor. Fontlar da büyütülüyor
// (bkz. style.css → .net-compact).
//
// Düğüm genişlikleri en uzun etikete göre seçilmiştir: "$2.5 | 100🛢"
// (mono ≈ 0.6em/karakter, emoji ≈ 1.15em) geniş geometride ~92, kompaktta ~106
// birim tutar. Kuyu düğümünde etikete kalan yer = nodeW - badgeInset - badgeR
// - labelPadWell. Punto veya etiket biçimi değişirse bu hesabı yeniden yapın.
// rowGap: iki düğüm merkezi arası dikey adım. padTop: sütun başlıklarına ayrılan üst
// pay. padBot: en alttaki düğümün doluluk çubuğu için alt pay.
// Toplam yükseklik = satır sayısı × rowGap + padTop + padBot.
const NET_WIDE = {
  W: 760, nodeW: 136, nodeH: 46, wellX: 40, refX: 420, custX: 640,
  custW: 112, custH: 60, rowGap: 74, padTop: 64, padBot: 48, badgeR: 14, badgeInset: 16,
  labelPadWell: 12, labelPadRef: 36, tagW: 48, tagH: 24, tagDy: 4,
  custTagW: 44, custTagH: 22, custTagDy: 4, pipeBase: 3, pipeGain: 18
};
const NET_COMPACT = {
  W: 660, nodeW: 156, nodeH: 52, wellX: 4, refX: 268, custX: 512,
  custW: 136, custH: 68, rowGap: 88, padTop: 66, padBot: 54, badgeR: 16, badgeInset: 18,
  labelPadWell: 12, labelPadRef: 40, tagW: 56, tagH: 30, tagDy: 6,
  custTagW: 50, custTagH: 26, custTagDy: 5, pipeBase: 4, pipeGain: 16
};

// Kompakt geometriye geçiş eşiği: SVG kaç CSS pikseline sığıyor?
const NET_COMPACT_PX = 520;

function netGeometry(svgEl) {
  const px = svgEl.getBoundingClientRect().width;
  // px === 0 ise (henüz düzene girmemiş) viewport'a düş.
  const narrow = px > 0 ? px < NET_COMPACT_PX : window.matchMedia("(max-width: 700px)").matches;
  return narrow ? NET_COMPACT : NET_WIDE;
}

function netHeight(scen, g) {
  const rows = Math.max(scen.wells.length, scen.refs.length);
  return rows * g.rowGap + g.padTop + g.padBot;
}

// Bir sütundaki i. düğümün MERKEZ y'si. Sütunlar farklı sayıda düğüm içerebilir
// (10 kuyu × 8 rafineri), bu yüzden her sütun kendi aralığına yayılır.
function nodeY(i, count, H, g) {
  const usable = H - g.padTop - g.padBot - g.nodeH;
  const dy = count > 1 ? usable / (count - 1) : 0;
  return g.padTop + g.nodeH / 2 + i * dy;
}

// Akış etiketi için hat üzerindeki aday konumlar (hattın t oranındaki noktası).
//
// WHY: tüm kuyu→rafineri hatları aynı x1 ve x2'yi paylaşır, bu yüzden sabit
// bir t değeri tüm etiketleri tek bir dikey sütuna yığar. Farklı t'ler hem x
// hem y'yi ayrıştırır (her hattın eğimi farklı). İlk değer 2/3'tür: çakışma
// yoksa etiket tarihsel konumunda kalır. Uçlar 0.3–0.72 aralığında tutulur ki
// etiket kutusu düğümlerin üzerine taşmasın.
const TAG_ANCHORS = [2 / 3, 1 / 3, 0.5, 0.583, 0.417, 0.72, 0.3];

// Son çare: etiketi hattından aşağı doğru kaydırma adımı.
const TAG_NUDGE_STEPS = 8;

// Akış etiketlerini çakışmadan yerleştirir. Etiketler yukarıdan aşağıya sırayla,
// daha önce yerleştirilmiş hiçbiriyle çakışmayan ilk adaya konur.
//
// Hiçbir aday boş değilse etiket ilk adaydan aşağı kaydırılır (hattından birkaç
// birim ayrılır ama okunur kalır). WHY: yoğun ağlarda (Tur 3, 34 hat) neredeyse
// yatay hatlar vardır; etiket kutusu kuyu–rafineri boşluğunun yarısından geniş
// olduğu için hiçbir t oranı onları x'te ayıramaz, y'de de ayrışmazlar.
//
// Yalnızca akışı olan (veya seçili) hatlarda etiket çizilir, bu yüzden çakışma
// çözümü de yalnızca çizilecek etiketler arasında yapılır — görünmeyen bir
// hattın varlığı görünen bir etiketi kaydırmamalı.
function layoutFlowTags(shown, g) {
  const clash = (a, b) => Math.abs(a.x - b.x) < g.tagW && Math.abs(a.y - b.y) < g.tagH + 2;
  const placed = [];
  for (const m of shown.sort((a, b) => a.y - b.y)) {
    const cands = TAG_ANCHORS.map(t => ({
      x: m.x1 + t * (m.x2 - m.x1),
      y: m.y1 + t * (m.y2 - m.y1)
    }));
    let pos = cands.find(c => !placed.some(p => clash(c, p)));
    if (!pos) {
      pos = { x: cands[0].x, y: cands[0].y };
      for (let n = 0; n < TAG_NUDGE_STEPS && placed.some(p => clash(pos, p)); n++) {
        pos.y += (g.tagH + 2) / 2;
      }
    }
    m.x = pos.x; m.y = pos.y;
    placed.push(pos);
  }
  return shown;
}

// selectedLink: seçili hattın indeksi (null olabilir)
// onTap(li): hatta dokununca çağrılır (null → etkileşimsiz)
function renderNetwork(svgEl, scen, flows, selectedLink, onTap) {
  const g = netGeometry(svgEl);
  svgEl.classList.remove("tsp");  // aynı SVG önce TSP çizmiş olabilir
  svgEl.classList.toggle("net-compact", g === NET_COMPACT);
  const H = netHeight(scen, g);
  const ev = evaluate(scen, flows);
  svgEl.setAttribute("viewBox", `0 0 ${g.W} ${H}`);
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
  const wy = i => nodeY(i, nW, H, g), ry = i => nodeY(i, nR, H, g);
  const custY = H / 2;

  // ---- rafineri → müşteri hatları (altta kalsın)
  scen.refs.forEach((r, i) => {
    const used = ev.rUsed[i];
    const on = used > 0;
    el("line", {
      x1: g.refX + g.nodeW, y1: ry(i), x2: g.custX, y2: custY,
      class: "pipe-static" + (on ? " pipe-on clink" : "")
    });
    if (on) {
      const mx = (g.refX + g.nodeW + 2 * g.custX) / 3, my = (ry(i) + 2 * custY) / 3;
      el("rect", { x: mx - g.custTagW / 2, y: my - g.custTagH / 2 - 1, width: g.custTagW, height: g.custTagH, rx: 5, class: "flowtag flowtag-c" });
      txt(mx, my + g.custTagDy, used, "flowtag-text", "middle");
    }
  });

  // ---- kuyu → rafineri hatları
  const mids = [];
  scen.links.forEach(([w, r], i) => {
    const x1 = g.wellX + g.nodeW, y1 = wy(w);
    const x2 = g.refX, y2 = ry(r);
    const f = flows[i] || 0;
    const cls = ["pipe"];
    if (f > 0) cls.push("pipe-on");
    if (selectedLink === i) cls.push("pipe-sel");
    el("line", { x1, y1, x2, y2, class: cls.join(" "), "stroke-width": f > 0 ? g.pipeBase + f / g.pipeGain : 2 });
    // geniş görünmez dokunma alanı
    if (onTap) {
      const hit = el("line", { x1, y1, x2, y2, class: "pipe-hit" });
      hit.addEventListener("click", e => { e.stopPropagation(); onTap(i); });
    }
    mids.push({ i, x1, y1, x2, y2, x: (x1 + 2 * x2) / 3, y: (y1 + 2 * y2) / 3 });
  });

  const shown = layoutFlowTags(mids.filter(m => (flows[m.i] || 0) > 0 || selectedLink === m.i), g);
  for (const m of shown) {
    const f = flows[m.i] || 0;
    const grp = el("g", { class: "flowtag-g" });
    const r = el("rect", { x: m.x - g.tagW / 2, y: m.y - g.tagH / 2 - 1, width: g.tagW, height: g.tagH, rx: 6, class: "flowtag" + (selectedLink === m.i ? " flowtag-sel" : "") }, grp);
    const t = el("text", { x: m.x, y: m.y + g.tagDy, class: "flowtag-text", "text-anchor": "middle", "pointer-events": "none" }, grp);
    t.textContent = f;
    if (onTap) { r.addEventListener("click", e => { e.stopPropagation(); onTap(m.i); }); r.style.cursor = "pointer"; }
  }

  // ---- düğüm çizici
  function drawNode(x, y, name, cost, cap, used, kind, broken) {
    const grp = el("g", { class: "node node-" + kind + (broken ? " node-broken" : "") });
    const over = used > cap;
    el("rect", { x, y: y - g.nodeH / 2, width: g.nodeW, height: g.nodeH, rx: 10, class: "node-box" + (over ? " node-over" : "") + (used > 0 ? " node-active" : "") }, grp);
    // isim rozeti
    const bx = kind === "well" ? x + g.nodeW - g.badgeInset : x + g.badgeInset;
    el("circle", { cx: bx, cy: y, r: g.badgeR, class: "node-badge" }, grp);
    txt(bx, y + 5, name, "node-name", "middle").setAttribute("pointer-events", "none");
    // maliyet | kapasite
    const lx = kind === "well" ? x + g.labelPadWell : x + g.labelPadRef;
    txt(lx, y + 5, broken ? t("net.broken") : `$${cost} | ${cap}🛢`, "node-label" + (broken ? " node-label-broken" : ""));
    // doluluk çubuğu
    el("rect", { x, y: y + g.nodeH / 2 + 4, width: g.nodeW, height: 6, rx: 3, class: "cap-track" }, grp);
    if (cap > 0) {
      el("rect", { x, y: y + g.nodeH / 2 + 4, width: g.nodeW * Math.min(used, cap) / cap, height: 6, rx: 3, class: "cap-fill" + (over ? " cap-over" : "") }, grp);
    }
    return grp;
  }

  scen.wells.forEach((w, i) => drawNode(g.wellX, wy(i), w.name, w.cost, w.cap, ev.wUsed[i], "well", w.broken));
  scen.refs.forEach((r, i) => drawNode(g.refX, ry(i), r.name, r.cost, r.cap, ev.rUsed[i], "ref"));

  // ---- müşteri
  const done = ev.delivered === scen.demand;
  const overD = ev.delivered > scen.demand;
  const cg = el("g", { class: "node" });
  el("rect", { x: g.custX, y: custY - g.custH / 2, width: g.custW, height: g.custH, rx: 12, class: "cust-box" + (done ? " cust-done" : overD ? " cust-over" : "") }, cg);
  txt(g.custX + g.custW / 2, custY - 6, t("net.customer"), "cust-title", "middle");
  txt(g.custX + g.custW / 2, custY + 18, `${ev.delivered} / ${scen.demand}🛢`, "cust-demand", "middle");
  el("rect", { x: g.custX, y: custY + g.custH / 2 + 6, width: g.custW, height: 6, rx: 3, class: "cap-track" }, cg);
  el("rect", { x: g.custX, y: custY + g.custH / 2 + 6, width: g.custW * Math.min(ev.delivered, scen.demand) / scen.demand, height: 6, rx: 3, class: "cap-fill cap-cust" }, cg);

  // sütun başlıkları
  txt(g.wellX, 34, t("net.wells"), "col-title");
  txt(g.refX, 34, t("net.refs"), "col-title");
  return ev;
}
