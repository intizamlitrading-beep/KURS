import { firebaseConfig, ADMIN_EMAILS } from "./firebase-config.js";
const B = "https://www.gstatic.com/firebasejs/10.12.2/";
const { initializeApp } = await import(B + "firebase-app.js");
const A = await import(B + "firebase-auth.js");
const F = await import(B + "firebase-firestore.js");
const fapp = initializeApp(firebaseConfig);
const auth = A.getAuth(fapp), db = F.getFirestore(fapp);
const root = document.getElementById("app");
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fx = s => String(s || "").replace(/assets\/img\//g, "").replace(/src="([\w-]+\.jpg)"/g, 'src="$1?v=7"');
const fmt = t => t && t.toDate ? t.toDate().toLocaleString("ru-RU") : "—";
const ADM = ADMIN_EMAILS.map(x => x.toLowerCase());
const ERR = {
  "auth/invalid-credential": "Email yamasa parol qáte.", "auth/wrong-password": "Parol qáte.",
  "auth/user-not-found": "Bunday paydalanıwshı tabılmadı.", "auth/email-already-in-use": "Bul email dizimnen ótken. Kiriwdi sına.",
  "auth/weak-password": "Parol keminde 6 belgi bolsın.", "auth/invalid-email": "Email qáte jazılǵan.",
  "auth/too-many-requests": "Kóp urınıs boldı. Biraz kútip qayta sına.", "auth/network-request-failed": "Internet joq.",
  "permission-denied": "Ruxsat joq."
};
const msg = e => ERR[e.code] || ("Qátelik: " + (e.code || e.message));
let me = null, prof = null, topics = [], isAdmin = false, pendingName = "";
const uref = () => F.doc(db, "users", me.uid);

/* ---------- Kiriw / dizimnen ótiw / parol tiklaw ---------- */
function authView(mode = "in", note = "") {
  root.innerHTML = `<div class="auth"><div style="text-align:center"><img src="logo.jpg?v=7" width="90" style="border-radius:50%"><h2>Intizamli Trading</h2><small style="color:var(--mut)">Intizam • Sabır • Natije</small></div>
  <div class="tabs" style="margin-top:16px"><button data-m="in" class="${mode == "in" ? "on" : ""}">Kiriw</button><button data-m="up" class="${mode == "up" ? "on" : ""}">Dizimnen ótiw</button></div>
  <form id="f">${mode == "up" ? `<label>Atıńız</label><input id="n" required>` : ""}
  <label>Email</label><input id="e" type="email" required autocomplete="email">
  ${mode == "reset" ? "" : `<label>Parol</label><input id="p" type="password" minlength="6" required autocomplete="${mode == "in" ? "current-password" : "new-password"}">`}
  <button class="gold full">${mode == "in" ? "Kiriw" : mode == "up" ? "Dizimnen ótiw" : "Link jiberiw"}</button></form>
  ${mode == "in" ? `<p style="text-align:center"><button class="lnk" id="fg">Parolıńızdı umıttıńızba?</button></p>` : ""}
  ${mode == "reset" ? `<p style="text-align:center"><button class="lnk" id="bk">← Kiriwge qaytıw</button></p>` : ""}
  <div id="m" class="${note.startsWith("!") ? "err" : "ok"}">${esc(note.replace(/^!/, ""))}</div></div>`;
  root.querySelectorAll("[data-m]").forEach(b => b.onclick = () => authView(b.dataset.m));
  const fg = $("#fg"); if (fg) fg.onclick = () => authView("reset");
  const bk = $("#bk"); if (bk) bk.onclick = () => authView("in");
  $("#f").onsubmit = async ev => {
    ev.preventDefault(); const e = $("#e").value.trim(), p = $("#p") ? $("#p").value : "";
    try {
      if (mode == "in") await A.signInWithEmailAndPassword(auth, e, p);
      else if (mode == "up") { pendingName = $("#n").value.trim(); await A.createUserWithEmailAndPassword(auth, e, p); }
      else { await A.sendPasswordResetEmail(auth, e); authView("reset", "Eger bul email dizimnen ótken bolsa, jańa parol qoyıw linki jiberildi. Poshtańızdı (Spam di de) tekseriń."); }
    } catch (er) { $("#m").className = "err"; $("#m").textContent = msg(er); }
  };
}

/* ---------- Júklew ---------- */
async function loadProfile() {
  const r = uref(); let s = await F.getDoc(r);
  if (!s.exists()) {
    const name = pendingName || me.displayName || me.email.split("@")[0];
    await F.setDoc(r, { email: me.email, name, unlocked: [], viewed: {}, createdAt: F.serverTimestamp(), lastLogin: F.serverTimestamp() });
  } else await F.updateDoc(r, { lastLogin: F.serverTimestamp() });
  prof = (await F.getDoc(r)).data();
}
async function loadTopics() {
  const s = await F.getDocs(F.collection(db, "topics"));
  topics = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.order - b.order);
}
A.onAuthStateChanged(auth, async u => {
  if (!u) { me = null; authView(); return; }
  me = u; isAdmin = ADM.includes((u.email || "").toLowerCase());
  root.innerHTML = '<p style="text-align:center;margin-top:80px">Júklenbekte…</p>';
  try { await loadProfile(); await loadTopics(); home(); } catch (e) { root.innerHTML = `<div class="auth"><p class="err">${esc(msg(e))}</p><button class="gold full" id="lo">Shıǵıw</button></div>`; $("#lo").onclick = () => A.signOut(auth); }
});
const head = (extra = "") => `<header><img src="logo.jpg?v=7" alt="logo" id="lg"><div><b>INTIZAMLI_TRADING</b><br><small style="color:var(--mut)">${esc(prof.name)} · ${esc(me.email)}</small></div><div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">${extra}${isAdmin ? '<button id="adm">⚙ Admin</button>' : ""}<button id="out">Shıǵıw</button></div></header>`;
function bindHead() {
  $("#out").onclick = () => A.signOut(auth); const a = $("#adm"); if (a) a.onclick = () => admin("stats"); $("#lg").onclick = home;
}

/* ---------- Oqıwshı: temalar hám slaydlar ---------- */
const DAY = 864e5, d2s = d => d.toLocaleDateString("ru-RU");
const accEnd = p => p && p.accessUntil && p.accessUntil.toDate ? p.accessUntil.toDate() : null;
const hasAcc = p => { const e = accEnd(p); return !!e && e.getTime() > Date.now(); };
const seenOf = (p, id) => { const v = (p.viewed || {})[id]; if (!v) return []; if (Array.isArray(v.seen)) return v.seen; return v.max >= 0 ? Array.from({ length: v.max + 1 }, (_, i) => i) : []; };
const isDone = (p, t) => !!t && t.count > 0 && seenOf(p, t.id).length >= t.count;
const topicState = (t, i) => { if (isAdmin) return "open"; if (!(prof.unlocked || []).includes(t.id)) return "admin"; if (!hasAcc(prof)) return "expired"; if (i > 0 && !isDone(prof, topics[i - 1])) return "seq"; return "open"; };
function accessBanner() {
  if (isAdmin) return "";
  const e = accEnd(prof);
  if (!e) return '<div class="note" style="border-color:var(--gold)">Dostup elege berilmegen. Admin dostup bergennen soń sabaqlıqlar ashıladı (30 kún).</div>';
  if (e.getTime() <= Date.now()) return `<div class="note">Dostup múddeti tawsıldı (${d2s(e)}). Dawam etiw ushın admin dostupti uzaytıradı.</div>`;
  return `<div class="note" style="border-color:var(--up)">Dostup: <b>${d2s(e)}</b> shekem (${Math.ceil((e - Date.now()) / DAY)} kún qaldı)</div>`;
}
function home() {
  const TXT = { admin: "Admin ashqanda ashıladı", expired: "Dostup múddeti tawsıldı", seq: "Aldıńǵı temanı aqırına shekem kórseńiz ashıladı" };
  root.innerHTML = head() + `<main><h1>Trading <span>kursı</span></h1><p class="sub">Sabaqlıqlar izbe-izlikte ashıladı: aldıńǵı temanı tolıq kórgennen soń keyingisi ashıladı.</p>${accessBanner()}<div class="grid">` +
    topics.map((t, i) => {
      const st = topicState(t, i), open = st == "open", done = isDone(prof, t), seen = seenOf(prof, t.id).length;
      const pr = t.count ? Math.min(100, Math.round(seen / t.count * 100)) : 0;
      return `<button class="tc ${open ? "" : "lock"}" ${open ? `data-t="${t.id}"` : "disabled"}><div class="n">${i + 1}-TEMA ${done ? "✓" : open ? "" : "🔒"}</div><h3>${esc(t.title)}</h3><p>${open ? esc(t.desc) : TXT[st]}</p>${!isAdmin && open && pr ? `<div class="bar" style="margin:10px 0 0"><i style="width:${pr}%"></i></div>` : ""}</button>`;
    }).join("") + (topics.length ? "" : "<p>Elege sabaqlıq joq.</p>") + `</div></main>`;
  bindHead(); root.querySelectorAll("[data-t]").forEach(b => b.onclick = () => openTopic(b.dataset.t));
}
async function openTopic(id) {
  { const ti = topics.findIndex(x => x.id == id); if (ti < 0 || topicState(topics[ti], ti) != "open") { alert("Bul tema házir ashılmaydı."); return home(); } }
  root.innerHTML = '<p style="text-align:center;margin-top:80px">Júklenbekte…</p>';
  let slides;
  try { const s = await F.getDoc(F.doc(db, "content", id)); slides = (s.exists() ? s.data().slides : []).map(x => ({ ...x, b: fx(x.b) })); }
  catch (e) { alert(msg(e)); return home(); }
  const t = topics.find(x => x.id == id); let sl = Math.min(((prof.viewed || {})[id] || {}).slide || 0, Math.max(slides.length - 1, 0));
  const show = () => {
    const s = slides[sl] || { k: "", h: "Bos", b: "" };
    track(id, sl, slides.length); const seenSet = new Set(seenOf(prof, id)), allSeen = seenSet.size >= slides.length;
    root.innerHTML = head('<button id="hm">☰ Temalar</button>') + `<main><div class="n" style="color:var(--gold);font-weight:800">${esc(t.title)}${isAdmin ? "" : ` · kórilgen ${Math.min(seenSet.size, slides.length)}/${slides.length}`}</div><div class="bar"><i style="width:${(sl + 1) / Math.max(slides.length, 1) * 100}%"></i></div>
    <div class="slide"><div class="k">${esc(s.k)}</div><h2>${esc(s.h)}</h2>${s.b}</div>
    <div class="nav"><button id="pv" ${sl ? "" : "disabled"}>← Artqa</button><div class="dots">${slides.map((_, i) => `<i class="${i == sl ? "on" : seenSet.has(i) ? "seen" : ""}" data-i="${i}"></i>`).join("")}</div><button class="gold" id="nx">${sl < slides.length - 1 ? "Aldıńǵı →" : allSeen || isAdmin ? "Tema tamam ✓ Temalarǵa" : "Temalarǵa"}</button></div>${sl == slides.length - 1 && !allSeen && !isAdmin ? '<div class="note">Keyingi tema ashılıwı ushın bul temanıń barlıq slaydın kóriw kerek (kórilmegen slaydlar kúnǵirt nokat).</div>' : ""}</main>`;
    bindHead(); $("#hm").onclick = home; $("#pv").onclick = () => { sl--; show(); };
    $("#nx").onclick = () => { sl < slides.length - 1 ? (sl++, show()) : home(); };
    root.querySelectorAll("[data-i]").forEach(d => d.onclick = () => { sl = +d.dataset.i; show(); });
    root.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { sl = +b.dataset.go; show(); });
    scrollTo(0, 0);
  };
  show();
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
  root.innerHTML = head('<button id="hm">← Oqıwshı kórinisi</button>') + `<main><h1>Admin <span>paneli</span></h1><div class="tabs">${[["stats", "Statistika"], ["users", "Oqıwshılar"], ["edit", "Mazmunnı ózgertiw"], ["set", "Sazlaw"]].map(x => `<button data-a="${x[0]}" class="${tab == x[0] ? "on" : ""}">${x[1]}</button>`).join("")}</div><div id="ab">Júklenbekte…</div></main>`;
  bindHead(); $("#hm").onclick = home; root.querySelectorAll("[data-a]").forEach(b => b.onclick = () => admin(b.dataset.a));
  try {
    await loadTopics();
    if (tab != "edit" && tab != "set") users = (await F.getDocs(F.collection(db, "users"))).docs.map(d => ({ id: d.id, ...d.data() })).filter(u => !ADM.includes((u.email || "").toLowerCase()));
    ({ stats: aStats, users: aUsers, edit: aEdit, set: aSet })[tab]();
  } catch (e) { $("#ab").innerHTML = `<p class="err">${esc(msg(e))}</p>`; }
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
      await F.setDoc(F.doc(db, "topics", id), { title: edT.title, desc: edT.desc, order: edT.order, count: edS.length });
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

/* ---------- Sazlaw ---------- */
function aSet() {
  $("#ab").innerHTML = `<div class="box"><b>Bastapqı mazmunnı júklew</b><p>Barlıq 11 tema hám slaydtı bazaǵa júkleydi. <b class="dn">Ózgertken tekstleriń óship, bastapqı variantqa qaytadı.</b> Tek birinshi ret yamasa qayta tiklew ushın.</p><button class="gold" id="sd">Bastapqı mazmunnı júklew</button><div id="sm"></div></div>
  <div class="box" style="margin-top:12px"><b>Jańa temalardı qosıw</b><p>content.json daǵı bazada joq temalardı ǵana qosadı. Ózgertken tekstlerge tiymeydi.</p><button class="gold" id="sn">Jetispegen temalardı qosıw</button><div id="sq"></div></div>
  <div class="box" style="margin-top:12px"><b>Jańa ózgertiwlerdi qollanıw (patch)</b><p>patch.json daǵı túzetilgen slaydlardı ǵana almastıradı (sol slaydlar jańa variantqa aylanadı). Basqa slaydlardaǵı ózgertiwleriń saqlanadı. Jańa temalar ushın "Jetispegen temalardı qosıw" túymesin basıń.</p><button class="gold" id="sp">Patch qollanıw</button><div id="spm"></div></div>
  <div class="box" style="margin-top:12px"><b>Bir temanı jańalaw</b><p>Tańlaǵan temanı content.json daǵı jańa variantqa almastıradı (tek sol temanıń ózgertiwleri óshedi, basqa temalarǵa tiymeydi).</p><select id="rt"></select><button class="gold" id="rb">Usı temanı jańalaw</button><div id="rm"></div></div>
  <div class="box" style="margin-top:12px"><b>Admin:</b> ${esc(me.email)}<br><small>Admin emaili firebase-config.js hám firestore.rules da jazıladı.</small></div>`;
  (async () => { try { const d = await (await fetch("content.json?v=" + Date.now())).json(); $("#rt").innerHTML = d.map(t => `<option value="${t.id}">${esc(t.title)}</option>`).join(""); } catch (e) { } })();
  $("#rb").onclick = async () => {
    const id = $("#rt").value; if (!id || !confirm("Tańlaǵan temanıń mazmunı bastapqı variantqa qaytadı (bul temadaǵı ózgertiwleriń óshedi). Dawam etemiz be?")) return;
    try { $("#rm").textContent = "Júklenbekte…"; const d = await (await fetch("content.json?v=" + Date.now())).json(), t = d.find(x => x.id == id);
      await F.setDoc(F.doc(db, "content", id), { slides: t.slides }); await F.setDoc(F.doc(db, "topics", id), { title: t.title, desc: t.desc, order: t.order, count: t.slides.length });
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
        for (const it of by[tid]) { let i = slides.findIndex(x => x.k === it.k); if (i < 0) i = slides.findIndex(x => x.h === it.slide.h); if (i >= 0) { slides[i] = it.slide; rep++; } else { slides.push(it.slide); add++; } }
        await F.setDoc(ref, { slides }); const tp = topics.find(t => t.id == tid);
        if (tp) await F.setDoc(F.doc(db, "topics", tid), { title: tp.title, desc: tp.desc, order: tp.order, count: slides.length });
      }
      $("#spm").innerHTML = `<p class="ok">Tayar ✓ ${rep} slayd jańalandı, ${add} slayd qosıldı (tabılmaǵanları sońına qosıladı).</p>`; await loadTopics();
    } catch (e) { $("#spm").innerHTML = `<p class="err">${esc(msg(e))}</p>`; }
  };
  $("#sn").onclick = async () => {
    try {
      $("#sq").textContent = "Júklenbekte…"; await loadTopics(); const d = await (await fetch("content.json")).json(); let n = 0;
      for (const t of d) { if (topics.find(x => x.id == t.id)) continue; await F.setDoc(F.doc(db, "content", t.id), { slides: t.slides }); await F.setDoc(F.doc(db, "topics", t.id), { title: t.title, desc: t.desc, order: t.order, count: t.slides.length }); n++; }
      $("#sq").innerHTML = '<p class="ok">' + n + ' jańa tema qosıldı ✓</p>'; await loadTopics();
    } catch (e) { $("#sq").innerHTML = `<p class="err">${esc(msg(e))}</p>`; }
  };
  $("#sd").onclick = async () => {
    if (!confirm("Barlıq mazmun bastapqı variantqa qaytadı. Dawam etemiz be?")) return;
    try {
      $("#sm").textContent = "Júklenbekte…"; const d = await (await fetch("content.json")).json();
      for (const t of d) { await F.setDoc(F.doc(db, "content", t.id), { slides: t.slides }); await F.setDoc(F.doc(db, "topics", t.id), { title: t.title, desc: t.desc, order: t.order, count: t.slides.length }); }
      $("#sm").innerHTML = '<p class="ok">Tayar ✓ ' + d.length + ' tema júklendi.</p>'; await loadTopics();
    } catch (e) { $("#sm").innerHTML = `<p class="err">${esc(msg(e))}</p>`; }
  };
}
