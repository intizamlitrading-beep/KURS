# Intizamli Trading — Kurs sayttı (login, admin, parol tiklaw)

Sayt: **GitHub Pages** (bos orın) + **Firebase** (login, parol tiklaw, bazası, bepul Spark tarifi).
GitHub Pages tek ózi login jasay almaydı, sonıń ushın Firebase qollanıladı.

## Imkaniyatlar
- Email + parol menen dizimnen ótiw hám kiriw
- **Parol tiklaw:** email jazıladı → poshtaǵa link keledi → jańa parol qoyıladı → jańa parol menen kiredi
- **Admin paneli:** statistika, oqıwshılar, sabaqlıqlardı izbe-izlikte ashıw, tekstlerdi ózgertiw
- Oqıwshı tek admin ashqan temalardı kóredi (qalǵanları 🔒)

## 1-qádem: GitHub
1. github.com da jańa repository jasań (mısalı `kurs`), Public.
2. Usı papkadaǵı **barlıq fayllardı** (index.html, app.js, style.css, firebase-config.js, content.json, assets/ h.t.b.) júkleń: *Add file → Upload files*.
3. Settings → Pages → Branch: `main` / `(root)` → Save. Sayt adresi: `https://PAYDALANIWSHI.github.io/kurs/`

## 2-qádem: Firebase
1. console.firebase.google.com → **Add project** (Analytics kerek emes).
2. **Build → Authentication → Get started → Email/Password → Enable.**
3. Authentication → **Settings → Authorized domains → Add domain:** `PAYDALANIWSHI.github.io` (usıǵan usı qosılmasa, kiriw islemeydi).
4. **Build → Firestore Database → Create database** (production mode, qálegen region).
5. Firestore → **Rules** → `firestore.rules` faylındaǵı tekstti kóshirip qoyıń. **`admin@example.com` degen jerdi óz emailińizge** ózgertiń (kishi háripler menen) → Publish.
6. Project settings (⚙) → Your apps → **Web (</>)** → app qosıń → kórsetilgen `firebaseConfig` mánislerin `firebase-config.js` ke kóshirip qoyıń. Sol faylda `ADMIN_EMAILS` ti de óz emailińizge ózgertiń. GitHub ta faylǵa ✎ basıp saqlań.

## 3-qádem: Birinshi iske túsiriw
1. Sayttı ashıp, **admin emailińiz benen dizimnen ótiń** (basqalardan aldın).
2. ⚙ Admin → **Sazlaw → Bastapqı mazmunnı júklew** (9 tema bazaǵa júkleniwi kerek).
3. Oqıwshılar dizimnen ótkennen soń ⚙ Admin → **Oqıwshılar** bóliminde olarǵa temalardı ashıń.

## Kúndelikli paydalanıw
- **Statistika:** neshe oqıwshı kirdi, 7 kúnde neshewi aktiv, sabaqlıqtı neshewi kórdi, tema boyınsha kórgen/aqırına jetken.
- **Oqıwshılar:** nomerlerge basıp temanı ashıw/jabıw, "Keyingisin ashıw" — tártibi boyınsha keyingi temanı ashadı.
- **Mazmunnı ózgertiw:** temanı tańlań → slaydtıń ✎ túymesi → tekstti ózgertiń → *Qabıllaw* → **Saqlaw**. HTML kod rejimi de bar.

## Parol tiklaw xatı
Firebase → Authentication → **Templates → Password reset**: tilin (Uzbek/Russian/English) hám xat tekstin ózgertiw múmkin. Xat Spam qaltasına túsiwi múmkin, oqıwshılarǵa aytıp qoyıń.

## Qáwipsizlik haqqında
- `firebaseConfig` ishindegi apiKey jasırın emes, bul normal. Qorǵanıw `firestore.rules` arqalı isleydi.
- Admin emaili tek rules hám config tiń ishinde. Basqa paydalanıwshı admin bola almaydı.
- Oqıwshılar ashılmaǵan sabaqlıqtı bazadan oqıy almaydı (rules bloklaydı).
- Bepul Spark tarifinde kúnine 50 000 oqıw bar, kishi kurs ushın jetkilikli.

## Jańa tema qosılǵanda
Jańa `content.json` dı GitHub ke júkleseńiz, Admin → Sazlaw → **Jetispegen temalardı qosıw** túymesin basıń. Bul ózgertken tekstleriń óshirmeydi.

## Jańa nusqa (v6) júklegennen soń
1. Admin → Sazlaw → **Jetispegen temalardı qosıw** (Taymfreymler hám Sawda túrleri temaları qosıladı).
2. Admin → Sazlaw → **Patch qollanıw** (túzetilgen slaydlar: Yapon shamı, Modeller suwretleri, Punkt/Pips). Basqa ózgertiwleriń saqlanadı.

## Dostup (30 kún) hám izbe-izlik (v7)
- Oqıwshı dizimnen ótkennen soń Admin → Oqıwshılar de **Dostup 30 kún** túymesin basıń: 30 kún dostup beredi hám barlıq temanı ashadı.
- Temalar izbe-izlikte ashıladı: aldıńǵı temanıń barlıq slaydın kórgennen soń keyingisi ashıladı.
- **+30 kún** — dostupti uzaytıw. Múddet tawsılsa, oqıwshı sabaqlıqtı kóre almaydı (Firestore rules da tekseriledi).
- **Firebase → Firestore → Rules** ke jańa `firestore.rules` tekstin qoyıp Publish basıw SHÁRT.
