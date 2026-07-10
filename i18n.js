// Slick Oil Arena — iki dilli metin katmanı (TR / EN)
//
// Kullanım:
//   HTML'de:  <p data-i18n="join.sub"></p>
//             <p data-i18n-html="credit"></p>      (içinde <em> gibi etiket varsa)
//             <input data-i18n-ph="join.namePlaceholder">
//   JS'te:    t("submit.ok", { cost: "$690" })
//
// Dil seçimi localStorage'da saklanır; ilk açılışta tarayıcı diline bakılır.
// Dil değişince applyI18n() statik metinleri günceller, sayfalar kendi dinamik
// içeriklerini onLangChange() ile yeniden çizer.

const I18N = {
  tr: {
    "lang.other": "EN",
    "lang.switchTitle": "Switch to English",

    "credit": "Michael Watson'ın <em>Slick Oil</em> oyunundan uyarlanmıştır (Opex Analytics / LLamasoft; web versiyonu Rémi Lequette).",
    "credit.join": "Michael Watson'ın <em>Slick Oil</em> oyunundan uyarlanmıştır<br>(Opex Analytics / LLamasoft — web: Rémi Lequette)",

    // ---- ağ çizimi
    "net.wells": "KUYULAR",
    "net.refs": "RAFİNERİLER",
    "net.customer": "MÜŞTERİ",
    "net.broken": "ARIZA",
    "net.well": "Kuyu",
    "net.ref": "Rafineri",

    // ---- öğrenci sayfası
    "doc.title.student": "Slick Oil Arena — IE101 Optimizasyon Yarışması",
    "join.sub": "100 varil. En düşük maliyet. Sınıfın en iyisi kim?",
    "join.nameLabel": "Takma adın (leaderboard'da görünecek)",
    "join.namePlaceholder": "örn. simpleks_kral",
    "join.cta": "Oyuna katıl",

    "lobby.h": "Bekleme odası",
    "lobby.p1": "Hoca turu başlattığında oyun burada otomatik açılacak.",
    "lobby.p2": "Telefonu kapatma,",

    "hud.round": "Tur",
    "hud.time": "Süre",
    "hud.cost": "Maliyet",

    "game.hint": "Boruya dokun → akışı ayarla. Birim maliyet = kuyu + rafineri maliyeti.",
    "pipe.perBarrel": "/varil",

    "submit.ok": "Teslim et — {cost}",
    "submit.done": "✓ Teslim edildi — {cost}",
    "submit.incomplete": "Teslim ({delivered}/{demand}🛢)",
    "submit.confirm": "Bu turda TEK teslim hakkın var.\n\nMaliyetin: {cost}\n\nBu çözümü gönderiyor musun? Gönderdikten sonra değiştiremezsin.",

    "toast.capacity": "Kapasite ya da talep sınırı — bu boruya daha fazla sığmaz",
    "toast.closed": "Tur kapalı",
    "toast.invalid": "Çözüm geçerli değil",
    "toast.already": "Bu turda zaten teslim ettin ({cost}) — tek hakkın vardı",
    "toast.sent": "Teslim edildi: {cost} ✓",
    "toast.failed": "Gönderilemedi — bağlantıyı kontrol et",

    "result.over": "{title} bitti",
    "result.yourBest": "Senin en iyi maliyetin",
    "result.none": "Bu turda geçerli bir teslimin olmadı.",
    "result.optCost": "Optimal maliyet (LP çözücü, ~1 ms)",
    "result.badgeOpt": "🏆 OPTIMAL! Simpleks beyni",
    "result.gap": "Optimuma uzaklık: %{gap}",
    "result.points": "Puanın: <strong class=\"mono\">{points}</strong> / 1000",
    "result.waiting": "Gözler perdeye — sonuçlar açıklanıyor…",

    // ---- hoca paneli
    "doc.title.host": "Slick Oil Arena — Hoca Paneli",
    "panel.subtitle": "/ hoca paneli",
    "ctrl.round1": "Tur 1",
    "ctrl.round2": "Tur 2",
    "ctrl.round3": "Tur 3",
    "ctrl.duration": "Süre (dk)",
    "ctrl.start": "▶ Turu başlat",
    "ctrl.close": "⏹ Kapat",
    "ctrl.reveal": "✨ Optimali sınıfa aç",
    "ctrl.lobby": "Lobiye al",
    "ctrl.wipe": "Skorları sıfırla",

    "phase.waiting": "durum bekleniyor…",
    "phase.none": "durum yok",
    "phase.lobby": "LOBİ — öğrenciler bekliyor",
    "phase.live": "TUR CANLI",
    "phase.closed": "TUR KAPALI — açıklama bekleniyor",
    "phase.reveal": "OPTİMAL AÇIKLANDI",
    "status.scen": "{title} — talep {demand}🛢",

    "sect.qr": "Öğrenci girişi",
    "sect.qrHint": "QR'ı perdeye yansıtın",
    "sect.qrLead": "Telefonla okutun ya da adresi yazın:",
    "qr.alt": "Öğrenci giriş adresinin QR kodu",

    "sect.scen": "Senaryo — deneme alanı",
    "sect.scenHint": "{title} — {wells} kuyu × {refs} rafineri, talep {demand}🛢",
    "play.delivered": "Teslimat",
    "play.cost": "Maliyet",
    "play.valid": "✓ geçerli çözüm",
    "play.reset": "Sıfırla",
    "play.help": "Boruya tıklayın → akışı ayarlayın. Bu alan yalnızca sizin denemeniz içindir; skorlara işlemez.",

    "sect.board": "Sıralama ve dağılım",
    "board.count": "{subs} teslim, {players} oyuncu",
    "board.live": "Canlı sıralama",
    "board.overall": "Genel klasman",
    "board.overallHint": "(3 turun optimuma uzaklık ortalaması — düşük olan kazanır)",
    "board.locked": "Genel klasman, üç turun da optimali açıklandıktan sonra görünür. Şu an açıklanan: {done}/3. (Erken göstermek optimal maliyeti ele verirdi.)",
    "board.missingNote": "Teslim edilmeyen tur %100 uzaklık sayılır.",
    "board.hist": "Maliyet dağılımı",
    "hist.empty": "henüz teslim yok",
    "hist.opt": "OPTİMAL {cost}",

    "th.rank": "#",
    "th.name": "İsim",
    "th.cost": "Maliyet",
    "th.time": "Süre",
    "th.gap": "Uzaklık",
    "th.points": "Puan",
    "th.avgGap": "Ort. uzaklık",
    "unit.sec": "sn",
    "gap.value": "%{gap}",

    "sect.opt": "Optimal çözüm",
    "opt.costLabel": "Optimal maliyet",

    "wipe.prompt": "Şu an: Tur 1 → {c1} teslim, Tur 2 → {c2} teslim, Tur 3 → {c3} teslim.\n\n\"tur\" yaz → yalnızca Tur {round} silinsin\n\"hepsi\" yaz → üç turun tamamı silinsin",
    "wipe.roundWord": "tur",
    "wipe.allWord": "hepsi",
    "wipe.failed": "Silinemedi: {error}\n\nVeritabanı kuralları buna izin vermiyor olabilir."
  },

  en: {
    "lang.other": "TR",
    "lang.switchTitle": "Türkçe'ye geç",

    "credit": "Adapted from Michael Watson's <em>Slick Oil</em> (Opex Analytics / LLamasoft; web version by Rémi Lequette).",
    "credit.join": "Adapted from Michael Watson's <em>Slick Oil</em><br>(Opex Analytics / LLamasoft — web: Rémi Lequette)",

    // ---- network drawing
    "net.wells": "WELLS",
    "net.refs": "REFINERIES",
    "net.customer": "CUSTOMER",
    "net.broken": "OFFLINE",
    "net.well": "Well",
    "net.ref": "Refinery",

    // ---- student page
    "doc.title.student": "Slick Oil Arena — IE101 Optimization Contest",
    "join.sub": "100 barrels. Lowest cost. Who is the best in the class?",
    "join.nameLabel": "Your nickname (shown on the leaderboard)",
    "join.namePlaceholder": "e.g. simplex_king",
    "join.cta": "Join the game",

    "lobby.h": "Waiting room",
    "lobby.p1": "The game will open here automatically when the instructor starts the round.",
    "lobby.p2": "Keep your phone awake,",

    "hud.round": "Round",
    "hud.time": "Time",
    "hud.cost": "Cost",

    "game.hint": "Tap a pipe → set its flow. Unit cost = well cost + refinery cost.",
    "pipe.perBarrel": "/barrel",

    "submit.ok": "Submit — {cost}",
    "submit.done": "✓ Submitted — {cost}",
    "submit.incomplete": "Submit ({delivered}/{demand}🛢)",
    "submit.confirm": "You get ONE submission this round.\n\nYour cost: {cost}\n\nSubmit this solution? You cannot change it afterwards.",

    "toast.capacity": "Capacity or demand limit — no more fits through this pipe",
    "toast.closed": "Round is closed",
    "toast.invalid": "Solution is not valid",
    "toast.already": "You already submitted this round ({cost}) — one attempt only",
    "toast.sent": "Submitted: {cost} ✓",
    "toast.failed": "Could not submit — check your connection",

    "result.over": "{title} is over",
    "result.yourBest": "Your best cost",
    "result.none": "You had no valid submission this round.",
    "result.optCost": "Optimal cost (LP solver, ~1 ms)",
    "result.badgeOpt": "🏆 OPTIMAL! Simplex brain",
    "result.gap": "Gap to optimum: {gap}%",
    "result.points": "Your score: <strong class=\"mono\">{points}</strong> / 1000",
    "result.waiting": "Eyes on the screen — results are being revealed…",

    // ---- instructor panel
    "doc.title.host": "Slick Oil Arena — Instructor Panel",
    "panel.subtitle": "/ instructor panel",
    "ctrl.round1": "Round 1",
    "ctrl.round2": "Round 2",
    "ctrl.round3": "Round 3",
    "ctrl.duration": "Duration (min)",
    "ctrl.start": "▶ Start round",
    "ctrl.close": "⏹ Close",
    "ctrl.reveal": "✨ Reveal to class",
    "ctrl.lobby": "Send to lobby",
    "ctrl.wipe": "Clear scores",

    "phase.waiting": "waiting for state…",
    "phase.none": "no state",
    "phase.lobby": "LOBBY — students waiting",
    "phase.live": "ROUND LIVE",
    "phase.closed": "ROUND CLOSED — awaiting reveal",
    "phase.reveal": "OPTIMUM REVEALED",
    "status.scen": "{title} — demand {demand}🛢",

    "sect.qr": "Student entry",
    "sect.qrHint": "Project the QR code",
    "sect.qrLead": "Scan with your phone, or type the address:",
    "qr.alt": "QR code for the student entry address",

    "sect.scen": "Scenario — sandbox",
    "sect.scenHint": "{title} — {wells} wells × {refs} refineries, demand {demand}🛢",
    "play.delivered": "Delivered",
    "play.cost": "Cost",
    "play.valid": "✓ valid solution",
    "play.reset": "Reset",
    "play.help": "Click a pipe → set its flow. This area is for your own experimentation only; it does not affect scores.",

    "sect.board": "Leaderboard and distribution",
    "board.count": "{subs} submissions, {players} players",
    "board.live": "Live leaderboard",
    "board.overall": "Overall standings",
    "board.overallHint": "(average gap to optimum across 3 rounds — lower wins)",
    "board.locked": "Overall standings appear once all three optima have been revealed. Revealed so far: {done}/3. (Showing it earlier would give away the optimal cost.)",
    "board.missingNote": "A round with no submission counts as a 100% gap.",
    "board.hist": "Cost distribution",
    "hist.empty": "no submissions yet",
    "hist.opt": "OPTIMUM {cost}",

    "th.rank": "#",
    "th.name": "Name",
    "th.cost": "Cost",
    "th.time": "Time",
    "th.gap": "Gap",
    "th.points": "Score",
    "th.avgGap": "Avg. gap",
    "unit.sec": "s",
    "gap.value": "{gap}%",

    "sect.opt": "Optimal solution",
    "opt.costLabel": "Optimal cost",

    "wipe.prompt": "Current: Round 1 → {c1} submissions, Round 2 → {c2}, Round 3 → {c3}.\n\nType \"round\" → delete only Round {round}\nType \"all\" → delete all three rounds",
    "wipe.roundWord": "round",
    "wipe.allWord": "all",
    "wipe.failed": "Could not delete: {error}\n\nThe database rules may not allow this."
  }
};

const I18N_STORAGE_KEY = "soa_lang";

function detectLang() {
  const saved = localStorage.getItem(I18N_STORAGE_KEY);
  if (saved === "tr" || saved === "en") return saved;
  return (navigator.language || "en").toLowerCase().startsWith("tr") ? "tr" : "en";
}

let LANG = detectLang();

// Para biçimi dile göre ayrılır (binlik ayıracı): $1.245 (tr) / $1,245 (en)
function i18nLocale() { return LANG === "tr" ? "tr-TR" : "en-US"; }

function t(key, vars) {
  let s = (I18N[LANG] && I18N[LANG][key]) != null ? I18N[LANG][key] : key;
  if (vars) for (const k in vars) s = s.split("{" + k + "}").join(vars[k]);
  return s;
}

// Bir anahtarın TÜM dillerdeki karşılıkları (küçük harfe indirgenmiş).
// WHY: onay kelimeleri ("hepsi" / "all") her iki dilde de kabul edilmeli —
// kullanıcı arayüz dilini değiştirmeden alışkanlıkla diğerini yazabilir.
function tAll(key) {
  return Object.values(I18N).map(dict => dict[key]).filter(Boolean).map(s => s.toLowerCase());
}

// Senaryo metinleri scenarios.js içinde tr + *_en olarak durur.
function scenTitle(scen) { return LANG === "en" ? scen.title_en : scen.title; }
function scenStory(scen) { return LANG === "en" ? scen.story_en : scen.story; }
function scenNote(scen) { return LANG === "en" ? scen.optimal.note_en : scen.optimal.note; }

// data-i18n / data-i18n-html / data-i18n-ph işaretli her düğümü günceller.
function applyI18n(root) {
  const scope = root || document;
  scope.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  scope.querySelectorAll("[data-i18n-html]").forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  scope.querySelectorAll("[data-i18n-ph]").forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  scope.querySelectorAll("[data-i18n-alt]").forEach(el => { el.alt = t(el.dataset.i18nAlt); });
  document.documentElement.lang = LANG;
}

// Dil düğmesini bağlar. onChange: sayfanın dinamik içeriğini yeniden çizen geri çağrı.
function initLangToggle(btnId, onChange) {
  const btn = document.getElementById(btnId);
  const paint = () => {
    btn.textContent = t("lang.other");
    btn.title = t("lang.switchTitle");
  };
  btn.addEventListener("click", () => {
    LANG = LANG === "tr" ? "en" : "tr";
    localStorage.setItem(I18N_STORAGE_KEY, LANG);
    applyI18n();
    paint();
    onChange();
  });
  applyI18n();
  paint();
}
