import json, re, time, os, io, csv, sys, datetime, urllib.parse
import requests

# ---------------- Source configuration ----------------
# SOURCE = "gsheet" -> read live from the published Google Sheet (default)
#          "excel"  -> read the local .xlsx file (offline fallback)
SOURCE = "gsheet"
SPREADSHEET_ID = "1mVc8dcQDf8QUDXsSx9JE91v7r17CQE5YqPzlOJG_WqM"
EXCEL_SRC = r"c:\Users\dilip\Downloads\BITSians' Day app sheet 2025.xlsx"

OUT_DIR = r"d:\xampp\htdocs\Bitsian_day\data"
os.makedirs(OUT_DIR, exist_ok=True)
CACHE_PATH = os.path.join(OUT_DIR, "_geocache.json")

# Mirror all console output to data/sync.log so scheduled runs are auditable
# without relying on shell redirection.
LOG_PATH = os.path.join(OUT_DIR, "sync.log")


class _Tee:
    def __init__(self, *streams):
        self.streams = streams

    def write(self, s):
        for st in self.streams:
            try:
                st.write(s)
            except Exception:
                pass

    def flush(self):
        for st in self.streams:
            try:
                st.flush()
            except Exception:
                pass


_logf = open(LOG_PATH, "a", encoding="utf-8")
sys.stdout = _Tee(sys.__stdout__, _logf)
sys.stderr = _Tee(sys.__stderr__, _logf)

print(f"[{datetime.datetime.now():%Y-%m-%d %H:%M:%S}] sync start (source={SOURCE})")

_wb = None


def _excel_rows(name):
    global _wb
    if _wb is None:
        import openpyxl
        _wb = openpyxl.load_workbook(EXCEL_SRC, data_only=True)
    return [list(r) for r in _wb[name].iter_rows(values_only=True)]


def _gsheet_rows(name):
    url = ("https://docs.google.com/spreadsheets/d/%s/gviz/tq"
           "?tqx=out:csv&headers=1&sheet=%s" % (SPREADSHEET_ID, urllib.parse.quote(name)))
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    r.encoding = "utf-8"
    head = r.text[:200].lstrip().lower()
    if head.startswith("<!doctype") or head.startswith("<html"):
        raise RuntimeError(
            f"Sheet '{name}' not readable as CSV. Make sure the spreadsheet is shared "
            f"'Anyone with the link -> Viewer' and the tab name matches exactly."
        )
    return list(csv.reader(io.StringIO(r.text)))


def sheet_rows(name):
    """Return a list of rows (row[0] = header). Rows are padded to equal width."""
    rows = _gsheet_rows(name) if SOURCE == "gsheet" else _excel_rows(name)
    if not rows:
        return rows
    width = max(len(x) for x in rows)
    return [list(x) + [""] * (width - len(x)) for x in rows]



def clean(v):
    if v is None:
        return ""
    s = str(v).strip()
    # remove weird bidi/control chars
    s = re.sub(r"[\u202a\u202b\u202c\u200e\u200f\u2066\u2067\u2068\u2069]", "", s)
    # trailing .0 on phone-like numbers
    return s


def phone(v):
    s = clean(v)
    if s.endswith(".0"):
        s = s[:-2]
    return s


def drive_direct(url):
    """Convert a Google Drive share link into a direct-view image URL."""
    u = clean(url)
    m = re.search(r"/d/([A-Za-z0-9_-]+)", u)
    if not m:
        m = re.search(r"[?&]id=([A-Za-z0-9_-]+)", u)
    if m:
        return f"https://drive.google.com/thumbnail?id={m.group(1)}&sz=w1000"
    return u


# ---------- City Meets ----------
rows = sheet_rows("City Meets")
header = rows[0]
city_meets = []
for r in rows[1:]:
    city = clean(r[0])
    if not city:
        continue
    rec = {
        "city": city,
        "volunteer": clean(r[1]),
        "email": clean(r[2]),
        "phone": phone(r[3]),
        "region": clean(r[4]) or "Other",
        "time": clean(r[5]),
        "venue": clean(r[6]),
        "registration": clean(r[7]),
        "notes": clean(r[8]),
    }
    # keep only meaningful meets (must have at least venue/time/volunteer/registration)
    if any([rec["venue"], rec["time"], rec["volunteer"], rec["registration"]]):
        city_meets.append(rec)

# normalize region labels
REGION_MAP = {
    "India": "India",
    "US/Canada": "US/Canada",
    "US / Canada": "US/Canada",
    "Europe": "Europe",
    "ANZ": "Australia/NZ",
    "Australia/NewZealand": "Australia/NZ",
    "Asia Pacific": "Asia Pacific",
    "Middle East": "Middle East",
}
for rec in city_meets:
    rec["region"] = REGION_MAP.get(rec["region"], rec["region"])

# ---------- Geocoding ----------
cache = {}
if os.path.exists(CACHE_PATH):
    with open(CACHE_PATH, encoding="utf-8") as f:
        cache = json.load(f)

COUNTRY_HINT = {
    "India": "India",
    "US/Canada": "",
    "Europe": "",
    "Australia/NZ": "",
    "Asia Pacific": "",
    "Middle East": "",
}


OVERRIDES = {
    "Hyderabad - Breakfast after walk": [17.385, 78.4867],
    "Hyderabad - Brunch, Beer and Beats": [17.385, 78.4867],
    "Hyderabad - Morning Walk": [17.385, 78.4867],
    "Meerut, India": [28.9845, 77.7064],
    "Surat, India": [21.1702, 72.8311],
    "Sydney Evening meet": [-33.8688, 151.2093],
    "Sydney Lunch meet - Opera House": [-33.8568, 151.2153],
    "Sydney Lunch meet - Parramatta": [-33.8150, 151.0000],
    "Vijayawada, India": [16.5062, 80.648],
}


def geo_lookup(query):
    """Free-text geocode with on-disk caching. Returns [lat, lon] or None."""
    query = query.strip()
    if not query:
        return None
    if query in cache:
        return cache[query]
    latlon = None
    try:
        r = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": query, "format": "json", "limit": 1},
            headers={"User-Agent": "bitsians-day-site/1.0 (build script)"},
            timeout=20,
        )
        if r.status_code == 200 and r.json():
            d = r.json()[0]
            latlon = [round(float(d["lat"]), 5), round(float(d["lon"]), 5)]
    except Exception as e:
        print("geocode error", query[:40], e)
    cache[query] = latlon
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f)
    time.sleep(1.1)  # respect Nominatim rate limit
    return latlon


def venue_variants(venue):
    """Generate progressively simpler geocoding queries for a venue address.
    Ordered from most precise to most reliable so we still land on the correct
    neighbourhood (e.g. Madhapur vs Gachibowli) even when the full string fails."""
    parts = [p.strip() for p in re.split(r"[,\n]", venue) if p.strip()]
    country = parts[-1] if parts else ""
    variants = []
    if parts:
        variants.append(", ".join(parts))            # full address
    if len(parts) > 2:
        variants.append(", ".join(parts[1:]))        # drop leading business name
    # Postal-code based (neighbourhood-level precision, esp. India PIN codes)
    m = re.search(r"\b(\d{5,6})\b", venue)
    if m:
        pin = m.group(1)
        variants.append(f"{pin}, {country}".strip(", "))
    # Locality + city + country
    if len(parts) >= 3:
        variants.append(", ".join(parts[-3:]))
        variants.append(", ".join(parts[-2:]))
    seen, out = set(), []
    for v in variants:
        v = re.sub(r"\s+", " ", v).strip(" ,")
        if v and v.lower() not in seen:
            seen.add(v.lower())
            out.append(v)
    return out


def geocode_meet(rec):
    """Prefer the precise venue address; fall back to the city centre."""
    # 1) Venue address with progressive fallbacks (true pin within a city)
    if rec["venue"]:
        for q in venue_variants(rec["venue"]):
            ll = geo_lookup(q)
            if ll:
                return ll, True
    # 2) Manual override for cities that don't geocode cleanly
    if rec["city"] in OVERRIDES:
        return OVERRIDES[rec["city"]], False
    # 3) City-centre fallback
    hint = COUNTRY_HINT.get(rec["region"], "")
    cq = f"{rec['city']}, {hint}" if hint else rec["city"]
    return geo_lookup(cq), False


for i, rec in enumerate(city_meets):
    ll, precise = geocode_meet(rec)
    rec["lat"] = ll[0] if ll else None
    rec["lng"] = ll[1] if ll else None
    rec["precise"] = bool(ll and precise)
    if (i + 1) % 10 == 0:
        print(f"geocoded {i+1}/{len(city_meets)}")

# ---------- Company Meets ----------
rows = sheet_rows("Company Meets")
company_meets = []
for r in rows[1:]:
    name = clean(r[0])
    if not name:
        continue
    company_meets.append({
        "company": name,
        "city": clean(r[1]),
        "volunteer": clean(r[2]),
        "email": clean(r[3]),
    })

# ---------- Institute Meets ----------
rows = sheet_rows("Institute Meets")
institute_meets = []
for r in rows[1:]:
    name = clean(r[0])
    if not name:
        continue
    institute_meets.append({
        "institute": name,
        "location": clean(r[1]),
        "volunteer": clean(r[2]),
        "email": clean(r[3]),
    })

# ---------- Featured events ----------
rows = sheet_rows("Featured events")
h = rows[0]
featured = []
for r in rows[1:]:
    name = clean(r[0])
    if not name:
        continue
    videos = [clean(r[i]) for i in range(11, 16) if len(r) > i and clean(r[i])]
    featured.append({
        "name": name,
        "image": drive_direct(r[1]) if len(r) > 1 else "",
        "organizer": clean(r[2]) if len(r) > 2 else "",
        "community": clean(r[3]) if len(r) > 3 else "",
        "poc": clean(r[4]) if len(r) > 4 else "",
        "pocEmail": clean(r[5]) if len(r) > 5 else "",
        "timeIST": clean(r[6]) if len(r) > 6 else "",
        "timeLocal": clean(r[7]) if len(r) > 7 else "",
        "type": clean(r[8]) if len(r) > 8 else "",
        "details": clean(r[9]) if len(r) > 9 else "",
        "registration": clean(r[10]) if len(r) > 10 else "",
        "videos": videos,
        "spotify": clean(r[16]) if len(r) > 16 else "",
        "resource": clean(r[17]) if len(r) > 17 else "",
    })

# ---------- Merchandise ----------
rows = sheet_rows("Merchandise")
merch = []
for r in rows[1:]:
    name = clean(r[0])
    if not name:
        continue
    links = [clean(r[i]) for i in range(3, 12) if len(r) > i and clean(r[i])]
    merch.append({
        "name": name,
        "image": drive_direct(r[1]) if len(r) > 1 else "",
        "description": clean(r[2]) if len(r) > 2 else "",
        "links": links,
    })

# ---------- Donate (optional — no longer shown on the site) ----------
try:
    rows = sheet_rows("Donate")
except Exception as e:
    print("Donate tab skipped:", e)
    rows = [[]]
donate = []
for r in rows[1:]:
    name = clean(r[0])
    if not name:
        continue
    donate.append({
        "name": name,
        "image": drive_direct(r[1]) if len(r) > 1 else "",
        "description": clean(r[2]) if len(r) > 2 else "",
        "donateUSD": clean(r[3]) if len(r) > 3 else "",
        "donateINR": clean(r[4]) if len(r) > 4 else "",
        "campaignPage": clean(r[5]) if len(r) > 5 else "",
    })


# ---------- Optional tab helper ----------
def _optional(name, required_headers):
    """Fetch an optional tab. Returns rows only if its header matches the
    expected columns (guards against gviz falling back to the first sheet
    when the tab doesn't exist). Otherwise returns None."""
    try:
        rows = sheet_rows(name)
    except Exception as e:
        print(f"optional tab '{name}' skipped:", e)
        return None
    if not rows:
        return None
    hdr = [clean(h).lower() for h in rows[0]]
    if not all(any(req in h for h in hdr) for req in required_headers):
        print(f"optional tab '{name}' not present yet — using in-code fallback")
        return None
    return rows


# ---------- Team (tab: Group | Name | Role | Email | LinkedIn | Photo) ----------
team = []
_team_rows = _optional("Team", ["group", "name"])
if _team_rows:
    _tindex = {}
    for r in _team_rows[1:]:
        g = clean(r[0])
        nm = clean(r[1]) if len(r) > 1 else ""
        if not (g and nm):
            continue
        if g not in _tindex:
            _tindex[g] = {"name": g, "members": []}
            team.append(_tindex[g])
        _tindex[g]["members"].append({
            "name": nm,
            "role": clean(r[2]) if len(r) > 2 else "",
            "email": clean(r[3]) if len(r) > 3 else "",
            "linkedin": clean(r[4]) if len(r) > 4 else "",
            "photo": drive_direct(r[5]) if len(r) > 5 and clean(r[5]) else "",
        })

# ---------- Merch region links (tab: Region | Link) ----------
merch_links = []
_ml_rows = _optional("Merch Links", ["region", "link"])
if _ml_rows:
    for r in _ml_rows[1:]:
        region = clean(r[0])
        link = clean(r[1]) if len(r) > 1 else ""
        if region and link:
            merch_links.append([region, link])


data = {
    "cityMeets": city_meets,
    "companyMeets": company_meets,
    "instituteMeets": institute_meets,
    "featured": featured,
    "merchandise": merch,
    "donate": donate,
    "team": team,
    "merchLinks": merch_links,
}

with open(os.path.join(OUT_DIR, "site-data.json"), "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=1)

# also emit a JS file for file:// robustness
with open(r"d:\xampp\htdocs\Bitsian_day\assets\data.js", "w", encoding="utf-8") as f:
    f.write("window.SITE_DATA = ")
    json.dump(data, f, ensure_ascii=False)
    f.write(";\n")

# ---------- Cache-bust data.js in index.html ----------
# Stamp a fresh ?v=<timestamp> onto the data.js <script> tag so browsers and
# CDNs always fetch the newly written data instead of a cached copy.
INDEX_PATH = r"d:\xampp\htdocs\Bitsian_day\index.html"
try:
    with open(INDEX_PATH, encoding="utf-8") as f:
        _html = f.read()
    _ver = int(time.time())
    _new_html = re.sub(r'(src="assets/data\.js)(\?v=\d+)?(")', rf'\g<1>?v={_ver}\g<3>', _html)
    if _new_html != _html:
        with open(INDEX_PATH, "w", encoding="utf-8") as f:
            f.write(_new_html)
        print("cache-busted data.js in index.html -> v=", _ver)
except Exception as e:
    print("index.html cache-bust skipped:", e)

geocoded = sum(1 for c in city_meets if c["lat"] is not None)
print("SUMMARY")
print("city meets:", len(city_meets), "geocoded:", geocoded)
print("company:", len(company_meets), "institute:", len(institute_meets))
print("featured:", len(featured), "merch:", len(merch), "donate:", len(donate))
print("team groups:", len(team), "merch links:", len(merch_links))
missing = [c["city"] for c in city_meets if c["lat"] is None]
print("missing coords:", missing)
print(f"[{datetime.datetime.now():%Y-%m-%d %H:%M:%S}] sync done — wrote assets/data.js")
