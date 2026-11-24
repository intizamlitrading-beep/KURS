import { firebaseConfig, ADMIN_EMAILS } from "./firebase-config.js";
const B = "https://www.gstatic.com/firebasejs/10.12.2/";
const { initializeApp } = await import(B + "firebase-app.js");
const A = await import(B + "firebase-auth.js");
const F = await import(B + "firebase-firestore.js");
const fapp = initializeApp(firebaseConfig);
const auth = A.getAuth(fapp);
// Long-polling avto: ayırım internet/Telegram brauzerlerinde "client is offline" qáteligin saplastıradı
let db; try { db = F.initializeFirestore(fapp, { experimentalAutoDetectLongPolling: true }); } catch (e) { db = F.getFirestore(fapp); }
const root = document.getElementById("app");
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fx = s => String(s || "").replace(/assets\/img\//g, "").replace(/src="([\w-]+\.jpg)"/g, 'src="$1?v=12"');
const fmt = t => t && t.toDate ? t.toDate().toLocaleString("ru-RU") : "—";
const ADM = ADMIN_EMAILS.map(x => x.toLowerCase());
const ERR = {
  "auth/invalid-credential": "Email yamasa parol qáte.", "auth/wrong-password": "Parol qáte.",
  "auth/user-not-found": "Bunday paydalanıwshı tabılmadı.", "auth/email-already-in-use": "Bul email dizimnen ótken. Kiriwdi sına.",
  "auth/weak-password": "Parol keminde 6 belgi bolsın.", "auth/invalid-email": "Email qáte jazılǵan.",
  "auth/too-many-requests": "Kóp urınıs boldı. Biraz kútip qayta sına.", "auth/network-request-failed": "Internet joq.",
  "auth/invalid-login-credentials": "Email yamasa parol qáte.", "auth/missing-password": "Paroldi jazıń.",
  "auth/missing-email": "Emaildi jazıń.", "auth/user-disabled": "Bul akkaunt bloklanǵan.",
  "auth/operation-not-allowed": "Firebase-te Email/Password kiriw qosılmaǵan (Authentication → Sign-in method).",
  "auth/unauthorized-domain": "Bul sayt adresi Firebase → Authentication → Settings → Authorized domains dizimine qosılmaǵan.",
  "auth/popup-closed-by-user": "Ayna jabıldı.", "auth/internal-error": "Serverde qátelik. Qayta sınap kóriń.",
  "permission-denied": "Ruxsat joq (Firestore rules tekseriń).", "unavailable": "Server menen baylanıs joq. Internetti tekserip, qayta sınap kóriń.",
  "failed-precondition": "Bazada qátelik (failed-precondition). Betti jańalań."
};
const msg = e => ERR[e && e.code] || (/offline/i.test((e && e.message) || "") ? ERR.unavailable : "Qátelik: " + ((e && (e.code || e.message)) || e));
window.errText = msg;
let me = null, prof = null, topics = [], isAdmin = false, pendingName = "";
const uref = () => F.doc(db, "users", me.uid);

/* ---------- Kiriw / dizimnen ótiw / parol tiklaw ---------- */
const EYE = '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF = '<svg viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7c1.8 0 3.4-.5 4.8-1.3"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
function authView(mode = "in", note = "") {
  const T = { in: ["Kiriw", "Xosh keldińiz! Email hám parolıńızdı jazıń."], up: ["Dizimnen ótiw", "Akkaunt jasań — admin sizge sabaqlıqlardı ashıp beredi."], reset: ["Paroldi tiklew", "Emailińizdi jazıń — jańa parol qoyıw linki poshtaǵa keledi."] }[mode];
  root.innerHTML = `<div class="auth-wrap">
  <div class="auth-intro">
    <div class="brand"><img src="logo.jpg?v=12" alt="logo"><div>INTIZAMLI<em>TRADING CLUB</em></div></div>
    <div class="eyebrow">Intizamli Trading · Kurs</div>
    <h1>Treydingti <span>sistema menen</span> úyreniń</h1>
    <p class="lead">«Treyding nolden nátiyjege shekem» kursınıń sabaqlıqları, testleri hám sertifikatı — bir jerde.</p>
    <ul class="checks">
      <li><span class="tick">✓</span><span><b>Izbe-iz sabaqlar</b> — hár tema slayd hám mısallar menen</span></li>
      <li><span class="tick">✓</span><span><b>Testler</b> — hár temadan soń bilimińizdi tekseriń</span></li>
      <li><span class="tick">✓</span><span><b>Sertifikat</b> — kurstı tamamlaǵanlarǵa</span></li>
    </ul>
  </div>
  <div class="auth">
    ${mode == "reset" ? "" : `<div class="tabs"><button type="button" data-m="in" class="${mode == "in" ? "on" : ""}">Kiriw</button><button type="button" data-m="up" class="${mode == "up" ? "on" : ""}">Dizimnen ótiw</button></div>`}
    <h2>${T[0]}</h2><p class="hint">${T[1]}</p>
    <form id="f" novalidate>${mode == "up" ? `<label for="n">Atıńız</label><input id="n" autocomplete="name" placeholder="Mısalı: Aybek">` : ""}
    <label for="e">Email</label><input id="e" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="siz@gmail.com">
    ${mode == "reset" ? "" : `<label for="p">Parol</label><div class="pw"><input id="p" type="password" autocomplete="${mode == "in" ? "current-password" : "new-password"}" placeholder="${mode == "up" ? "Keminde 6 belgi" : "Parolıńız"}"><button type="button" class="eye" id="eye" aria-label="Paroldi kórsetiw" title="Paroldi kórsetiw">${EYE}</button></div>`}
    <button class="gold" id="sb" type="submit"><span>${mode == "in" ? "Kiriw" : mode == "up" ? "Dizimnen ótiw" : "Link jiberiw"}</span><span class="ar">→</span></button></form>
    ${mode == "in" ? `<p style="text-align:center;margin:16px 0 0"><button type="button" class="lnk" id="fg">Parolıńızdı umıttıńız ba?</button></p>` : ""}
    ${mode == "reset" ? `<p style="text-align:center;margin:16px 0 0"><button type="button" class="lnk" id="bk">← Kiriwge qaytıw</button></p>` : ""}
    <div id="m" class="${note.startsWith("!") ? "err" : "ok"}">${esc(note.replace(/^!/, ""))}</div>
  </div></div>`;
  root.querySelectorAll("[data-m]").forEach(b => b.onclick = () => authView(b.dataset.m));
  const fg = $("#fg"); if (fg) fg.onclick = () => authView("reset");
  const bk = $("#bk"); if (bk) bk.onclick = () => authView("in");
  const eye = $("#eye");
  if (eye) eye.onclick = () => {
    const p = $("#p"), show = p.type == "password"; p.type = show ? "text" : "password";
    eye.innerHTML = show ? EYE_OFF : EYE; eye.classList.toggle("on", show);
    const t = show ? "Paroldi jasırıw" : "Paroldi kórsetiw"; eye.title = t; eye.setAttribute("aria-label", t); p.focus();
  };
  const say = (t, ok) => { const m = $("#m"); if (m) { m.className = ok ? "ok" : "err"; m.textContent = t; } };
  let busy = false;
  $("#f").onsubmit = async ev => {
    ev.preventDefault(); if (busy) return;
    const e = $("#e").value.trim().toLowerCase(), p = $("#p") ? $("#p").value : "", n = $("#n") ? $("#n").value.trim() : "";
    if (mode == "up" && n.length < 2) return say("Atıńızdı jazıń.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return say("Email qáte jazılǵan. Mısalı: siz@gmail.com");
    if (mode != "reset" && !p) return say("Paroldi jazıń.");
    if (mode == "up" && p.length < 6) return say("Parol keminde 6 belgi bolsın.");
    const sb = $("#sb"), lbl = sb.firstElementChild.textContent;
    busy = true; sb.disabled = true; sb.firstElementChild.innerHTML = '<span class="spin"></span> Kútiń…'; say("", true);
    try {
      if (mode == "in") await A.signInWithEmailAndPassword(auth, e, p);
      else if (mode == "up") {
        pendingName = n; const c = await A.createUserWithEmailAndPassword(auth, e, p);
        try { await A.updateProfile(c.user, { displayName: n }); } catch (_) { }
      }
      else { await A.sendPasswordResetEmail(auth, e); return authView("reset", "Eger bul email dizimnen ótken bolsa, jańa parol qoyıw linki jiberildi. Poshtańızdı (Spam di de) tekseriń."); }
    } catch (er) {
      say(msg(er));
      if (mode == "up" && er.code == "auth/email-already-in-use") { const m = $("#m"); m.insertAdjacentHTML("beforeend", ' <button type="button" class="lnk" id="gi">Kiriw →</button>'); $("#gi").onclick = () => { authView("in"); $("#e").value = e; }; }
    } finally { busy = false; if (document.body.contains(sb)) { sb.disabled = false; sb.firstElementChild.textContent = lbl; } }
  };
}

/* ---------- Júklew ---------- */
async function loadProfile() {
  const r = uref(); let s = await F.getDoc(r);
  if (!s.exists()) {
    const name = pendingName || me.displayName || (me.email || "").split("@")[0];
    await F.setDoc(r, { email: me.email, name, unlocked: [], viewed: {}, createdAt: F.serverTimestamp(), lastLogin: F.serverTimestamp() });
  } else await F.updateDoc(r, { lastLogin: F.serverTimestamp() });
  prof = (await F.getDoc(r)).data();
}
let QZ = null;
async function loadQuiz() { if (QZ) return QZ; try { const r = await fetch("quiz.json?v=" + Date.now()); QZ = r.ok ? await r.json() : {}; } catch (e) { QZ = {}; } return QZ; }
async function loadTopics() {
  const s = await F.getDocs(F.collection(db, "topics")); const qz = await loadQuiz();
  topics = s.docs.map(d => ({ id: d.id, ...d.data() })).map(t => ({ ...t, quiz: (qz[t.id] || []).length || t.quiz || 0 })).sort((a, b) => (a.order - b.order) || String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
}
A.onAuthStateChanged(auth, async u => {
  if (!u) { me = null; authView(); return; }
  me = u; isAdmin = ADM.includes((u.email || "").toLowerCase());
  root.innerHTML = '<p class="loading"><span class="spin"></span> Júklenbekte…</p>';
  try { await loadProfile(); await loadTopics(); home(); } catch (e) { root.innerHTML = `<div class="auth"><h2>Júklewde qátelik</h2><p class="err">${esc(msg(e))}</p><button class="gold full" id="rl">Qayta urınıw</button><button class="full" id="lo">Shıǵıw</button></div>`; $("#rl").onclick = () => location.reload(); $("#lo").onclick = () => A.signOut(auth); }
});
const head = (extra = "") => `<header><img src="logo.jpg?v=12" alt="logo" id="lg"><div><b>INTIZAMLI<em>TRADING CLUB</em></b><small>${esc(prof.name)} · ${esc(me.email)}</small></div><div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">${extra}${isAdmin ? '<button id="adm">⚙ Admin</button>' : ""}<button id="out">Shıǵıw</button></div></header>`;
function bindHead() {
  $("#out").onclick = () => A.signOut(auth); const a = $("#adm"); if (a) a.onclick = () => admin("stats"); $("#lg").onclick = home;
}

/* ---------- Oqıwshı: temalar hám slaydlar ---------- */
const DAY = 864e5, d2s = d => d.toLocaleDateString("ru-RU");
const accEnd = p => p && p.accessUntil && p.accessUntil.toDate ? p.accessUntil.toDate() : null;
const hasAcc = p => { const e = accEnd(p); return !!e && e.getTime() > Date.now(); };
const seenOf = (p, id) => { const v = (p.viewed || {})[id]; if (!v) return []; if (Array.isArray(v.seen)) return v.seen; return v.max >= 0 ? Array.from({ length: v.max + 1 }, (_, i) => i) : []; };
const qOf = (p, id) => ((p && p.quiz) || {})[id];
const quizOk = (p, t) => !t || !t.quiz || !!qOf(p, t.id);
const isDone = (p, t) => !!t && t.count > 0 && seenOf(p, t.id).length >= t.count;
const topicState = (t, i) => { if (isAdmin) return "open"; if (!(prof.unlocked || []).includes(t.id)) return "admin"; if (!hasAcc(prof)) return "expired"; if (i > 0 && !(isDone(prof, topics[i - 1]) && quizOk(prof, topics[i - 1]))) return "seq"; return "open"; };
function accessBanner() {
  if (isAdmin) return "";
  const e = accEnd(prof);
  if (!e) return '<div class="note" style="border-color:var(--gold)">Dostup elege berilmegen. Admin dostup bergennen soń sabaqlıqlar ashıladı (30 kún).</div>';
  if (e.getTime() <= Date.now()) return `<div class="note">Dostup múddeti tawsıldı (${d2s(e)}). Dawam etiw ushın admin dostupti uzaytıradı.</div>`;
  return `<div class="note" style="border-color:var(--up)">Dostup: <b>${d2s(e)}</b> shekem (${Math.ceil((e - Date.now()) / DAY)} kún qaldı)</div>`;
}
function home() {
  const TXT = { admin: "Admin ashqanda ashıladı", expired: "Dostup múddeti tawsıldı", seq: "Aldıńǵı temanı hám onıń testin tamamlasańız ashıladı" };
  root.innerHTML = head() + `<main><div class="eyebrow">Intizamli Trading · Kurs</div><h1>Treyding <span>kursı</span></h1><p class="sub">Sabaqlıqlar izbe-izlikte ashıladı: temanı tolıq kórip, testin tapsırǵannan soń keyingisi ashıladı. Test ballarıńız boyınsha sertifikat beriledi.</p>${accessBanner()}<div class="grid">` +
    topics.map((t, i) => {
      const st = topicState(t, i), open = st == "open", done = isDone(prof, t), seen = seenOf(prof, t.id).length;
      const pr = t.count ? Math.min(100, Math.round(seen / t.count * 100)) : 0;
      return `<button class="tc ${open ? "" : "lock"}" ${open ? `data-t="${t.id}"` : "disabled"}><div class="n">${i + 1}-TEMA ${done ? "✓" : open ? "" : "🔒"}${t.quiz && qOf(prof, t.id) ? ` · Test: ${qOf(prof, t.id).score}/${qOf(prof, t.id).total}` : ""}</div><h3>${esc(t.title)}</h3><p>${open ? esc(t.desc) : TXT[st]}</p>${!isAdmin && open && pr ? `<div class="bar" style="margin:10px 0 0"><i style="width:${pr}%"></i></div>` : ""}</button>`;
    }).join("") + (topics.length ? "" : "<p>Elege sabaqlıq joq.</p>") + `</div></main>`;
  bindHead(); root.querySelectorAll("[data-t]").forEach(b => b.onclick = () => openTopic(b.dataset.t));
}
async function openTopic(id) {
  { const ti = topics.findIndex(x => x.id == id); if (ti < 0 || topicState(topics[ti], ti) != "open") { alert("Bul tema házir ashılmaydı."); return home(); } }
  root.innerHTML = '<p class="loading"><span class="spin"></span> Júklenbekte…</p>';
  let slides;
  try { const s = await F.getDoc(F.doc(db, "content", id)); slides = (s.exists() ? s.data().slides : []).map(x => ({ ...x, b: fx(x.b) })); }
  catch (e) { alert(msg(e)); return home(); }
  const t = topics.find(x => x.id == id); let sl = Math.min(((prof.viewed || {})[id] || {}).slide || 0, Math.max(slides.length - 1, 0));
  const show = () => {
    const s = slides[sl] || { k: "", h: "Bos", b: "" };
    track(id, sl, slides.length); const seenSet = new Set(seenOf(prof, id)), allSeen = seenSet.size >= slides.length;
    root.innerHTML = head('<button id="hm">☰ Temalar</button>') + `<main><div class="n" style="color:var(--gold);font-weight:800">${esc(t.title)}${isAdmin ? "" : ` · kórilgen ${Math.min(seenSet.size, slides.length)}/${slides.length}`}</div><div class="bar"><i style="width:${(sl + 1) / Math.max(slides.length, 1) * 100}%"></i></div>
    <div class="slide"><div class="k">${esc(s.k)}</div><h2>${esc(s.h)}</h2>${s.b}</div>
    <div class="nav"><button id="pv" ${sl ? "" : "disabled"}>← Artqa</button><div class="dots">${slides.map((_, i) => `<i class="${i == sl ? "on" : seenSet.has(i) ? "seen" : ""}" data-i="${i}"></i>`).join("")}</div><button class="gold" id="nx">${sl < slides.length - 1 ? "Aldıńǵı →" : (t.quiz && (allSeen || isAdmin)) ? (qOf(prof, id) ? "Test nátiyjesi →" : "Testti baslaw →") : allSeen || isAdmin ? "Tema tamam ✓ Temalarǵa" : "Temalarǵa"}</button></div>${sl == slides.length - 1 && !allSeen && !isAdmin ? '<div class="note">Keyingi tema ashılıwı ushın bul temanıń barlıq slaydın kóriw kerek (kórilmegen slaydlar kúnǵirt nokat).</div>' : ""}</main>`;
    bindHead(); $("#hm").onclick = home; $("#pv").onclick = () => { sl--; show(); };
    $("#nx").onclick = () => { sl < slides.length - 1 ? (sl++, show()) : (t.quiz && (seenOf(prof, id).length >= slides.length || isAdmin)) ? runQuiz(t) : home(); };
    root.querySelectorAll("[data-i]").forEach(d => d.onclick = () => { sl = +d.dataset.i; show(); });
    root.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { sl = +b.dataset.go; show(); });
    scrollTo(0, 0);
  };
  show();
}
async function runQuiz(t) {
  root.innerHTML = '<p class="loading"><span class="spin"></span> Júklenbekte…</p>';
  let qs = [];
  qs = (await loadQuiz())[t.id] || [];
  if (!qs.length) { try { const s = await F.getDoc(F.doc(db, "quiz", t.id)); qs = s.exists() ? s.data().items || [] : []; } catch (e) { } }
  if (!qs.length) return home();
  const done = qOf(prof, t.id), ans = done ? done.ans || [] : [];
  const render = (res) => {
    root.innerHTML = head('<button id="hm">☰ Temalar</button>') + `<main><div class="n" style="color:var(--gold);font-weight:800">${esc(t.title)} · TEST</div><h1 style="font-size:28px">Ózińizdi <span>tekseriń</span></h1>
    ${res ? `<div class="box" style="border-color:var(--gold);text-align:center;margin:10px 0 18px"><b style="font-size:30px">${res.score} / ${res.total}</b><br><small>Nátiyje saqlandı. Durıs juwaplar jasıl, qáteleri qızıl.</small></div>` : `<p class="sub">${qs.length} soraw. Hár sorawǵa bir juwap tańlań. Test bir ret tapsırıladı — ballar sertifikat ushın esaplanadı.</p>`}
    ${qs.map((q, i) => `<div class="slide" style="min-height:0;margin-bottom:14px;padding:18px"><b>${i + 1}. ${esc(q.q)}</b>${q.o.map((o, j) => {
      let st = ""; if (res) { if (j == q.a) st = "border-color:var(--up);color:var(--up)"; else if (res.ans[i] == j) st = "border-color:var(--dn);color:var(--dn)"; }
      return `<label class="opt" style="cursor:${res ? "default" : "pointer"};${st}"><input type="radio" name="q${i}" value="${j}" ${res ? "disabled" : ""} ${res && res.ans[i] == j ? "checked" : ""} style="width:auto;margin:0">${"ABCD"[j]}) ${esc(o)}</label>`; }).join("")}</div>`).join("")}
    ${res ? '<button class="gold full" id="bk">Temalarǵa →</button>' : '<button class="gold full" id="sb">Testti tapsırıw</button><div id="qm" class="err"></div>'}</main>`;
    bindHead(); $("#hm").onclick = home; scrollTo(0, 0);
    if (res) { $("#bk").onclick = home; return; }
    $("#sb").onclick = async () => {
      const a = qs.map((_, i) => { const r = root.querySelector(`input[name=q${i}]:checked`); return r ? +r.value : -1; });
      if (a.includes(-1)) { $("#qm").textContent = "Barlıq sorawlarǵa juwap beriń."; return; }
      if (!confirm("Testti tapsıramız ba? Juwaplardı keyin ózgertiw múmkin emes.")) return;
      const score = a.filter((x, i) => x == qs[i].a).length, r = { score, total: qs.length, ans: a, at: new Date() };
      if (!isAdmin) { try { await F.updateDoc(uref(), { ["quiz." + t.id]: { score, total: qs.length, ans: a, at: F.serverTimestamp() } }); } catch (e) { $("#qm").textContent = msg(e); return; } prof.quiz = { ...(prof.quiz || {}), [t.id]: r }; }
      render(r);
    };
  };
  render(done ? { score: done.score, total: done.total, ans } : null);
}
async function track(id, sl, total) {
  if (isAdmin) return;
  const old = (prof.viewed || {})[id] || {}, seen = new Set(seenOf(prof, id)); seen.add(sl);
  const max = Math.max(old.max ?? -1, sl), arr = [...seen].sort((x, y) => x - y);
  prof.viewed = { ...(prof.viewed || {}), [id]: { slide: sl, max, total, seen: arr, last: new Date() } };
  try { await F.updateDoc(uref(), { ["viewed." + id]: { slide: sl, max, total, seen: arr, last: F.serverTimestamp() } }); } catch (e) { console.warn(e); }
}

/* ---------- ADMIN ---------- */
let users = [];
async function admin(tab = "stats") {
  if (!isAdmin) return home();
  root.innerHTML = head('<button id="hm">← Oqıwshı kórinisi</button>') + `<main><div class="eyebrow">Basqarıw</div><h1>Admin <span>paneli</span></h1><div class="tabs">${[["stats", "Statistika"], ["users", "Oqıwshılar"], ["edit", "Mazmunnı ózgertiw"], ["order", "Temalar tártibi"], ["rate", "Reyting · Sertifikat"], ["set", "Sazlaw"]].map(x => `<button data-a="${x[0]}" class="${tab == x[0] ? "on" : ""}">${x[1]}</button>`).join("")}</div><div id="ab">Júklenbekte…</div></main>`;
  bindHead(); $("#hm").onclick = home; root.querySelectorAll("[data-a]").forEach(b => b.onclick = () => admin(b.dataset.a));
  try {
    await loadTopics();
    if (!["edit", "set", "order"].includes(tab)) users = (await F.getDocs(F.collection(db, "users"))).docs.map(d => ({ id: d.id, ...d.data() })).filter(u => !ADM.includes((u.email || "").toLowerCase()));
    ({ stats: aStats, users: aUsers, edit: aEdit, order: aOrder, rate: aRate, set: aSet })[tab]();
  } catch (e) { $("#ab").innerHTML = `<p class="err">${esc(msg(e))}</p>`; }
}
function aRate() {
  const qt = topics.filter(t => t.quiz), max = qt.reduce((a, t) => a + t.quiz, 0);
  let thr = 80; try { thr = +(localStorage.getItem("certThr") || 80); } catch (e) { }
  const rows = users.map(u => { const q = u.quiz || {}; let sc = 0, n = 0; qt.forEach(t => { if (q[t.id]) { sc += q[t.id].score; n++; } }); return { u, sc, n, pct: max ? Math.round(sc / max * 100) : 0 }; })
    .sort((a, b) => b.sc - a.sc || b.n - a.n);
  $("#ab").innerHTML = `<div class="box"><b>Sertifikat shárti:</b> barlıq ${qt.length} temanıń testin tapsırıp, keminde <input id="thr" type="number" min="0" max="100" value="${thr}" style="width:80px;display:inline-block"> % ball jıynaw. Jámi múmkin ball: <b>${max}</b>.</div>
  <div class="tw" style="margin-top:12px"><table><tr><th>#</th><th>Oqıwshı</th><th>Ball</th><th>%</th><th>Testler</th><th>Sertifikat</th><th></th></tr>${rows.map((r, i) => {
    const ok = r.n == qt.length && r.pct >= thr;
    return `<tr><td>${i + 1}</td><td><b>${esc(r.u.name || "")}</b><br><small>${esc(r.u.email || "")}</small></td><td><b>${r.sc}</b> / ${max}</td><td>${r.pct}%</td><td>${r.n} / ${qt.length}</td><td>${ok ? '<b class="up">✓ Beriledi</b>' : r.n < qt.length ? "<small>Testler tawsılmaǵan</small>" : '<small class="dn">Ball jetpeydi</small>'}</td><td>${r.n ? `<button class="mini" data-rz="${r.u.id}">Testlerin nollaw</button>` : ""}</td></tr>`; }).join("")}</table></div>`;
  $("#thr").onchange = e => { try { localStorage.setItem("certThr", e.target.value); } catch (er) { } aRate(); };
  root.querySelectorAll("[data-rz]").forEach(b => b.onclick = async () => { if (!confirm("Bul oqıwshınıń barlıq test nátiyjeleri óshiriledi, ol testlerdi qayta tapsıradı. Dawam etemiz be?")) return; const u = users.find(x => x.id == b.dataset.rz); await F.updateDoc(F.doc(db, "users", u.id), { quiz: {} }); u.quiz = {}; aRate(); });
}
function aStats() {
  const wk = Date.now() - 7 * 864e5, n = users.length;
  const act = users.filter(u => u.lastLogin && u.lastLogin.toDate && u.lastLogin.toDate().getTime() > wk).length;
  const seen = users.filter(u => Object.keys(u.viewed || {}).length).length, got = users.filter(u => (u.unlocked || []).length).length;
  $("#ab").innerHTML = `<div class="stat"><div class="box"><small>Kirgen (dizimnen ótken) oqıwshılar</small><b>${n}</b></div><div class="box"><small>Sońǵı 7 kúnde aktiv</small><b>${act}</b></div><div class="box"><small>Sabaqlıq ashıp berilgen</small><b>${got}</b></div><div class="box"><small>Sabaqlıq kórgen oqıwshılar</small><b>${seen}</b></div><div class="box"><small>Dostupı aktiv (30 kún)</small><b>${users.filter(u => hasAcc(u)).length}</b></div><div class="box"><small>Dostup tawsılǵan / berilmegen</small><b>${users.filter(u => !hasAcc(u)).length}</b></div></div>
  <div class="tw"><table><tr><th>Tema</th><th>Ashılǵan</th><th>Kórgen</th><th>Aqırına jetken</th></tr>${topics.map(t => `<tr><td><b>${esc(t.title)}</b></td><td>${users.filter(u => (u.unlocked || []).includes(t.id)).length}</td><td>${users.filter(u => seenOf(u, t.id).length).length}</td><td>${users.filter(u => { const v = (u.viewed || {})[t.id]; return isDone(u, t); }).length}</td></tr>`).join("")}</table></div>`;
}
function aUsers() {
  const accCell = u => { const e = accEnd(u); if (!e) return '<span class="dn">berilmegen</span>'; const dl = Math.ceil((e - Date.now()) / DAY); return e.getTime() > Date.now() ? `<span class="up">${d2s(e)}</span><br><small>${dl} kún qaldı</small>` : `<span class="dn">tawsılǵan<br>${d2s(e)}</span>`; };
  const row = u => { const un = u.unlocked || []; return `<tr><td><b>${esc(u.name)}</b><br><small>${esc(u.email)}</small></td><td>${fmt(u.lastLogin)}</td><td>${accCell(u)}</td><td>${topics.map((t, i) => `<button class="chip ${un.includes(t.id) ? "on" : ""}" data-u="${u.id}" data-t="${t.id}" title="${esc(t.title)}">${i + 1}</button>`).join("")}</td><td><button class="mini gold" data-g="${u.id}">Dostup 30 kún</button> <button class="mini" data-x="${u.id}">+30 kún</button> <button class="mini" data-xn="${u.id}">+ basqa kún</button> <button class="mini" data-st="${u.id}">Toqtatıw</button><br><button class="mini" data-nx="${u.id}">Keyingisin ashıw</button> <button class="mini" data-all="${u.id}">Barlıq tema</button> <button class="mini" data-no="${u.id}">Temalardı jabıw</button></td><td>${topics.filter(t => isDone(u, t)).length}/${topics.length} tamam</td></tr>`; };
  $("#ab").innerHTML = `<p class="sub"><b>Dostup 30 kún</b> — oqıwshıǵa 30 kún dostup beredi hám barlıq temanı ashadı (oqıwshı olardı izbe-izlikte kóredi). <b>+30 kún</b> — dostupti uzaytadı. Altın nomer = ashıq tema.</p><div class="tw"><table><tr><th>Oqıwshı</th><th>Sońǵı kiriw</th><th>Dostup</th><th>Ashıq temalar</th><th>Háreket</th><th>Kórgen</th></tr>${users.map(row).join("") || "<tr><td colspan=6>Elege oqıwshı joq.</td></tr>"}</table></div>`;
  const save = async (id, arr) => { const u = users.find(x => x.id == id); await F.updateDoc(F.doc(db, "users", id), { unlocked: arr }); u.unlocked = arr; aUsers(); };
  const grant = async (id, days, all) => {
    const u = users.find(x => x.id == id), cur = accEnd(u), base = cur && cur.getTime() > Date.now() ? cur : new Date(), end = new Date(base.getTime() + days * DAY);
    const upd = { accessUntil: F.Timestamp.fromDate(end) }; if (all) upd.unlocked = topics.map(t => t.id);
    await F.updateDoc(F.doc(db, "users", id), upd); u.accessUntil = upd.accessUntil; if (all) u.unlocked = upd.unlocked; aUsers();
  };
  root.querySelectorAll("[data-u]").forEach(b => b.onclick = () => { const u = users.find(x => x.id == b.dataset.u), s = new Set(u.unlocked || []); s.has(b.dataset.t) ? s.delete(b.dataset.t) : s.add(b.dataset.t); save(u.id, [...s]); });
  root.querySelectorAll("[data-nx]").forEach(b => b.onclick = () => { const u = users.find(x => x.id == b.dataset.nx), n = topics.find(t => !(u.unlocked || []).includes(t.id)); if (n) save(u.id, [...(u.unlocked || []), n.id]); else alert("Barlıq temalar ashılǵan."); });
  root.querySelectorAll("[data-all]").forEach(b => b.onclick = () => save(b.dataset.all, topics.map(t => t.id)));
  root.querySelectorAll("[data-no]").forEach(b => b.onclick = () => save(b.dataset.no, []));
  root.querySelectorAll("[data-g]").forEach(b => b.onclick = () => grant(b.dataset.g, 30, true));
  root.querySelectorAll("[data-x]").forEach(b => b.onclick = () => grant(b.dataset.x, 30, false));
  root.querySelectorAll("[data-xn]").forEach(b => b.onclick = () => { const n = parseInt(prompt("Neshe kún qosamız?", "7")); if (n > 0) grant(b.dataset.xn, n, false); });
  root.querySelectorAll("[data-st]").forEach(b => b.onclick = async () => { if (!confirm("Dostup toqtatılsın ba?")) return; const u = users.find(x => x.id == b.dataset.st); u.accessUntil = F.Timestamp.fromDate(new Date(Date.now() - 1000)); await F.updateDoc(F.doc(db, "users", u.id), { accessUntil: u.accessUntil }); aUsers(); });
}

/* ---------- Mazmunnı ózgertiw ---------- */
let edT = null, edS = [], edI = -1;
async function aEdit(sel) {
  if (!topics.length) { $("#ab").innerHTML = '<p>Elege tema joq. "Sazlaw" bóliminen bastapqı mazmunnı júkle.</p>'; return; }
  const id = sel || (edT && edT.id) || topics[0].id;
  if (!edT || edT.id != id) { edT = { ...topics.find(t => t.id == id) }; const s = await F.getDoc(F.doc(db, "content", id)); edS = (s.exists() ? s.data().slides : []).map(x => ({ ...x, b: fx(x.b) })); edI = -1; }
  $("#ab").innerHTML = `<label>Tema</label><select id="ts">${topics.map(t => `<option value="${t.id}" ${t.id == id ? "selected" : ""}>${esc(t.title)}</option>`).join("")}</select>
  <label>Tema atı</label><input id="tt" value="${esc(edT.title)}"><label>Qısqasha sıpatlaması</label><input id="td" value="${esc(edT.desc)}">
  <h3>Slaydlar</h3><div id="sl">${edS.map((s, i) => `<div class="srow"><b>${i + 1}</b><span>${esc(s.h)}</span><button data-up="${i}">↑</button><button data-dn="${i}">↓</button><button data-ed="${i}">✎ Ózgertiw</button><button data-rm="${i}">🗑</button></div>`).join("")}</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button id="ad">+ Slayd qosıw</button><button class="gold" id="sv">💾 Saqlaw (tema hám slaydlar)</button></div><div id="em"></div><div id="se"></div>`;
  $("#ts").onchange = e => { edT = null; aEdit(e.target.value); };
  root.querySelectorAll("[data-up]").forEach(b => b.onclick = () => { const i = +b.dataset.up; if (i > 0) { [edS[i - 1], edS[i]] = [edS[i], edS[i - 1]]; aEdit(id); } });
  root.querySelectorAll("[data-dn]").forEach(b => b.onclick = () => { const i = +b.dataset.dn; if (i < edS.length - 1) { [edS[i + 1], edS[i]] = [edS[i], edS[i + 1]]; aEdit(id); } });
  root.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { if (confirm("Bul slayd óshirilsin be?")) { edS.splice(+b.dataset.rm, 1); aEdit(id); } });
  root.querySelectorAll("[data-ed]").forEach(b => b.onclick = () => slideEd(+b.dataset.ed));
  $("#ad").onclick = () => { edS.push({ k: "Jańa", h: "Jańa slayd", b: "<p>Tekst usı jerge jazıladı.</p>" }); aEdit(id); slideEd(edS.length - 1); };
  $("#tt").oninput = e => edT.title = e.target.value; $("#td").oninput = e => edT.desc = e.target.value;
  $("#sv").onclick = async () => {
    try {
      await F.setDoc(F.doc(db, "content", id), { slides: edS });
      await F.setDoc(F.doc(db, "topics", id), { title: edT.title, desc: edT.desc, order: edT.order, count: edS.length, quiz: edT.quiz || 0 });
      $("#em").innerHTML = '<p class="ok">Saqlandı ✓</p>';
    } catch (e) { $("#em").innerHTML = `<p class="err">${esc(msg(e))}</p>`; }
  };
}
function slideEd(i) {
  const s = edS[i]; let code = false;
  $("#se").innerHTML = `<div class="box" style="margin-top:16px"><h3>${i + 1}-slaydtı ózgertiw</h3><label>Qısqa belgi (joqarı kishi jazıw)</label><input id="sk" value="${esc(s.k)}"><label>Sarlavha</label><input id="sh" value="${esc(s.h)}">
  <label>Tekst (tikkeley ózgertiń; súwret hám sızılmalar saqlanadı)</label><div style="display:flex;gap:6px;margin:6px 0"><button class="mini" id="bb"><b>B</b></button><button class="mini" id="bi"><i>I</i></button><button class="mini" id="bc">&lt;/&gt; HTML kod</button></div>
  <div class="ed" id="eb" contenteditable="true">${s.b}</div><textarea id="ec" style="display:none"></textarea>
  <div style="display:flex;gap:8px;margin-top:10px"><button class="gold" id="ok">Qabıllaw</button><button id="cx">Biykar</button></div></div>`;
  $("#bb").onclick = () => document.execCommand("bold"); $("#bi").onclick = () => document.execCommand("italic");
  $("#bc").onclick = () => { code = !code; if (code) { $("#ec").value = $("#eb").innerHTML; } else { $("#eb").innerHTML = $("#ec").value; } $("#ec").style.display = code ? "" : "none"; $("#eb").style.display = code ? "none" : ""; };
  $("#cx").onclick = () => $("#se").innerHTML = "";
  $("#ok").onclick = () => { s.k = $("#sk").value; s.h = $("#sh").value; s.b = code ? $("#ec").value : $("#eb").innerHTML; $("#se").innerHTML = ""; aEdit(edT.id); $("#em").innerHTML = '<p class="ok">Qabıllandı. Saqlaw túymesin basıwdı umıtpań.</p>'; };
  $("#se").scrollIntoView({ behavior: "smooth" });
}

/* ---------- Temalar tártibi ---------- */
function aOrder() {
  const render = (note = "") => {
    $("#ab").innerHTML = `<p class="sub">Temanıń ornın ózgertiw: kerekli nomerdi jazıp <b>OK</b> basıń (mısalı 9-temanı 2 ge) yamasa ↑ ↓ túymelerin qollanıń. Oqıwshılar temalardı usı tártipte izbe-izlikte kóredi.</p><div id="om">${note}</div>` +
      topics.map((t, i) => `<div class="srow"><input type="number" min="1" max="${topics.length}" value="${i + 1}" style="width:72px;flex:none" id="n_${t.id}"><span>${esc(t.title)}</span><button data-ok="${t.id}">OK</button><button data-up="${t.id}">↑</button><button data-dn="${t.id}">↓</button></div>`).join("");
    root.querySelectorAll("[data-ok]").forEach(b => b.onclick = () => move(b.dataset.ok, (parseInt($("#n_" + b.dataset.ok).value) || 1) - 1));
    root.querySelectorAll("[data-up]").forEach(b => b.onclick = () => move(b.dataset.up, topics.findIndex(t => t.id == b.dataset.up) - 1));
    root.querySelectorAll("[data-dn]").forEach(b => b.onclick = () => move(b.dataset.dn, topics.findIndex(t => t.id == b.dataset.dn) + 1));
  };
  const move = async (id, to) => {
    const from = topics.findIndex(t => t.id == id); to = Math.max(0, Math.min(topics.length - 1, to)); if (from == to) return render();
    const before = Object.fromEntries(topics.map(t => [t.id, t.order])); const [x] = topics.splice(from, 1); topics.splice(to, 0, x); topics.forEach((t, i) => t.order = i + 1);
    try { await Promise.all(topics.filter(t => before[t.id] != t.order).map(t => F.updateDoc(F.doc(db, "topics", t.id), { order: t.order }))); edT = null; render('<p class="ok">Saqlandı ✓ ' + esc(x.title) + " → " + (to + 1) + "-orın</p>"); }
    catch (e) { render(`<p class="err">${esc(msg(e))}</p>`); }
  };
  render();
}

/* ---------- Sazlaw ---------- */
function aSet() {
  $("#ab").innerHTML = `<div class="box"><b>Bastapqı mazmunnı júklew</b><p>Barlıq tema hám slaydtı bazaǵa júkleydi. <b class="dn">Ózgertken tekstleriń óship, bastapqı variantqa qaytadı.</b> Tek birinshi ret yamasa qayta tiklew ushın.</p><button class="gold" id="sd">Bastapqı mazmunnı júklew</button><div id="sm"></div></div>
  <div class="box" style="margin-top:12px;border-color:var(--gold)"><b>Kurstı jańalaw (v9) — 28 tema</b><p>1) content.json daǵı jańa temalardı qosadı, 2) temalar tártibin jańa izbe-izlikke qoyadı, 3) dostupı bar oqıwshılarǵa jańa temalardı da ashadı. <b>Ózgertken tekstleriń saqlanadı.</b></p><button class="gold" id="sv">Kurstı jańalaw</button><div id="svm"></div></div>
  <div class="box" style="margin-top:12px;border-color:var(--gold)"><b>Testlerdi júklew (quiz.json)</b><p>Kompyuterińizdegi quiz.json faylın tańlań. Hár temanıń testi bazaǵa jazıladı (bar bolsa jańalanadı). Oqıwshılardıń aldınǵı nátiyjelerine tiymeydi.</p><input type="file" id="qf" accept=".json"><button class="gold" id="qb" style="margin-top:8px">Testlerdi júklew</button><div id="qmm"></div></div>
  <div class="box" style="margin-top:12px"><b>Jańa temalardı qosıw</b><p>content.json daǵı bazada joq temalardı ǵana qosadı. Ózgertken tekstlerge tiymeydi.</p><button class="gold" id="sn">Jetispegen temalardı qosıw</button><div id="sq"></div></div>
  <div class="box" style="margin-top:12px"><b>Jańa ózgertiwlerdi qollanıw (patch)</b><p>patch.json daǵı túzetilgen slaydlardı ǵana almastıradı (sol slaydlar jańa variantqa aylanadı). Basqa slaydlardaǵı ózgertiwleriń saqlanadı. Jańa temalar ushın "Jetispegen temalardı qosıw" túymesin basıń.</p><button class="gold" id="sp">Patch qollanıw</button><div id="spm"></div></div>
  <div class="box" style="margin-top:12px"><b>Bir temanı jańalaw</b><p>Tańlaǵan temanı content.json daǵı jańa variantqa almastıradı (tek sol temanıń ózgertiwleri óshedi, basqa temalarǵa tiymeydi).</p><select id="rt"></select><button class="gold" id="rb">Usı temanı jańalaw</button><div id="rm"></div></div>
  <div class="box" style="margin-top:12px"><b>Admin:</b> ${esc(me.email)}<br><small>Admin emaili firebase-config.js hám firestore.rules da jazıladı.</small></div>`;
  (async () => { try { const d = await (await fetch("content.json?v=" + Date.now())).json(); $("#rt").innerHTML = d.map(t => `<option value="${t.id}">${esc(t.title)}</option>`).join(""); } catch (e) { } })();
  $("#qb").onclick = async () => {
    const f = $("#qf").files[0]; if (!f) { $("#qmm").innerHTML = '<p class="err">Aldın fayldı tańlań.</p>'; return; }
    try {
      $("#qmm").textContent = "Júklenbekte…"; const d = JSON.parse(await f.text()); await loadTopics(); let n = 0, k = 0;
      for (const t of topics) {
        const items = d[t.id] || [];
        if (items.length) { await F.setDoc(F.doc(db, "quiz", t.id), { items }); n++; k += items.length; }
        if ((t.quiz || 0) != items.length) await F.updateDoc(F.doc(db, "topics", t.id), { quiz: items.length });
      }
      $("#qmm").innerHTML = `<p class="ok">Tayar ✓ ${n} temaǵa ${k} soraw júklendi.</p>`; await loadTopics();
    } catch (e) { $("#qmm").innerHTML = `<p class="err">${esc(msg(e))}</p>`; }
  };
  $("#rb").onclick = async () => {
    const id = $("#rt").value; if (!id || !confirm("Tańlaǵan temanıń mazmunı bastapqı variantqa qaytadı (bul temadaǵı ózgertiwleriń óshedi). Dawam etemiz be?")) return;
    try { $("#rm").textContent = "Júklenbekte…"; const d = await (await fetch("content.json?v=" + Date.now())).json(), t = d.find(x => x.id == id);
      await F.setDoc(F.doc(db, "content", id), { slides: t.slides }); { const ex = topics.find(x => x.id == id); await F.setDoc(F.doc(db, "topics", id), { title: t.title, desc: t.desc, order: ex ? ex.order : t.order, count: t.slides.length, quiz: ex ? ex.quiz || 0 : 0 }); }
      $("#rm").innerHTML = '<p class="ok">Tayar ✓ ' + esc(t.title) + ' jańalandı (' + t.slides.length + ' slayd).</p>'; await loadTopics();
    } catch (e) { $("#rm").innerHTML = `<p class="err">${esc(msg(e))}</p>`; }
  };
  $("#sp").onclick = async () => {
    if (!confirm("patch.json daǵı slaydlar jańa variantqa almasadı. Dawam etemiz be?")) return;
    try {
      $("#spm").textContent = "Júklenbekte…"; await loadTopics(); const d = await (await fetch("patch.json?v=" + Date.now())).json(); const by = {}; let rep = 0, add = 0;
      d.items.forEach(x => (by[x.topic] = by[x.topic] || []).push(x));
      for (const tid in by) {
        const ref = F.doc(db, "content", tid), s = await F.getDoc(ref), slides = s.exists() ? s.data().slides : [];
        for (const it of by[tid]) { let i = it.h ? slides.findIndex(x => x.k === it.k && x.h === it.h) : -1; if (i < 0 && it.h) i = slides.findIndex(x => x.h === it.h); if (i < 0) i = slides.findIndex(x => x.k === it.k); if (i < 0) i = slides.findIndex(x => x.h === it.slide.h); if (i >= 0) { slides[i] = it.slide; rep++; } else { slides.push(it.slide); add++; } }
        await F.setDoc(ref, { slides }); const tp = topics.find(t => t.id == tid);
        if (tp) await F.setDoc(F.doc(db, "topics", tid), { title: tp.title, desc: tp.desc, order: tp.order, count: slides.length, quiz: tp.quiz || 0 });
      }
      $("#spm").innerHTML = `<p class="ok">Tayar ✓ ${rep} slayd jańalandı, ${add} slayd qosıldı (tabılmaǵanları sońına qosıladı).</p>`; await loadTopics();
    } catch (e) { $("#spm").innerHTML = `<p class="err">${esc(msg(e))}</p>`; }
  };
  $("#sv").onclick = async () => {
    if (!confirm("Jańa temalar qosıladı hám tártip jańa izbe-izlikke ózgeredi. Dawam etemiz be?")) return;
    try {
      $("#svm").textContent = "Júklenbekte…"; await loadTopics(); const d = await (await fetch("content.json?v=" + Date.now())).json(); let n = 0;
      for (const t of d) {
        const ex = topics.find(x => x.id == t.id);
        if (!ex) { await F.setDoc(F.doc(db, "content", t.id), { slides: t.slides }); await F.setDoc(F.doc(db, "topics", t.id), { title: t.title, desc: t.desc, order: t.order, count: t.slides.length, quiz: (topics.find(x => x.id == t.id) || {}).quiz || 0 }); n++; }
        else if (ex.order != t.order) await F.updateDoc(F.doc(db, "topics", t.id), { order: t.order });
      }
      const ids = d.map(t => t.id); let u = 0;
      const us = (await F.getDocs(F.collection(db, "users"))).docs.map(x => ({ id: x.id, ...x.data() }));
      for (const x of us) { if (!x.accessUntil) continue; const un = x.unlocked || []; if (ids.every(i => un.includes(i))) continue; await F.updateDoc(F.doc(db, "users", x.id), { unlocked: [...new Set([...un, ...ids])] }); u++; }
      $("#svm").innerHTML = `<p class="ok">Tayar ✓ ${n} jańa tema qosıldı, tártip jańalandı, ${u} oqıwshıǵa jańa temalar ashıldı.</p>`; await loadTopics();
    } catch (e) { $("#svm").innerHTML = `<p class="err">${esc(msg(e))}</p>`; }
  };
  $("#sn").onclick = async () => {
    try {
      $("#sq").textContent = "Júklenbekte…"; await loadTopics(); const d = await (await fetch("content.json")).json(); let n = 0;
      for (const t of d) { if (topics.find(x => x.id == t.id)) continue; const ord = Math.max(0, ...topics.map(x => x.order)) + 1; await F.setDoc(F.doc(db, "content", t.id), { slides: t.slides }); await F.setDoc(F.doc(db, "topics", t.id), { title: t.title, desc: t.desc, order: ord, count: t.slides.length }); topics.push({ id: t.id, order: ord }); n++; }
      $("#sq").innerHTML = '<p class="ok">' + n + ' jańa tema qosıldı ✓</p>'; await loadTopics();
    } catch (e) { $("#sq").innerHTML = `<p class="err">${esc(msg(e))}</p>`; }
  };
  $("#sd").onclick = async () => {
    if (!confirm("Barlıq mazmun bastapqı variantqa qaytadı. Dawam etemiz be?")) return;
    try {
      $("#sm").textContent = "Júklenbekte…"; const d = await (await fetch("content.json")).json(); await loadTopics(); const ordOf = {}; topics.forEach(x => ordOf[x.id] = x.order);
      for (const t of d) { await F.setDoc(F.doc(db, "content", t.id), { slides: t.slides }); await F.setDoc(F.doc(db, "topics", t.id), { title: t.title, desc: t.desc, order: ordOf[t.id] ?? t.order, count: t.slides.length, quiz: (topics.find(x => x.id == t.id) || {}).quiz || 0 }); }
      $("#sm").innerHTML = '<p class="ok">Tayar ✓ ' + d.length + ' tema júklendi.</p>'; await loadTopics();
    } catch (e) { $("#sm").innerHTML = `<p class="err">${esc(msg(e))}</p>`; }
  };
}
