/* BITSians' Day 2026 — interactive site logic */
(function () {
  "use strict";

  const DATA = window.SITE_DATA || {};
  const cityMeets = DATA.cityMeets || [];
  const companyMeets = DATA.companyMeets || [];
  const instituteMeets = DATA.instituteMeets || [];
  const featured = DATA.featured || [];
  const merch = DATA.merchandise || [];

  // Region-specific shop links for the official T-shirt (kept here so they
  // survive data.js regeneration from the sheet).
  const TSHIRT_REGION_LINKS = [
    ["India", "https://indipeepal.com/collections/bits-pilani-collection"],
    ["US", "https://bit.ly/4vUm2ao"],
    ["UK", "https://bit.ly/4flsMI8"],
    ["Germany", "https://bit.ly/4y34olY"],
    ["Spain", "https://bit.ly/4vQAwb8"],
    ["France", "https://bit.ly/4gnuhGS"],
    ["Italy", "https://bit.ly/4eUdWXS"],
    ["Japan", "https://bit.ly/4vbCa5W"],
  ];

  // ---- TEAM (test data — edit names/roles/photos/links here) ----
  // photo: optional image URL; leave "" to show initials avatar.
  const TEAM_GROUPS = [
    {
      name: "Chapter Relations Team",
      members: [
        { name: "Ananya Sharma", role: "Team Lead", email: "ananya@bitsaa.org", linkedin: "https://www.linkedin.com/", photo: "https://i.pravatar.cc/200?img=32" },
        { name: "Rohit Menon", role: "Coordinator", email: "rohit@bitsaa.org", linkedin: "https://www.linkedin.com/", photo: "https://i.pravatar.cc/200?img=12" },
        { name: "Priya Nair", role: "Coordinator", email: "priya@bitsaa.org", linkedin: "https://www.linkedin.com/", photo: "https://i.pravatar.cc/200?img=45" },
      ],
    },
    {
      name: "Campus Relations",
      members: [
        { name: "Vikram Rao", role: "Lead", email: "vikram@bitsaa.org", linkedin: "https://www.linkedin.com/", photo: "https://i.pravatar.cc/200?img=15" },
        { name: "Sneha Kulkarni", role: "Outreach", email: "sneha@bitsaa.org", linkedin: "https://www.linkedin.com/", photo: "https://i.pravatar.cc/200?img=47" },
      ],
    },
    {
      name: "Company Ambassador Network",
      members: [
        { name: "Arjun Desai", role: "Network Lead", email: "arjun@bitsaa.org", linkedin: "https://www.linkedin.com/", photo: "https://i.pravatar.cc/200?img=8" },
        { name: "Meera Iyer", role: "Ambassador", email: "meera@bitsaa.org", linkedin: "https://www.linkedin.com/", photo: "https://i.pravatar.cc/200?img=25" },
        { name: "Karan Gupta", role: "Ambassador", email: "karan@bitsaa.org", linkedin: "https://www.linkedin.com/", photo: "" },
      ],
    },
  ];

  const REGION_ORDER = ["India", "US/Canada", "Europe", "Asia Pacific", "Middle East", "Australia/NZ", "Other"];
  const REGION_COLORS = {
    "India": "#f4b942",
    "US/Canada": "#4f9dff",
    "Europe": "#8f7bff",
    "Asia Pacific": "#33d6a6",
    "Middle East": "#ff7a59",
    "Australia/NZ": "#ff5fa2",
    "Other": "#9aa4c8",
  };
  const regionColor = (r) => REGION_COLORS[r] || REGION_COLORS.Other;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const isUrl = (s) => /^https?:\/\//i.test(s || "");
  const linkify = (s) => isUrl(s) ? `<a href="${esc(s)}" target="_blank" rel="noopener">${esc(s.replace(/^https?:\/\//, ""))}</a>` : esc(s);
  // Google Maps link for a meet — prefers the exact venue address, falls back to coords
  const mapsUrl = (c) => {
    if (c.venue) return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(c.venue);
    if (c.lat != null) return "https://www.google.com/maps/search/?api=1&query=" + c.lat + "," + c.lng;
    return "";
  };
  // Contact-card mailto links auto-CC the Chapter Relations team
  const CONTACT_CC = "chapter-relations-team@bitsaa.org";
  const mailtoHref = (email) => `mailto:${esc(email)}?cc=${encodeURIComponent(CONTACT_CC)}`;
  // Digits-only phone for tel: / WhatsApp links (India default country code when none given)
  const telDigits = (phone) => String(phone == null ? "" : phone).replace(/[^+\d]/g, "");
  const telHref = (phone) => `tel:${esc(telDigits(phone))}`;
  const waHref = (phone) => {
    let d = telDigits(phone).replace(/^\+/, "");
    if (d.length === 10) d = "91" + d; // assume India for 10-digit local numbers
    return `https://wa.me/${d}`;
  };
  // Clickable contact name (email > phone > plain)
  const contactLink = (c) => {
    const name = esc(c.volunteer);
    if (!name) return "";
    if (c.email) return `<a href="${mailtoHref(c.email)}">${name}</a>`;
    if (c.phone) return `<a href="${telHref(c.phone)}">${name}</a>`;
    return `<b>${name}</b>`;
  };
  // Phone value: tap-to-call plus a WhatsApp shortcut
  const phoneLink = (phone) => {
    if (!phone) return "";
    return `<a href="${telHref(phone)}">${esc(phone)}</a> · <a href="${waHref(phone)}" target="_blank" rel="noopener">WhatsApp</a>`;
  };

  /* ---------------- Tab navigation ---------------- */
  const panels = $$(".tab-panel");
  const navLinks = $$(".nav-link");

  function setTab(tab) {
    panels.forEach((p) => p.classList.toggle("is-active", p.dataset.tab === tab));
    navLinks.forEach((l) => l.classList.toggle("is-active", l.dataset.tab === tab));
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (tab === "map" && map) setTimeout(() => map.invalidateSize(), 250);
    history.replaceState(null, "", "#" + tab);
    $("#mainNav").classList.remove("open");
  }

  document.addEventListener("click", (e) => {
    // Only treat explicit tab triggers as navigation — never the panel containers
    // themselves (they carry data-tab too), otherwise links inside a panel get
    // their default click cancelled.
    const el = e.target.closest("[data-tab]:not(.tab-panel)");
    if (el && !el.classList.contains("brand")) { e.preventDefault(); setTab(el.dataset.tab); }
    const brand = e.target.closest(".brand");
    if (brand) { e.preventDefault(); setTab("home"); }
  });

  $("#navToggle").addEventListener("click", () => $("#mainNav").classList.toggle("open"));

  window.addEventListener("scroll", () => {
    $("#siteHeader").classList.toggle("scrolled", window.scrollY > 20);
  });

  /* ---------------- Hero stats + regions ---------------- */
  const geoCities = cityMeets.filter((c) => c.lat != null);
  const regionsPresent = REGION_ORDER.filter((r) => cityMeets.some((c) => c.region === r));
  const countByRegion = (r) => cityMeets.filter((c) => c.region === r).length;

  function renderStats() {
    const stats = [
      { n: cityMeets.length, l: "City Meets" },
      { n: regionsPresent.length, l: "Regions" },
      // { n: companyMeets.length, l: "Company Meets" }, // hidden for now
      { n: instituteMeets.length, l: "Campuses" },
    ];
    $("#heroStats").innerHTML = stats.map((s) => `<div class="stat"><b data-count="${s.n}">0</b><span>${s.l}</span></div>`).join("");
    // count-up
    $$("#heroStats b").forEach((el) => {
      const target = +el.dataset.count; let cur = 0;
      const step = Math.max(1, Math.round(target / 40));
      const t = setInterval(() => { cur += step; if (cur >= target) { cur = target; clearInterval(t); } el.textContent = cur; }, 22);
    });
  }

  function renderAboutRegions() {
    $("#aboutRegions").innerHTML = regionsPresent.map((r) => `
      <div class="region-tile" data-region="${esc(r)}">
        <b>${countByRegion(r)}</b>
        <span>${esc(r)}</span>
      </div>`).join("");
    $$("#aboutRegions .region-tile").forEach((t) => t.addEventListener("click", () => {
      cityRegion = t.dataset.region; setTab("city"); syncCityChips(); renderCityGrid();
    }));
  }

  /* ---------------- Region chips ---------------- */
  function buildChips(container, onPick, includeAll = true) {
    const items = includeAll ? ["All", ...regionsPresent] : regionsPresent;
    container.innerHTML = items.map((r) => {
      const dot = r === "All" ? "" : `<span class="dot" style="background:${regionColor(r)}"></span>`;
      return `<button class="chip${r === "All" ? " is-active" : ""}" data-region="${esc(r)}">${dot}${esc(r)}</button>`;
    }).join("");
    container.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip"); if (!chip) return;
      $$(".chip", container).forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      onPick(chip.dataset.region);
    });
  }

  /* ---------------- MAP ---------------- */
  let map, cluster, markers = [];

  function makeIcon(color) {
    const svg = `<svg class="marker-pin" width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg"><path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.7 23.3 0 15 0z" fill="${color}"/><circle cx="15" cy="15" r="6" fill="#ffffff"/></svg>`;
    return L.divIcon({ className: "", html: svg, iconSize: [30, 40], iconAnchor: [15, 40], popupAnchor: [0, -36] });
  }

  function popupHtml(c, idx) {
    const rows = [];
    if (c.time) rows.push(`<div class="pop-row">🕒 <span>${esc(c.time)}</span></div>`);
    if (c.venue) rows.push(`<div class="pop-row">📍 <span><a href="${mapsUrl(c)}" target="_blank" rel="noopener">${esc(c.venue)}</a></span></div>`);
    if (c.volunteer) rows.push(`<div class="pop-row">👤 <span>${contactLink(c)}</span></div>`);
    const reg = isUrl(c.registration) ? `<a class="pop-btn primary" href="${esc(c.registration)}" target="_blank" rel="noopener">Register</a>` : "";
    return `<div class="pop-city">${esc(c.city)}</div>
      <span class="pop-region" style="color:${regionColor(c.region)}">${esc(c.region)}</span>
      ${rows.join("")}
      <div class="pop-actions">${reg}<button class="pop-btn ghost" data-open-city="${idx}">Details</button></div>`;
  }

  function initMap() {
    map = L.map("leafletMap", { worldCopyJump: true, scrollWheelZoom: true, minZoom: 2 }).setView([22, 30], 2);
    map.attributionControl.setPrefix(false); // drop the "Leaflet" flag, keep required data credit
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OSM &copy; CARTO', subdomains: "abcd", maxZoom: 19,
    }).addTo(map);

    cluster = L.markerClusterGroup({
      maxClusterRadius: 45,
      iconCreateFunction: (cl) => L.divIcon({
        html: `<div>${cl.getChildCount()}</div>`, className: "marker-cluster-custom",
        iconSize: [48, 48],
      }),
    });
    map.addLayer(cluster);

    geoCities.forEach((c) => {
      const idx = cityMeets.indexOf(c);
      const m = L.marker([c.lat, c.lng], { icon: makeIcon(regionColor(c.region)) });
      m.bindPopup(popupHtml(c, idx), { maxWidth: 300 });
      m._region = c.region; m._city = c.city.toLowerCase();
      markers.push(m);
    });
    filterMap();

    map.on("popupopen", (e) => {
      const btn = e.popup._contentNode.querySelector("[data-open-city]");
      if (btn) btn.addEventListener("click", () => openCityModal(cityMeets[+btn.dataset.openCity]));
    });
  }

  let mapRegion = "All", mapQuery = "";
  function filterMap() {
    cluster.clearLayers();
    const shown = markers.filter((m) =>
      (mapRegion === "All" || m._region === mapRegion) &&
      (!mapQuery || m._city.includes(mapQuery))
    );
    cluster.addLayers(shown);
  }

  /* ---------------- CITY GRID ---------------- */
  let cityRegion = "All", cityQuery = "";
  const cityGrid = $("#cityGrid");

  function cityCard(c) {
    const idx = cityMeets.indexOf(c);
    const rows = [];
    if (c.time) rows.push(`<div class="mc-row"><span class="ico">🕒</span><span>${esc(c.time)}</span></div>`);
    if (c.venue) rows.push(`<div class="mc-row"><span class="ico">📍</span><span>${esc(c.venue)}</span></div>`);
    const reg = isUrl(c.registration) ? `<span class="mc-link">Register →</span>` : (c.volunteer ? `<span class="mc-link">Details →</span>` : "");
    return `<article class="meet-card" style="--rc:${regionColor(c.region)}" data-open-city="${idx}">
      <div class="mc-top">
        <h3 class="mc-city">${esc(c.city)}</h3>
        <span class="mc-tag">${esc(c.region)}</span>
      </div>
      ${rows.join("") || '<div class="mc-row"><span>Details coming soon — tap to view host info.</span></div>'}
      <div class="mc-foot">
        <span class="mc-host">${c.volunteer ? "Host · <b>" + esc(c.volunteer) + "</b>" : "&nbsp;"}</span>
        ${reg}
      </div>
    </article>`;
  }

  function renderCityGrid() {
    const q = cityQuery.trim().toLowerCase();
    const list = cityMeets.filter((c) =>
      (cityRegion === "All" || c.region === cityRegion) &&
      (!q || (c.city + " " + c.venue + " " + c.volunteer).toLowerCase().includes(q))
    );
    cityGrid.innerHTML = list.map(cityCard).join("");
    $("#cityEmpty").hidden = list.length > 0;
  }

  function syncCityChips() {
    $$("#cityRegions .chip").forEach((c) => c.classList.toggle("is-active", c.dataset.region === cityRegion));
  }

  /* ---------------- COMPANY GRID ---------------- */
  const companyGrid = $("#companyGrid");
  let companyQuery = "";
  function renderCompany() {
    const q = companyQuery.trim().toLowerCase();
    const list = companyMeets.filter((c) => !q || (c.company + " " + c.city).toLowerCase().includes(q));
    companyGrid.innerHTML = list.map((c) => `
      <article class="meet-card" style="--rc:#4f9dff" data-open-company="${companyMeets.indexOf(c)}">
        <div class="mc-top"><h3 class="mc-city">${esc(c.company)}</h3></div>
        <div class="mc-row"><span class="ico">📍</span><span>${esc(c.city || "Location TBA")}</span></div>
        <div class="mc-foot">
          <span class="mc-host">${c.volunteer ? "Host · <b>" + esc(c.volunteer) + "</b>" : "&nbsp;"}</span>
          ${c.email ? '<span class="mc-link">Contact →</span>' : ""}
        </div>
      </article>`).join("");
    $("#companyEmpty").hidden = list.length > 0;
  }

  /* ---------------- INSTITUTE GRID ---------------- */
  const instituteGrid = $("#instituteGrid");
  let instituteQuery = "";
  function renderInstitute() {
    const q = instituteQuery.trim().toLowerCase();
    const list = instituteMeets.filter((c) => !q || (c.institute + " " + c.location).toLowerCase().includes(q));
    instituteGrid.innerHTML = list.map((c) => `
      <article class="meet-card" style="--rc:#8f7bff" data-open-institute="${instituteMeets.indexOf(c)}">
        <div class="mc-top"><h3 class="mc-city">${esc(c.institute)}</h3></div>
        <div class="mc-row"><span class="ico">📍</span><span>${esc(c.location || "Location TBA")}</span></div>
        <div class="mc-foot">
          <span class="mc-host">${c.volunteer ? "Host · <b>" + esc(c.volunteer) + "</b>" : "&nbsp;"}</span>
          ${c.email ? '<span class="mc-link">Contact →</span>' : ""}
        </div>
      </article>`).join("");
    $("#instituteEmpty").hidden = list.length > 0;
  }

  /* ---------------- FEATURE / MERCH / DONATE ---------------- */
  function mediaHtml(img, name) {
    const fb = `<div class="fallback">${esc((name || "B")[0])}</div>`;
    return `<div class="feature-media">${fb}${img ? `<img src="${esc(img)}" alt="${esc(name)}" loading="lazy" onerror="this.remove()"/>` : ""}</div>`;
  }
  function shortText(s, n = 240) { s = String(s || "").replace(/\*\*/g, "").replace(/_/g, ""); return s.length > n ? s.slice(0, n).trim() + "…" : s; }

  function renderFeatured() {
    $("#featuredGrid").innerHTML = featured.map((f) => {
      const meta = [f.type, f.organizer].filter(Boolean).map((m) => `<span class="pill">${esc(m)}</span>`).join("");
      const links = [];
      if (isUrl(f.registration)) links.push(`<a class="mini-link" href="${esc(f.registration)}" target="_blank" rel="noopener">Register</a>`);
      if (isUrl(f.community)) links.push(`<a class="mini-link" href="${esc(f.community)}" target="_blank" rel="noopener">Community</a>`);
      (f.videos || []).slice(0, 3).forEach((v, i) => { if (isUrl(v)) links.push(`<a class="mini-link" href="${esc(v)}" target="_blank" rel="noopener">Video ${i + 1}</a>`); });
      if (isUrl(f.spotify)) links.push(`<a class="mini-link" href="${esc(f.spotify)}" target="_blank" rel="noopener">Spotify</a>`);
      const when = f.timeIST || f.timeLocal;
      return `<article class="feature-card">
        ${mediaHtml(f.image, f.name)}
        <div class="feature-body">
          <h3>${esc(f.name)}</h3>
          <div class="feature-meta">${meta}</div>
          ${when ? `<p><strong>🕒 ${esc(when)}</strong></p>` : ""}
          ${f.details ? `<p class="clamp">${esc(shortText(f.details, 200))}</p>` : ""}
          ${f.poc ? `<p style="font-size:13px;color:var(--ink-faint)">Contact: ${esc(f.poc)}</p>` : ""}
          <div class="feature-links">${links.join("")}</div>
        </div>
      </article>`;
    }).join("") || '<p class="empty-note">Featured events will be announced soon.</p>';
  }

  function renderMerch() {
    const regionLinks = (Array.isArray(DATA.merchLinks) && DATA.merchLinks.length) ? DATA.merchLinks : TSHIRT_REGION_LINKS;
    $("#merchGrid").innerHTML = merch.map((m) => {
      let links;
      if (/t-?shirt/i.test(m.name)) {
        links = `<span class="links-note">Shop by region</span>` +
          regionLinks.map(([label, url]) => `<a class="mini-link" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`).join("");
      } else {
        links = (m.links || []).map((l, i) => `<a class="mini-link" href="${esc(l)}" target="_blank" rel="noopener">${i === 0 ? "Shop" : "Link " + (i + 1)}</a>`).join("");
      }
      return `<article class="feature-card">
        ${mediaHtml(m.image, m.name)}
        <div class="feature-body">
          <h3>${esc(m.name)}</h3>
          <p class="clamp">${esc(shortText(m.description, 220))}</p>
          <div class="feature-links">${links}</div>
        </div>
      </article>`;
    }).join("") || '<p class="empty-note">Merchandise drops soon.</p>';
  }

  function renderDonate() {
    // Donate tab replaced by a static Contact tab — nothing to render.
  }

  /* ---------------- TEAM ---------------- */
  const initials = (name) => String(name || "").trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();
  const ICON_MAIL = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h17A1.5 1.5 0 0 1 22 5.5v13A1.5 1.5 0 0 1 20.5 20h-17A1.5 1.5 0 0 1 2 18.5v-13Zm2.2.5 7.05 5.29a1.2 1.2 0 0 0 1.5 0L19.8 6H4.2ZM20 7.7l-6.65 4.99a3.2 3.2 0 0 1-3.9 0L2.8 7.7V18h17.2V7.7Z"/></svg>';
  const ICON_LINKEDIN = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0-.02-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.75V21h-4v-5.6c0-1.33-.03-3.04-1.9-3.04-1.9 0-2.2 1.45-2.2 2.95V21H9V9Z"/></svg>';

  function memberCard(m) {
    const photo = m.photo
      ? `<img src="${esc(m.photo)}" alt="${esc(m.name)}" loading="lazy" onerror="this.remove()"/>`
      : "";
    const links = [];
    if (m.email) links.push(`<a class="team-icon" href="mailto:${esc(m.email)}" aria-label="Email ${esc(m.name)}">${ICON_MAIL}</a>`);
    if (isUrl(m.linkedin)) links.push(`<a class="team-icon" href="${esc(m.linkedin)}" target="_blank" rel="noopener" aria-label="${esc(m.name)} on LinkedIn">${ICON_LINKEDIN}</a>`);
    return `<article class="team-card">
      <div class="team-avatar" data-initials="${esc(initials(m.name))}">${photo}</div>
      <h4 class="team-name">${esc(m.name)}</h4>
      ${m.role ? `<p class="team-role">${esc(m.role)}</p>` : ""}
      <div class="team-links">${links.join("")}</div>
    </article>`;
  }

  function renderTeam() {
    const el = $("#teamGroups");
    if (!el) return;
    const groups = (Array.isArray(DATA.team) && DATA.team.length) ? DATA.team : TEAM_GROUPS;
    el.innerHTML = groups.map((g) => `
      <div class="team-group">
        <h3 class="team-group-title">${esc(g.name)}</h3>
        <div class="team-grid">${(g.members || []).map(memberCard).join("")}</div>
      </div>`).join("");
  }

  /* ---------------- MODAL ---------------- */
  const modal = $("#modal"), modalBody = $("#modalBody");
  function openModal(html) { modalBody.innerHTML = html; modal.hidden = false; document.body.style.overflow = "hidden"; }
  function closeModal() { modal.hidden = true; document.body.style.overflow = ""; }
  modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  function block(ico, k, v) { return v ? `<div class="m-block"><span class="ico">${ico}</span><div><div class="k">${k}</div><div class="v">${v}</div></div></div>` : ""; }

  function openCityModal(c) {
    if (!c) return;
    const actions = [];
    if (isUrl(c.registration)) actions.push(`<a class="btn btn-primary" href="${esc(c.registration)}" target="_blank" rel="noopener">Register now</a>`);
    if (c.email) actions.push(`<a class="btn btn-outline" href="${mailtoHref(c.email)}">Email host</a>`);
    if (c.lat != null) actions.push(`<a class="btn btn-outline" href="https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}" target="_blank" rel="noopener">Open in Maps</a>`);
    openModal(`
      <span class="m-region" style="color:${regionColor(c.region)}">${esc(c.region)} · City Meet</span>
      <h2 class="m-title">${esc(c.city)}</h2>
      ${block("🕒", "When", esc(c.time))}
      ${block("📍", "Venue", c.venue ? `<a href="${mapsUrl(c)}" target="_blank" rel="noopener">${esc(c.venue)}</a>` : "")}
      ${block("👤", "Point of Contact", contactLink(c) || esc(c.volunteer))}
      ${block("✉️", "Email", c.email ? `<a href="${mailtoHref(c.email)}">${esc(c.email)}</a>` : "")}
      ${block("📞", "Phone", phoneLink(c.phone))}
      ${block("🔗", "Registration", isUrl(c.registration) ? linkify(c.registration) : esc(c.registration))}
      ${block("ℹ️", "Details", esc(c.notes))}
      <div class="m-actions">${actions.join("")}</div>`);
  }

  function openCompanyModal(c) {
    if (!c) return;
    openModal(`
      <span class="m-region" style="color:#4f9dff">Company Meet</span>
      <h2 class="m-title">${esc(c.company)}</h2>
      ${block("📍", "City", esc(c.city))}
      ${block("👤", "Point of Contact", esc(c.volunteer))}
      ${block("✉️", "Email", c.email ? `<a href="${mailtoHref(c.email)}">${esc(c.email)}</a>` : "")}
      ${block("📞", "Phone", phoneLink(c.phone))}
      <div class="m-actions">${c.email ? `<a class="btn btn-primary" href="${mailtoHref(c.email)}">Reach out</a>` : ""}</div>`);
  }

  function openInstituteModal(c) {
    if (!c) return;
    openModal(`
      <span class="m-region" style="color:#8f7bff">Campus Meet</span>
      <h2 class="m-title">${esc(c.institute)}</h2>
      ${block("📍", "Location", esc(c.location))}
      ${block("👤", "Point of Contact", esc(c.volunteer))}
      ${block("✉️", "Email", c.email ? `<a href="${mailtoHref(c.email)}">${esc(c.email)}</a>` : "")}
      ${block("📞", "Phone", phoneLink(c.phone))}
      <div class="m-actions">${c.email ? `<a class="btn btn-primary" href="${mailtoHref(c.email)}">Reach out</a>` : ""}</div>`);
  }

  document.addEventListener("click", (e) => {
    const cc = e.target.closest("[data-open-city]");
    if (cc && !cc.closest(".leaflet-popup")) return openCityModal(cityMeets[+cc.dataset.openCity]);
    const co = e.target.closest("[data-open-company]");
    if (co) return openCompanyModal(companyMeets[+co.dataset.openCompany]);
    const ci = e.target.closest("[data-open-institute]");
    if (ci) return openInstituteModal(instituteMeets[+ci.dataset.openInstitute]);
  });

  /* ---------------- Wire up ---------------- */
  function init() {
    renderStats();
    renderAboutRegions();

    buildChips($("#mapRegions"), (r) => { mapRegion = r; filterMap(); });
    buildChips($("#cityRegions"), (r) => { cityRegion = r; renderCityGrid(); });

    $("#mapSearch").addEventListener("input", (e) => { mapQuery = e.target.value.trim().toLowerCase(); filterMap(); });
    $("#citySearch").addEventListener("input", (e) => { cityQuery = e.target.value; renderCityGrid(); });
    $("#companySearch").addEventListener("input", (e) => { companyQuery = e.target.value; renderCompany(); });
    $("#instituteSearch").addEventListener("input", (e) => { instituteQuery = e.target.value; renderInstitute(); });

    initMap();
    renderCityGrid();
    renderCompany();
    renderInstitute();
    renderFeatured();
    renderMerch();
    renderTeam();

    const hash = location.hash.replace("#", "");
    if (hash && panels.some((p) => p.dataset.tab === hash)) setTab(hash);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
