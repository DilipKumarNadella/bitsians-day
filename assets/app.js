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

  // ---- Social wall (hashtag call-to-action) ----
  const HASHTAGS = ["#BITSiansDay2026", "#25yearsofBITSAA", "#BITSAA"];
  const SOCIAL_ICONS = {
    ig: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.62c-3.15 0-3.52.01-4.76.07-.9.04-1.39.19-1.71.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.32-.28.81-.32 1.71-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.04.9.19 1.39.32 1.71.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.13.81.28 1.71.32 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c.9-.04 1.39-.19 1.71-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.32.28-.81.32-1.71.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.04-.9-.19-1.39-.32-1.71-.17-.43-.37-.74-.69-1.06-.32-.32-.63-.52-1.06-.69-.32-.13-.81-.28-1.71-.32-1.24-.06-1.61-.07-4.76-.07zm0 2.76a5.46 5.46 0 110 10.92 5.46 5.46 0 010-10.92zm0 9a3.54 3.54 0 100-7.08 3.54 3.54 0 000 7.08zm6.95-9.22a1.28 1.28 0 11-2.55 0 1.28 1.28 0 012.55 0z"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z"/></svg>',
    li: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>',
  };

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
  // City-meet "phone" fields are WhatsApp numbers (sometimes several, comma/slash separated)
  const splitNumbers = (phone) => String(phone == null ? "" : phone)
    .split(/[,/;&\n]|\band\b/i)
    .map((s) => s.trim())
    .filter((s) => /\d/.test(s));
  const waDigits = (num) => {
    let d = String(num).replace(/[^\d+]/g, "").replace(/^\+/, "");
    if (d.length === 10) d = "91" + d; // assume India for 10-digit local numbers
    return d;
  };
  const waHref = (num) => `https://wa.me/${waDigits(num)}`;
  // Clickable contact name (email > WhatsApp > plain)
  const contactLink = (c) => {
    const name = esc(c.volunteer);
    if (!name) return "";
    if (c.email) return `<a href="${mailtoHref(c.email)}">${name}</a>`;
    const nums = splitNumbers(c.phone);
    if (nums.length) return `<a href="${waHref(nums[0])}" target="_blank" rel="noopener">${name}</a>`;
    return `<b>${name}</b>`;
  };
  // WhatsApp value: one link per number (handles multiple numbers)
  const phoneLink = (phone) => {
    const nums = splitNumbers(phone);
    if (!nums.length) return "";
    return nums.map((n) => `<a href="${waHref(n)}" target="_blank" rel="noopener">${esc(n)}</a>`).join(" · ");
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
      { n: companyMeets.length, l: "Company Meets" },
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

  // Extract URLs from a free-text field + format a multi-line description
  const urlsIn = (s) => String(s == null ? "" : s).match(/https?:\/\/[^\s)\]]+/g) || [];
  const resLabel = (u, i) => /youtube|youtu\.be|spotify/i.test(u) ? "Watch / Listen"
    : /forms\.gle|docs\.google\.com\/forms/i.test(u) ? "Form"
    : /drive\.google/i.test(u) ? "Attachment"
    : "Resource " + (i + 1);
  const mdInline = (s) => s
    .replace(/\*\*_([^*_]+?)_\*\*/g, "<strong>$1</strong>")
    .replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^_\w])_([^_]+?)_(?!\w)/g, "$1<em>$2</em>");
  // Turn bare URLs into clickable links (run after esc + <br> substitution)
  const linkifyUrls = (s) => s.replace(/(https?:\/\/[^\s<]+?)(?=[.,;:!?]?(?:\s|<br>|$))/g,
    (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
  const formatDesc = (s) => esc(String(s == null ? "" : s)).replace(/\r/g, "")
    .split(/\n{2,}/).filter((p) => p.trim())
    .map((p) => `<p>${linkifyUrls(mdInline(p.replace(/^[*+]\s?/gm, "• ").replace(/\n/g, "<br>")))}</p>`).join("");

  // A meaningful call-to-action label for an initiative's primary link
  function linkLabel(f) {
    const n = String(f.name || "").toLowerCase();
    const u = String(f.link || "").toLowerCase();
    if (/company ambassador|\bcan\b/.test(n)) return "Join CAN";
    if (/volunteer/.test(n)) return "Volunteer";
    if (/^join\b/.test(n)) return "Register";
    if (/forms\.gle|docs\.google\.com\/forms/.test(u)) return "Register";
    return "Learn more";
  }

  function renderFeatured() {
    $("#featuredGrid").innerHTML = featured.map((f, i) => {
      const email = f.pocEmail ? `<a href="mailto:${esc(f.pocEmail)}">${esc(f.pocEmail)}</a>` : "";
      const poc = (f.poc || email)
        ? `<p class="feature-poc">👤 ${esc(f.poc)}${f.poc && email ? " · " : ""}${email}</p>` : "";
      const link = isUrl(f.link) ? `<a class="mini-link" href="${esc(f.link)}" target="_blank" rel="noopener">${esc(linkLabel(f))}</a>` : "";
      return `<article class="feature-card is-clickable" data-open-featured="${i}">
        ${mediaHtml(f.image, f.name)}
        <div class="feature-body">
          <h3>${esc(f.name)}</h3>
          ${f.team ? `<div class="feature-meta"><span class="pill">${esc(f.team)}</span></div>` : ""}
          ${poc}
          <div class="feature-foot">${link}<span class="mc-link feature-more">View details →</span></div>
        </div>
      </article>`;
    }).join("") || '<p class="empty-note">Initiatives will be announced soon.</p>';
  }

  // Identify a shop URL's region + flag from its domain
  function shopRegion(u) {
    u = String(u || "");
    if (/indipeepal/i.test(u)) return ["India", "\uD83C\uDDEE\uD83C\uDDF3"];
    const m = u.match(/amazon\.([a-z.]+?)(?:[\/?]|$)/i);
    const tld = m ? m[1].toLowerCase() : "";
    return ({
      "com": ["US", "\uD83C\uDDFA\uD83C\uDDF8"], "co.uk": ["UK", "\uD83C\uDDEC\uD83C\uDDE7"], "de": ["Germany", "\uD83C\uDDE9\uD83C\uDDEA"],
      "fr": ["France", "\uD83C\uDDEB\uD83C\uDDF7"], "es": ["Spain", "\uD83C\uDDEA\uD83C\uDDF8"], "it": ["Italy", "\uD83C\uDDEE\uD83C\uDDF9"], "co.jp": ["Japan", "\uD83C\uDDEF\uD83C\uDDF5"],
    })[tld] || ["Shop", "\uD83D\uDECD\uFE0F"];
  }

  function renderMerch() {
    $("#merchGrid").innerHTML = merch.map((m, i) => {
      return `<article class="feature-card is-clickable" data-open-merch="${i}">
        ${mediaHtml(m.image, m.name)}
        <div class="feature-body">
          <h3>${esc(m.name)}</h3>
          <p class="clamp">${esc(shortText(m.description, 150))}</p>
          <div class="feature-foot"><span class="mc-link feature-more">View details &amp; buy \u2192</span></div>
        </div>
      </article>`;
    }).join("") || '<p class="empty-note">Merchandise drops soon.</p>';
  }

  function renderDonate() {
    // Donate tab replaced by a static Contact tab — nothing to render.
  }

  /* ---------------- SOCIAL WALL ---------------- */
  function copyText(el) {
    const text = el.getAttribute("data-copy") || "";
    const flash = () => { el.classList.add("copied"); setTimeout(() => el.classList.remove("copied"), 1400); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(flash).catch(() => fallbackCopy(text, flash));
    } else fallbackCopy(text, flash);
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand("copy"); } catch (e) { /* ignore */ }
    document.body.removeChild(ta); if (done) done();
  }

  function platIcon(platform) {
    const p = String(platform || "").toLowerCase();
    if (p.includes("insta")) return SOCIAL_ICONS.ig;
    if (p.includes("linked")) return SOCIAL_ICONS.li;
    if (p.startsWith("x") || p.includes("twitter")) return SOCIAL_ICONS.x;
    return "";
  }
  function postCard(p) {
    const who = p.handle || p.name || "";
    const icon = platIcon(p.platform);
    const media = p.image
      ? `<div class="post-media"><img src="${esc(p.image)}" alt="${esc(who || "BITSians' Day post")}" loading="lazy" onerror="this.closest('.post-media').remove()"/></div>`
      : "";
    const cap = p.caption ? `<p class="post-cap">${esc(shortText(p.caption, 150))}</p>` : "";
    const whoHtml = who ? `<div class="post-who">${icon}<span>${esc(who)}</span></div>` : "";
    const inner = `${media}<div class="post-body">${whoHtml}${cap}</div>`;
    return isUrl(p.link)
      ? `<a class="post-card" href="${esc(p.link)}" target="_blank" rel="noopener">${inner}</a>`
      : `<article class="post-card">${inner}</article>`;
  }

  function renderSocial() {
    const wrap = $("#socialWall");
    if (!wrap) return;
    const tags = HASHTAGS;
    const tagText = tags.join(" ");
    const primary = tags[0].replace(/^#/, "");
    const igUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(primary)}/`;
    const xPost = `https://x.com/intent/tweet?text=${encodeURIComponent("Celebrating BITSians' Day 2026! " + tagText)}`;
    const liUrl = `https://www.linkedin.com/feed/hashtag/?keywords=${encodeURIComponent(primary)}`;
    const chip = (t) =>
      `<button class="hashtag-chip" type="button" data-copy="${esc(t)}"><span>${esc(t)}</span><span class="hc-ico" aria-hidden="true">⧉</span></button>`;
    const cta = (cls, href, icon, title, sub) =>
      `<a class="social-cta ${cls}" href="${href}" target="_blank" rel="noopener">${icon}<span class="sc-text"><b>${esc(title)}</b><small>${esc(sub)}</small></span></a>`;
    wrap.innerHTML = `
      <p class="social-intro">Snap a photo at your city, campus or company meet, add the official hashtags, and post it on Instagram, X or LinkedIn. Tag us and your moment becomes part of the global BITSians' Day celebration.</p>
      <div class="hashtag-card">
        <span class="hashtag-label">Use these hashtags</span>
        <div class="hashtag-row">
          ${tags.map(chip).join("")}
          <button class="btn btn-primary copy-all" type="button" data-copy="${esc(tagText)}">Copy all</button>
        </div>
      </div>
      <ol class="social-steps">
        <li><span class="ss-num">1</span><div><b>Snap</b> a photo at your meet</div></li>
        <li><span class="ss-num">2</span><div><b>Copy</b> the hashtags above</div></li>
        <li><span class="ss-num">3</span><div><b>Post</b> &amp; tag us on your platform</div></li>
      </ol>
      <div class="social-platforms">
        ${cta("ig", igUrl, SOCIAL_ICONS.ig, "Instagram", "See #" + primary + " posts")}
        ${cta("x", xPost, SOCIAL_ICONS.x, "Post on X", "Share with the hashtags")}
        ${cta("li", liUrl, SOCIAL_ICONS.li, "LinkedIn", "See the hashtag feed")}
      </div>`;
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

    // These groups sit under their own "Core Teams" collapsible section
    const CORE = ["marketing & communications", "finance", "people strategy", "merchandise team", "partnership/sponsorships & fundraising"];
    const crSubs = [], coreSubs = [];
    groups.forEach((g) => {
      (CORE.includes(String(g.name).trim().toLowerCase()) ? coreSubs : crSubs).push(g);
    });

    // Drop a leading "Chapter Relations - " so subheadings read cleanly
    const subLabel = (name) => String(name).replace(/^\s*chapter\s+relations\s*[-–—:·]\s*/i, "").trim() || name;

    const subAccordion = (g) => `
      <details class="team-sub">
        <summary class="team-sub-title">${esc(subLabel(g.name))}<span class="team-sub-count">${(g.members || []).length}</span></summary>
        <div class="team-grid">${(g.members || []).map(memberCard).join("")}</div>
      </details>`;

    const parent = (title, subs) => subs.length ? `
      <details class="team-parent">
        <summary class="team-parent-title">${esc(title)}</summary>
        <div class="team-sub-list">${subs.map(subAccordion).join("")}</div>
      </details>` : "";

    el.innerHTML = parent("Chapter Relations", crSubs) + parent("Core Teams", coreSubs);
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
      ${block("�", "WhatsApp", phoneLink(c.phone))}
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
      ${block("�", "WhatsApp", phoneLink(c.phone))}
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
      ${block("💬", "WhatsApp", phoneLink(c.phone))}
      <div class="m-actions">${c.email ? `<a class="btn btn-primary" href="${mailtoHref(c.email)}">Reach out</a>` : ""}</div>`);
  }

  function openFeaturedModal(f) {
    if (!f) return;
    const email = f.pocEmail ? `<a href="mailto:${esc(f.pocEmail)}">${esc(f.pocEmail)}</a>` : "";
    const links = [];
    urlsIn(f.resources).forEach((u, i) => links.push(`<a class="mini-link" href="${esc(u)}" target="_blank" rel="noopener">${resLabel(u, i)}</a>`));
    if (isUrl(f.link)) links.push(`<a class="mini-link" href="${esc(f.link)}" target="_blank" rel="noopener">${esc(linkLabel(f))}</a>`);
    if (isUrl(f.moreInfo)) links.push(`<a class="mini-link" href="${esc(f.moreInfo)}" target="_blank" rel="noopener">More info</a>`);
    if (isUrl(f.community)) links.push(`<a class="mini-link" href="${esc(f.community)}" target="_blank" rel="noopener">Community</a>`);
    // Pull labelled sign-up links (e.g. mentee / mentor) out of the description into buttons
    const actions = [];
    String(f.description || "").replace(/([^\n:]{0,60}?):\s*(https?:\/\/[^\s]+)/g, (_m, lbl, url) => {
      const L = lbl.toLowerCase();
      if (/mentee/.test(L)) actions.push(["Mentee sign up", url]);
      else if (/mentor/.test(L)) actions.push(["Mentor sign up", url]);
      return _m;
    });
    const actionsHtml = actions.map(([l, u]) => `<a class="btn btn-primary" href="${esc(u)}" target="_blank" rel="noopener">${esc(l)}</a>`).join("");
    openModal(`
      <span class="m-region" style="color:var(--red)">${esc(f.team || "BITSAA Initiative")}</span>
      <h2 class="m-title">${esc(f.name)}</h2>
      ${f.image ? `<div class="feature-banner"><img src="${esc(f.image)}" alt="${esc(f.name)}" onerror="this.closest('.feature-banner').remove()"/></div>` : ""}
      ${(f.poc || email) ? `<div class="m-poc">👤 ${esc(f.poc)}${f.poc && email ? " · " : ""}${email}</div>` : ""}
      ${f.description ? `<div class="m-desc">${formatDesc(f.description)}</div>` : ""}
      ${actionsHtml ? `<div class="m-actions">${actionsHtml}</div>` : ""}
      ${links.length ? `<div class="links-note" style="margin-top:16px">Links &amp; resources</div><div class="feature-links">${links.join("")}</div>` : ""}`);
  }

  function openMerchModal(m) {
    if (!m) return;
    const buyUrls = (Array.isArray(m.links) && m.links.length) ? m.links
      : (Array.isArray(DATA.merchLinks) && DATA.merchLinks.length ? DATA.merchLinks.map((x) => Array.isArray(x) ? x[1] : x) : TSHIRT_REGION_LINKS.map((x) => x[1]));
    const buys = buyUrls.filter(isUrl).map((u) => {
      const [r] = shopRegion(u);
      return `<a class="merch-buy" href="${esc(u)}" target="_blank" rel="noopener">${esc(r)}</a>`;
    }).join("");
    openModal(`
      <span class="m-region" style="color:var(--red)">Merchandise</span>
      <h2 class="m-title">${esc(m.name)}</h2>
      ${m.image ? `<div class="feature-banner"><img src="${esc(m.image)}" alt="${esc(m.name)}" onerror="this.closest('.feature-banner').remove()"/></div>` : ""}
      ${m.description ? `<div class="m-desc">${formatDesc(m.description)}</div>` : ""}
      ${buys ? `<div class="links-note" style="margin-top:18px">Choose your region to order</div><div class="merch-buys">${buys}</div>` : ""}`);
  }

  document.addEventListener("click", (e) => {
    const cop = e.target.closest("[data-copy]");
    if (cop) { copyText(cop); return; }
    const cc = e.target.closest("[data-open-city]");
    if (cc && !cc.closest(".leaflet-popup")) return openCityModal(cityMeets[+cc.dataset.openCity]);
    const co = e.target.closest("[data-open-company]");
    if (co) return openCompanyModal(companyMeets[+co.dataset.openCompany]);
    const ci = e.target.closest("[data-open-institute]");
    if (ci) return openInstituteModal(instituteMeets[+ci.dataset.openInstitute]);
    const ff = e.target.closest("[data-open-featured]");
    if (ff && !e.target.closest("a")) return openFeaturedModal(featured[+ff.dataset.openFeatured]);
    const cm = e.target.closest("[data-open-merch]");
    if (cm && !e.target.closest("a")) return openMerchModal(merch[+cm.dataset.openMerch]);
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
    renderSocial();
    renderTeam();

    const hash = location.hash.replace("#", "");
    if (hash && panels.some((p) => p.dataset.tab === hash)) setTab(hash);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
