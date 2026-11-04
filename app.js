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
const fx = s => String(s || "").replace(/assets\/img\//g, "").replace(/src="([\w-]+\.jpg)"/g, 'src="$1?v=5"');
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
  root.innerHTML = `<div class="auth"><div style="text-align:center"><img src="logo.jpg?v=5" width="90" style="border-radius:50%"><h2>Intizamli Trading</h2><small style="color:var(--mut)">Intizam • Sabır • Natije</small></div>
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
const head = (extra = "") => `<header><img src="logo.jpg?v=5" alt="logo" id="lg"><div><b>INTIZAMLI_TRADING</b><br><small style="color:var(--mut)">${esc(prof.name)} · ${esc(me.email)}</small></div><div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">${extra}${isAdmin ? '<button id="adm">⚙ Admin</button>' : ""}<button id="out">Shıǵıw</button></div></header>`;
function bindHead() {
  $("#out").onclick = () => A.signOut(auth); const a = $("#adm"); if (a) a.onclick = () => admin("stats"); $("#lg").onclick = home;
}

/* ---------- Oqıwshı: temalar hám slaydlar ---------- */
function home() {
  const un = prof.unlocked || [];
  root.innerHTML = head() + `<main><h1>Trading <span>kursı</span></h1><p class="sub">Sabaqlıqlar admin ruxsat bergen izbe-izlikte ashıladı.</p><div class="grid">` +
    topics.map((t, i) => {
      const open = isAdmin || un.includes(t.id), v = (prof.viewed || {})[t.id];
      const pr = v && t.count ? Math.round(((v.max ?? 0) + 1) / t.count * 100) : 0;
      return `<button class="tc ${open ? "" : "lock"}" ${open ? `data-t="${t.id}"` : "disabled"}><div class="n">${i + 1}-TEMA ${open ? "" : "🔒"}</div><h3>${esc(t.title)}</h3><p>${open ? esc(t.desc) : "Admin ashqanda ashıladı"}</p>${open && pr ? `<div class="bar" style="margin:10px 0 0"><i style="width:${pr}%"></i></div>` : ""}</button>`;
    }).join("") + (topics.length ? "" : "<p>Elege sabaqlıq joq.</p>") + `</div></main>`;
  bindHead(); root.querySelectorAll("[data-t]").forEach(b => b.onclick = () => openTopic(b.dataset.t));
}
async function openTopic(id) {
  root.innerHTML = '<p style="text-align:center;margin-top:80px">Júklenbekte…</p>';
  let slides;
  try { const s = await F.getDoc(F.doc(db, "content", id)); slides = (s.exists() ? s.data().slides : []).map(x => ({ ...x, b: fx(x.b) })); }
  catch (e) { alert(msg(e)); return home(); }
  const t = topics.find(x => x.id == id); let sl = Math.min(((prof.viewed || {})[id] || {}).slide || 0, Math.max(slides.length - 1, 0));
  const show = () => {
    const s = slides[sl] || { k: "", h: "Bos", b: "" };
    root.innerHTML = head('<button id="hm">☰ Temalar</button>') + `<main><div class="n" style="color:var(--gold);font-weight:800">${esc(t.title)}</div><div class="bar"><i style="width:${(sl + 1) / Math.max(slides.length, 1) * 100}%"></i></div>
    <div class="slide"><div class="k">${esc(s.k)}</div><h2>${esc(s.h)}</h2>${s.b}</div>
    <div class="nav"><button id="pv" ${sl ? "" : "disabled"}>← Artqa</button><div class="dots">${slides.map((_, i) => `<i class="${i == sl ? "on" : ""}" data-i="${i}"></i>`).join("")}</div><button class="gold" id="nx">${sl < slides.length - 1 ? "Aldıńǵı →" : "Temalarǵa ✓"}</button></div></main>`;
    bindHead(); $("#hm").onclick = home; $("#pv").onclick = () => { sl--; show(); };
    $("#nx").onclick = () => { sl < slides.length - 1 ? (sl++, show()) : home(); };
    root.querySelectorAll("[data-i]").forEach(d => d.onclick = () => { sl = +d.dataset.i; show(); });
    root.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { sl = +b.dataset.go; show(); });
    scrollTo(0, 0); track(id, sl, slides.length);
  };
  show();
}
async function track(id, sl, total) {
  if (isAdmin) return;
  const old = (prof.viewed || {})[id] || {}, max = Math.max(old.max ?? -1, sl);
  prof.viewed = { ...(prof.viewed || {}), [id]: { slide: sl, max, total, last: new Date() } };
  try { await F.updateDoc(uref(), { ["viewed." + id]: { slide: sl, max, total, last: F.serverTimestamp() } }); } catch (e) { console.warn(e); }
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
  $("#ab").innerHTML = `<div class="stat"><div class="box"><small>Kirgen (dizimnen ótken) oqıwshılar</small><b>${n}</b></div><div class="box"><small>Sońǵı 7 kúnde aktiv</small><b>${act}</b></div><div class="box"><small>Sabaqlıq ashıp berilgen</small><b>${got}</b></div><div class="box"><small>Sabaqlıq kórgen oqıwshılar</small><b>${seen}</b></div></div>
  <div class="tw"><table><tr><th>Tema</th><th>Ashılǵan</th><th>Kórgen</th><th>Aqırına jetken</th></tr>${topics.map(t => `<tr><td><b>${esc(t.title)}</b></td><td>${users.filter(u => (u.unlocked || []).includes(t.id)).length}</td><td>${users.filter(u => (u.viewed || {})[t.id]).length}</td><td>${users.filter(u => { const v = (u.viewed || {})[t.id]; return v && t.count && v.max >= t.count - 1; }).length}</td></tr>`).join("")}</table></div>`;
}
function aUsers() {
  const row = u => { const un = u.unlocked || []; return `<tr><td><b>${esc(u.name)}</b><br><small>${esc(u.email)}</small></td><td>${fmt(u.lastLogin)}</td><td>${topics.map((t, i) => `<button class="chip ${un.includes(t.id) ? "on" : ""}" data-u="${u.id}" data-t="${t.id}" title="${esc(t.title)}">${i + 1}</button>`).join("")}</td><td><button class="mini" data-nx="${u.id}">Keyingisin ashıw</button> <button class="mini" data-all="${u.id}">Barlıq</button> <button class="mini" data-no="${u.id}">Jabıw</button></td><td>${Object.keys(u.viewed || {}).length}/${topics.length}</td></tr>`; };
  $("#ab").innerHTML = `<p class="sub">Sabaqlıqtı ashıw ushın nomerin bas (altın reń = ashıq). "Keyingisin ashıw" — tártibi boyınsha keyingi temanı ashadı.</p><div class="tw"><table><tr><th>Oqıwshı</th><th>Sońǵı kiriw</th><th>Ashıq temalar</th><th>Háreket</th><th>Kórgen</th></tr>${users.map(row).join("") || "<tr><td colspan=5>Elege oqıwshı joq.</td></tr>"}</table></div>`;
  const save = async (id, arr) => { const u = users.find(x => x.id == id); await F.updateDoc(F.doc(db, "users", id), { unlocked: arr }); u.unlocked = arr; aUsers(); };
  const ord = id => topics.map(t => t.id).filter(x => id.includes(x));
  root.querySelectorAll("[data-u]").forEach(b => b.onclick = () => { const u = users.find(x => x.id == b.dataset.u), s = new Set(u.unlocked || []); s.has(b.dataset.t) ? s.delete(b.dataset.t) : s.add(b.dataset.t); save(u.id, [...s]); });
  root.querySelectorAll("[data-nx]").forEach(b => b.onclick = () => { const u = users.find(x => x.id == b.dataset.nx), n = topics.find(t => !(u.unlocked || []).includes(t.id)); if (n) save(u.id, [...(u.unlocked || []), n.id]); else alert("Barlıq temalar ashılǵan."); });
  root.querySelectorAll("[data-all]").forEach(b => b.onclick = () => save(b.dataset.all, topics.map(t => t.id)));
  root.querySelectorAll("[data-no]").forEach(b => b.onclick = () => save(b.dataset.no, []));
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
  $("#ab").innerHTML = `<div class="box"><b>Bastapqı mazmunnı júklew</b><p>Barlıq 9 tema hám slaydtı bazaǵa júkleydi. <b class="dn">Ózgertken tekstleriń óship, bastapqı variantqa qaytadı.</b> Tek birinshi ret yamasa qayta tiklew ushın.</p><button class="gold" id="sd">Bastapqı mazmunnı júklew</button><div id="sm"></div></div>
  <div class="box" style="margin-top:12px"><b>Jańa temalardı qosıw</b><p>content.json daǵı bazada joq temalardı ǵana qosadı. Ózgertken tekstlerge tiymeydi.</p><button class="gold" id="sn">Jetispegen temalardı qosıw</button><div id="sq"></div></div>
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
