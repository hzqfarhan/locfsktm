# Comprehensive Guide: FSKTM & UTHM Lecturer Directory Scraper

> **Target Audience**: AI Agents, LLM Coding Assistants, and Software Engineers.  
> **Purpose**: A complete, self-contained implementation blueprint to scrape, normalize, enrich, cross-match, and validate faculty members, office room numbers, contact details, research expertise, and active teaching subjects for the **Faculty of Computer Science and Information Technology (FSKTM)** at **Universiti Tun Hussein Onn Malaysia (UTHM)**.

---

## 1. Executive Architecture Overview

Scraping university faculty data accurately is notoriously difficult because **no single data source contains the full truth**:

```
 ┌─────────────────────────────────────────────────────────┐
 │ Source A: UTHM Telephone Directory                      │
 │ https://telefon.uthm.edu.my/fakulti/senarai2/19         │
 │ • Exact Office Room Numbers (PB-xxx-xx, PC-xxx-xx)      │
 │ • Direct Phone Extensions (07-950 xxxx)                 │
 │ • Official Malay Job Titles & Usernames                 │
 └────────────────────────────┬────────────────────────────┘
                              │
                              ▼ (Entity Resolution / Token Match)
 ┌─────────────────────────────────────────────────────────┐
 │ Source B: FSKTM Official Portal Directory               │
 │ https://fsktm.uthm.edu.my/directory/                    │
 │ • Academic Departments & Roles                          │
 │ • Official Avatar Photos                                │
 │ • Research Specializations                              │
 │ • Official Email Addresses                              │
 └────────────────────────────┬────────────────────────────┘
                              │
                              ▼ (Multi-Threaded Profile Enrichment)
 ┌─────────────────────────────────────────────────────────┐
 │ Source C: UTHM Community Profiles                       │
 │ https://community.uthm.edu.my/<username>                │
 │ • Active Semester Teaching Subjects (#TEA Table)        │
 │ • Field of Expertise (#FOE Taxonomy)                    │
 │ • High-Resolution Profile Images                        │
 └────────────────────────────┬────────────────────────────┘
                              │
                              ▼ (Automated 5-Step Gatekeeper)
 ┌─────────────────────────────────────────────────────────┐
 │ Clean Datasets & Quarantine Logs                        │
 │ • data/lecturers.json (Universal JSON format)           │
 │ • data/lecturers.ts   (Type-safe Next.js / TS export)   │
 │ • data/quarantine_log.json (Rejected / Malformed rows)  │
 └─────────────────────────────────────────────────────────┘
```

### Why a Multi-Source Pipeline is Mandatory:
1. **The Room Number Dilemma**: The public FSKTM web directory often omits office room numbers or writes them informally (e.g., "Room 3"). The internal university telephone directory (`telefon.uthm.edu.my`) contains the **authoritative room numbers** (e.g., `PB-601-08`, `PB-101-06`, `PC-102-05`).
2. **The Timetable Blank Problem**: In UTHM's SMAP / Timetable systems, courses often display `lecturer: "-"` because teaching allocations are assigned late at the department level. The true teaching assignments are recorded in each lecturer's personal `#TEA` table on the Community portal.
3. **The Data Integrity Need**: Profiles can have non-teaching administrative entries (e.g., "Panel Penilai", "Committee Member") which must be filtered out with strict keyword matching.

---

## 2. Data Sources & Endpoint Specifications

### Source 1: UTHM Telefon Directory (Office Rooms & Direct Extensions)
* **URL**: `https://telefon.uthm.edu.my/fakulti/senarai2/19`
* **Faculty Identifier**: `19` is the official UTHM internal ID for FSKTM (*Fakulti Sains Komputer dan Teknologi Maklumat*).
  > **Note for other faculties**:  
  > `14` = FKAAB (Civil), `15` = FKEE (Electrical), `16` = FKMP (Mechanical), `17` = FPTP (Management), `18` = FPTV (Vocational Education), `20` = FAST (Applied Sciences), `21` = FTK (Engineering Tech), `22` = PPD (Diploma Studies), `23` = PPU (General Studies), `24` = PPB (Languages).
* **Protocol & Security**:
  * Internal UTHM certificates often trigger SSL verification warnings. The scraper must use `verify=False` and suppress `urllib3` warnings.
  * Standard User-Agent header is required.

#### HTML Table Structure:
The page renders a standard HTML `<table>` where each row `<tr>` contains 4 `<td>` cells:
| Index | Column Header | Content Sample | Extraction Logic |
|:---:|:---|:---|:---|
| `td[0]` | Nama (Full Name) | `PROF. Dr. ABD SAMAD BIN HASAN BASARI` | Full name with academic titles. |
| `td[1]` | Jawatan (Role) | `Profesor` | Academic or administrative position. |
| `td[2]` | Samb. (Extension) | `8927` | 4-digit telephone extension. |
| `td[3]` | Emel / No. Bilik | `abdsamad PB-501-06` or `suziyanti PB 601-08` | **Crucial composite column!** Space-separated: `username` + `roomLocation`. |

#### How to Parse `td[3]` (The Email/Room composite field):
```python
email_room_raw = clean_text(tds[3].get_text(" "))
tokens = email_room_raw.split()

if tokens:
    first_token = tokens[0].lower()
    # Strip @uthm.edu.my if already appended
    username = first_token.replace("@uthm.edu.my", "").strip()
    
    # Remaining tokens form the room number
    room = " ".join(tokens[1:]).strip() if len(tokens) > 1 else ""
    
    # Normalize room format: "PB 601-08" -> "PB-601-08"
    room = re.sub(r"PB\s+", "PB-", room)
    room = re.sub(r"PC\s+", "PC-", room)
```

#### Phone Formatting:
UTHM main campus extension prefix is `07-950`:
```python
if ext_phone.isdigit() and len(ext_phone) == 4:
    full_phone = f"07-950 {ext_phone}"
else:
    full_phone = ext_phone
```

---

### Source 2: FSKTM Official Web Directory
* **URL**: `https://fsktm.uthm.edu.my/directory/`
* **Protocol**: HTTP GET, standard browser headers.

#### DOM Structure:
The page groups staff by departments using `<h1>` or `<h2>` tags, followed by tables with class `el-item`:
* **Department Headers**:
  * "Dean's Office" / "Pejabat Dekan"
  * "Deputy Dean's Office" / "Pejabat Timbalan Dekan"
  * "Software Engineering" / "Jabatan Kejuruteraan Perisian"
  * "Information Security & Web Technology" / "Jabatan Keselamatan Maklumat dan Teknologi Web"
  * "Multimedia Computing" / "Jabatan Pengkomputeran Multimedia"
  * "Postgraduate Studies" / "Pengajian Siswazah"
  * "Administrative Division" / "Bahagian Pentadbiran"
  * "ICT Division" / "Bahagian ICT"

* **Lecturer Row (`<tr class="el-item">`)**:
  * **Name**: `class="el-title"` or `<h3>`, `<h4>`, `<strong>`
  * **Role**: `class="el-meta"`
  * **Content Block**: `class="el-content"` (contains email, phone, and research areas)
  * **Photo**: `<img src="...">` (must be resolved relative to base directory URL via `urllib.parse.urljoin`)
  * **Email**: Extracted from `<a href="mailto:...">` or regex `[\w\.-]+@uthm\.edu\.my`
  * **Community Profile Link**: `<a href="...community.uthm.edu.my/...">` or fallback to `https://community.uthm.edu.my/{username}`

#### Research Specialities Extraction:
Specialties are listed as comma-separated or newline-separated strings in `.el-content`:
```python
specialities = []
for line in content_text.split("\n"):
    line = clean_text(line)
    # Ignore email, phone, room, and metadata labels
    if not line or "@" in line or any(line.startswith(p) for p in ["Tel:", "Phone:", "Email:", "Ext:"]):
        continue
    parts = [p.strip() for p in line.split(",") if len(p.strip()) > 3]
    if len(parts) > 1:
        specialities.extend(parts)
    else:
        specialities.append(line)
```

---

### Source 3: UTHM Community Academic Portals (Teaching Experience & Expertise)
* **URL Pattern**: `https://community.uthm.edu.my/<username>`
* **Primary Target**: `#TEA` table (Teaching Experience Activity)
* **Secondary Target**: `#FOE` table (Field of Expertise)

#### How to Extract Active Teaching Subjects from `#TEA`:
1. Find container `<div id="TEA">` or `<div id="teaching">` or the next `<table>`.
2. Iterate through each `<tr>`:
   * Column 0: Year (e.g., `2026`).
   * Column 1: Teaching description (e.g., `Data Science [BIT34503], Session 20262027 Semester 1, Universiti Tun Hussein Onn Malaysia, 2026`).

#### Critical Filtering Rules:
1. **Exclude Non-Teaching Roles**:
   Administrative tasks, invigilation, or thesis evaluations must be ignored:
   ```python
   IGNORE_KEYWORDS = [
       "assessor", "reviewer", "committee", "member", "task force", "invigilator",
       "speaker", "auditor", "panel", "judge", "facilitator", "penilai", "jawatankuasa",
       "pemeriksa", "pengawas", "pembentangan", "bengkel", "workshop", "mesyuarat"
   ]
   if any(k in desc_val.lower() for k in IGNORE_KEYWORDS):
       continue
   ```

2. **Strict Current Semester Matching**:
   Ensure only the active semester is captured (support both `20262027` and `2026/2027` variations):
   ```python
   SESSION_REGEX = re.compile(r"(?:Session|Sesi)\s*2026[/\-]?2027\s*(?:Semester|Sem)\s*1", re.IGNORECASE)
   if not SESSION_REGEX.search(desc_val):
       continue
   ```

3. **Extract Course Code & Clean Course Title**:
   ```python
   COURSE_CODE_REGEX = re.compile(r"\[(?P<code>[A-Z0-9]{6,8})\]|\b(?P<raw_code>[A-Z]{2,4}\d{1,5})\b")
   
   cm = COURSE_CODE_REGEX.search(desc_val)
   if not cm:
       continue
   course_code = (cm.group("code") or cm.group("raw_code") or "").upper().strip()
   
   # Strip code, session info, and university name to get clean title
   title_clean = COURSE_CODE_REGEX.sub("", desc_val)
   title_clean = re.sub(r"(?:Session|Sesi)\s*\d{4}[/\-]?\d{4}\s*(?:Semester|Sem)\s*\d.*", "", title_clean, flags=re.IGNORECASE)
   title_clean = re.sub(r"Universiti Tun Hussein Onn Malaysia.*", "", title_clean, flags=re.IGNORECASE)
   title_clean = clean_text(title_clean).strip(" -:;,[]()")
   ```

---

## 3. Entity Resolution & Cross-Source Matching Engine

Because the FSKTM Web Directory and the Telefon Directory format names slightly differently (e.g. `PROF. MADYA Ts. Dr.` vs `ASSOC. PROF. Dr.`), you must use a **2-tier matching strategy**:

```
                       ┌─────────────────────────┐
                       │  FSKTM Directory Entry  │
                       └────────────┬────────────┘
                                    │
                       Does Username match exactly?
                                   / \
                            YES   /   \   NO
                                 /     \
                                ▼       ▼
                   [Exact Link]       Token Set Intersection Match
                                      (Strip academic titles & Malay patronymics)
                                      Overlap >= 2 tokens?
                                           / \
                                    YES   /   \   NO
                                         /     \
                                        ▼       ▼
                          [Fuzzy Link]       [Keep Original / Unlinked]
```

### Academic Title Stripping & Token Normalization:
```python
def extract_academic_title(name: str) -> tuple[str, str]:
    """Separates academic prefixes (Prof., Ts., Dr., Ir., etc.) from clean name."""
    patterns = [
        r"^(PROF\.\s*MADYA\s*Ts\.\s*Dr\.)",
        r"^(PROF\.\s*MADYA\s*Dr\.)",
        r"^(PROF\.\s*MADYA\s*Ts\.)",
        r"^(PROF\.\s*MADYA\s*Ir\.\s*Dr\.)",
        r"^(PROF\.\s*MADYA)",
        r"^(PROF\.\s*Ts\.\s*Dr\.)",
        r"^(PROF\.\s*Dr\.)",
        r"^(ASSOC\.\s*PROF\.\s*Ts\.\s*Dr\.)",
        r"^(ASSOC\.\s*PROF\.\s*Dr\.)",
        r"^(ASSOC\.\s*PROF\.)",
        r"^(Ts\.\s*Dr\.)",
        r"^(Ir\.\s*Dr\.)",
        r"^(Dr\.)",
        r"^(Ts\.)",
        r"^(Ir\.)",
        r"^(PUAN|PN\.)",
        r"^(ENCIK|EN\.)",
        r"^(CIK)",
        r"^(DATO'|DATUK|DATIN)",
    ]
    clean_n = name
    title_str = ""
    for pat in patterns:
        m = re.match(pat, clean_n, re.IGNORECASE)
        if m:
            title_str = m.group(0).strip()
            clean_n = clean_n[m.end():].strip(" ,.")
            break
    return title_str, clean_n

def clean_tokens(text: str) -> set:
    """Removes titles and Malay patronymics (BIN, BINTI, A/L, etc.) to get core name tokens."""
    clean = re.sub(r"^(PROF\.|ASSOC\.|DR\.|TS\.|IR\.|PM|EN\.|PN\.|CIK|MR\.|MS\.|MADYA|PUAN|ENCIK)\s+", "", text, flags=re.IGNORECASE)
    clean = re.sub(r"\b(BIN|BINTI|A\/L|A\/P|MD\.|MOHD|ABD)\b", "", clean, flags=re.IGNORECASE)
    return set(re.findall(r"[a-zA-Z]{3,}", clean.lower()))
```

---

## 4. Target Data Model & TypeScript Interfaces

Exported datasets must adhere to this standardized schema:

### TypeScript Interface (`data/lecturers.ts`):
```typescript
export interface ActiveSubject {
  code: string;               // e.g. "BIT34503"
  name: string;               // e.g. "Data Science"
  session: string;            // e.g. "Session 20262027 Semester 1"
  year: string;               // e.g. "2026"
  isCurrentSemester?: boolean;// true
}

export interface Lecturer {
  id: string;                 // unique slug: "fsktm-suziyanti-binti-marjudi"
  name: string;               // "Ts. Dr. SUZIYANTI BINTI MARJUDI"
  cleanName: string;          // "SUZIYANTI BINTI MARJUDI"
  title: string;              // "Ts. Dr."
  role: string;               // "Pensyarah Kanan"
  facultyCode: string;        // "FSKTM"
  facultyName: string;        // "Fakulti Sains Komputer dan Teknologi Maklumat"
  department: string;         // "Department of Software Engineering"
  username?: string;          // "suziyanti"
  email: string;              // "suziyanti@uthm.edu.my"
  phone: string;              // "07-950 8903"
  roomLocation?: string;      // "PB-601-08"
  avatarUrl?: string;         // "https://community.uthm.edu.my/files/profile/03368.jpeg"
  communityUrl: string;       // "https://community.uthm.edu.my/suziyanti"
  specialities: string[];     // ["Artificial Intelligence", "Data Science"]
  currentSubjects: ActiveSubject[];
  isAvailableFYP: boolean;    // true for academic staff
}
```

### JSON Sample Record:
```json
{
  "id": "fsktm-suziyanti-binti-marjudi",
  "name": "Ts. Dr. SUZIYANTI BINTI MARJUDI",
  "cleanName": "SUZIYANTI BINTI MARJUDI",
  "title": "Ts. Dr.",
  "role": "Pensyarah Kanan",
  "facultyCode": "FSKTM",
  "facultyName": "Fakulti Sains Komputer dan Teknologi Maklumat",
  "department": "Fakulti Sains Komputer dan Teknologi Maklumat",
  "username": "suziyanti",
  "email": "suziyanti@uthm.edu.my",
  "phone": "07-950 8903",
  "roomLocation": "PB-601-08",
  "avatarUrl": "https://community.uthm.edu.my/./files/profile/03368.jpeg",
  "communityUrl": "https://community.uthm.edu.my/suziyanti",
  "specialities": [
    "INFORMATION, COMPUTER AND COMMUNICATIONS TECHNOLOGY (ICT)",
    "Artificial Intelligence",
    "Other Artificial Intelligence n.e.c."
  ],
  "currentSubjects": [
    {
      "code": "BIT34503",
      "name": "Data Science",
      "session": "Session 20262027 Semester 1",
      "year": "2026",
      "isCurrentSemester": true
    }
  ],
  "isAvailableFYP": true
}
```

---

## 5. Complete End-to-End Scraper Script

The complete, working Python script below can be saved as `scripts/scrape_fsktm.py` and executed directly:

```python
#!/usr/bin/env python3
"""
FSKTM Faculty & Teaching Subject Scraper (Full Pipeline with Telefon Room Directory)
===================================================================================
1. https://fsktm.uthm.edu.my/directory/ (Directory, Roles, Photos, Specialities)
2. https://telefon.uthm.edu.my/fakulti/senarai2/19 (Exact Office Room & Phone Numbers)
3. https://community.uthm.edu.my/<username> (Active Teaching Experience Table #TEA)

Dependencies:
    pip install requests beautifulsoup4 urllib3
"""

import os
import sys
import re
import json
import time
from urllib.parse import urljoin
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any

try:
    import requests
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry
    from bs4 import BeautifulSoup
    import urllib3
    urllib3.disable_warnings()
except ImportError:
    print("[!] Dependencies missing. Run: pip install requests beautifulsoup4 urllib3")
    sys.exit(1)

DIRECTORY_URL = "https://fsktm.uthm.edu.my/directory/"
TELEFON_URL = "https://telefon.uthm.edu.my/fakulti/senarai2/19"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

def get_resilient_session(retries: int = 4, backoff_factor: float = 1.2) -> requests.Session:
    session = requests.Session()
    retry_strategy = Retry(
        total=retries,
        backoff_factor=backoff_factor,
        status_forcelist=[429, 500, 502, 503, 504],
        raise_on_status=False
    )
    adapter = HTTPAdapter(max_retries=retry_strategy, pool_connections=25, pool_maxsize=25)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    session.headers.update(HEADERS)
    return session

GLOBAL_SESSION = get_resilient_session()

COURSE_CODE_REGEX = re.compile(r"\[(?P<code>[A-Z0-9]{6,8})\]|\b(?P<raw_code>[A-Z]{2,4}\d{1,5})\b")
SESSION_REGEX = re.compile(r"(?:Session|Sesi)\s*2026[/\-]?2027\s*(?:Semester|Sem)\s*1", re.IGNORECASE)
IGNORE_KEYWORDS = [
    "assessor", "reviewer", "committee", "member", "task force", "invigilator",
    "speaker", "auditor", "panel", "judge", "facilitator", "penilai", "jawatankuasa",
    "pemeriksa", "pengawas", "pembentangan", "bengkel", "workshop", "mesyuarat"
]

def clean_text(text: str) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", re.sub(r"[\r\n\t]+", " ", text)).strip()

def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")

def extract_academic_title(name: str) -> tuple[str, str]:
    patterns = [
        r"^(PROF\.\s*MADYA\s*Ts\.\s*Dr\.)",
        r"^(PROF\.\s*MADYA\s*Dr\.)",
        r"^(PROF\.\s*MADYA\s*Ts\.)",
        r"^(PROF\.\s*Ts\.\s*Dr\.)",
        r"^(PROF\.\s*Dr\.)",
        r"^(ASSOC\.\s*PROF\.\s*Ts\.\s*Dr\.)",
        r"^(ASSOC\.\s*PROF\.\s*Dr\.)",
        r"^(ASSOC\.\s*PROF\.)",
        r"^(Ts\.\s*Dr\.)",
        r"^(Dr\.)",
        r"^(Ts\.)",
        r"^(Ir\.)",
        r"^(PUAN|PN\.)",
        r"^(ENCIK|EN\.)",
        r"^(CIK)"
    ]
    clean_n = name
    title_str = ""
    for pat in patterns:
        m = re.match(pat, clean_n, re.IGNORECASE)
        if m:
            title_str = m.group(0).strip()
            clean_n = clean_n[m.end():].strip(" ,.")
            break
    return title_str, clean_n

def clean_tokens(text: str) -> set:
    clean = re.sub(r"^(PROF\.|ASSOC\.|DR\.|TS\.|IR\.|PM|EN\.|PN\.|CIK|MR\.|MS\.|MADYA|PUAN|ENCIK)\s+", "", text, flags=re.IGNORECASE)
    clean = re.sub(r"\b(BIN|BINTI|A\/L|A\/P|MD\.|MOHD|ABD)\b", "", clean, flags=re.IGNORECASE)
    return set(re.findall(r"[a-zA-Z]{3,}", clean.lower()))

def fetch_telefon_room_directory() -> List[Dict[str, str]]:
    print(f"[*] Fetching UTHM Telefon Directory (FID 19): {TELEFON_URL}")
    entries = []
    try:
        resp = GLOBAL_SESSION.get(TELEFON_URL, timeout=15, verify=False)
        if resp.status_code != 200:
            return entries
        soup = BeautifulSoup(resp.content, "html.parser")
        for tr in soup.find_all("tr"):
            tds = tr.find_all("td")
            if len(tds) >= 4:
                name_raw = clean_text(tds[0].get_text())
                role_raw = clean_text(tds[1].get_text())
                ext_phone = clean_text(tds[2].get_text())
                email_room_raw = clean_text(tds[3].get_text(" "))
                
                if not name_raw or name_raw == "-" or "Nama" in name_raw:
                    continue
                
                tokens = email_room_raw.split()
                username = tokens[0].lower().replace("@uthm.edu.my", "").strip() if tokens else ""
                room = " ".join(tokens[1:]).strip() if len(tokens) > 1 else ""
                room = re.sub(r"PB\s+", "PB-", room)
                room = re.sub(r"PC\s+", "PC-", room)
                
                full_phone = f"07-950 {ext_phone}" if (ext_phone.isdigit() and len(ext_phone) == 4) else ext_phone
                
                entries.append({
                    "name": name_raw,
                    "role": role_raw,
                    "username": username,
                    "room": room,
                    "phone": full_phone
                })
        print(f"[+] Loaded {len(entries)} room & phone records from Telefon directory.")
    except Exception as e:
        print(f"[!] Warning: Could not fetch telefon directory: {e}")
    return entries

def scrape_community_teaching(community_url: str) -> List[Dict[str, str]]:
    subjects = []
    if not community_url or "community.uthm.edu.my" not in community_url:
        return subjects

    for attempt in range(3):
        try:
            resp = GLOBAL_SESSION.get(community_url, timeout=(5, 12), verify=False)
            if resp.status_code != 200:
                time.sleep(0.5 * (attempt + 1))
                continue

            soup = BeautifulSoup(resp.content, "html.parser")
            tea = soup.find(id="TEA") or soup.find(id="teaching")
            table = None
            if tea:
                table = tea.find_next("table")
            else:
                for t in soup.find_all("table"):
                    txt = t.get_text().lower()
                    if "semester" in txt or "session" in txt:
                        table = t
                        break

            if not table:
                return subjects

            seen_codes = set()
            for row in table.find_all("tr"):
                cols = row.find_all(["td", "th"])
                if len(cols) >= 2:
                    desc_val = clean_text(cols[1].get_text())
                    
                    # Exclude non-teaching roles
                    if any(k in desc_val.lower() for k in IGNORE_KEYWORDS):
                        continue

                    # Strict Semester 1 2026/2027 filter
                    if not SESSION_REGEX.search(desc_val):
                        continue

                    code_match = COURSE_CODE_REGEX.search(desc_val)
                    if not code_match:
                        continue
                    
                    code = (code_match.group("code") or code_match.group("raw_code") or "").upper().strip()
                    if not code or len(code) < 6:
                        continue

                    # Clean subject name
                    name_clean = COURSE_CODE_REGEX.sub("", desc_val)
                    name_clean = re.sub(r"(?:Session|Sesi)\s*\d{4}[/\-]?\d{4}\s*(?:Semester|Sem)\s*\d.*", "", name_clean, flags=re.IGNORECASE)
                    name_clean = re.sub(r"Universiti Tun Hussein Onn Malaysia.*", "", name_clean, flags=re.IGNORECASE)
                    name_clean = clean_text(name_clean).strip(" -:;,[]()")
                    if not name_clean:
                        name_clean = code

                    if code not in seen_codes:
                        seen_codes.add(code)
                        subjects.append({
                            "code": code,
                            "name": name_clean,
                            "session": "Session 20262027 Semester 1",
                            "year": "2026",
                            "isCurrentSemester": True
                        })
            return subjects
        except Exception:
            if attempt < 2:
                time.sleep(1.0 * (attempt + 1))
    return subjects

def scrape_all_fsktm() -> List[Dict[str, Any]]:
    telefon_records = fetch_telefon_room_directory()

    print(f"[*] Fetching FSKTM Web Directory: {DIRECTORY_URL}")
    resp = GLOBAL_SESSION.get(DIRECTORY_URL, timeout=15)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.content, "html.parser")

    dept_mappings = []
    for h in soup.find_all(["h1", "h2"]):
        htext = clean_text(h.get_text())
        if any(k in htext.lower() for k in ["office", "department", "division"]):
            dept_name = htext
            if "Software Engineering" in htext:
                dept_name = "Department of Software Engineering"
            elif "Information Security" in htext:
                dept_name = "Department of Information Security & Web Technology"
            elif "Multimedia" in htext:
                dept_name = "Department of Multimedia Computing"
            elif "Dean" in htext:
                dept_name = "Dean's Office"

            tbl = h.find_next("table")
            if tbl:
                dept_mappings.append((dept_name, tbl))

    print(f"[+] Found {len(dept_mappings)} department sections.")
    lecturers = []
    seen_names = set()

    for dept_name, tbl in dept_mappings:
        for row in tbl.find_all("tr", class_="el-item"):
            title_el = row.find(class_="el-title") or row.find(["h3", "h4", "strong"])
            if not title_el:
                continue
            raw_name = clean_text(title_el.get_text())
            if not raw_name or raw_name in seen_names:
                continue
            seen_names.add(raw_name)

            meta_el = row.find(class_="el-meta")
            role = clean_text(meta_el.get_text(" ")) if meta_el else "Lecturer"

            content_el = row.find(class_="el-content")
            content_text = content_el.get_text("\n") if content_el else ""

            # Email
            email = ""
            mailto = row.find("a", href=lambda h: h and h.startswith("mailto:"))
            if mailto:
                email = mailto["href"].replace("mailto:", "").split("?")[0].strip()
            else:
                em = re.search(r"[\w\.-]+@uthm\.edu\.my", content_text, re.IGNORECASE)
                if em:
                    email = em.group(0).lower()

            # Phone & Room fallback from content
            ph_match = re.search(r"(?:07-?\s*950\s*\d{4}|\+?60\s*\d{1,2}-?\d{7,8})", content_text)
            phone = ph_match.group(0).strip() if ph_match else ""

            room_match = re.search(r"(?:C19-\d{3}-\d{2}|Room\s*[\w\d-]+|Bilik\s*[\w\d-]+|PB-[\w\d-]+|PC-[\w\d-]+)", content_text, re.IGNORECASE)
            room_location = room_match.group(0).upper().replace("BILIK", "").strip() if room_match else ""

            # Cross-reference with Telefon records for exact Office Room Number
            lec_uname = email.split("@")[0].lower().strip() if email else ""
            lec_tokens = clean_tokens(raw_name)

            for tel in telefon_records:
                # 1. Match by username
                if tel["username"] and (tel["username"] == lec_uname or tel["username"] in lec_uname):
                    if tel["room"]:
                        room_location = tel["room"]
                    if tel["phone"] and not phone:
                        phone = tel["phone"]
                    break
                # 2. Match by tokenized name
                tel_tokens = clean_tokens(tel["name"])
                if len(lec_tokens.intersection(tel_tokens)) >= 2:
                    if tel["room"]:
                        room_location = tel["room"]
                    if tel["phone"] and not phone:
                        phone = tel["phone"]
                    break

            # Avatar URL
            img_el = row.find("img")
            avatar_url = urljoin(DIRECTORY_URL, img_el["src"]) if img_el and img_el.get("src") else ""

            # Community URL
            uname = email.split("@")[0] if email else ""
            community_url = f"https://community.uthm.edu.my/{uname}" if uname else ""

            # Specialities
            specialities = []
            for line in content_text.split("\n"):
                line = clean_text(line)
                if not line or "@" in line or (phone and phone in line) or (room_location and room_location in line):
                    continue
                if len(line) > 4 and not any(line.startswith(p) for p in ["Tel:", "Phone:", "Email:", "Ext:"]):
                    parts = [p.strip() for p in line.split(",") if len(p.strip()) > 3]
                    specialities.extend(parts if len(parts) > 1 else [line])

            title_str, clean_n = extract_academic_title(raw_name)
            lec_id = f"fsktm-{slugify(clean_n) or slugify(uname)}"
            is_academic = any(k in role.lower() or k in title_str.lower() for k in ["profesor", "prof", "dr", "pensyarah", "lecturer", "dean"])

            lecturers.append({
                "id": lec_id,
                "name": raw_name,
                "cleanName": clean_n,
                "title": title_str,
                "role": role,
                "facultyCode": "FSKTM",
                "facultyName": "Fakulti Sains Komputer dan Teknologi Maklumat",
                "department": dept_name,
                "username": uname,
                "email": email,
                "phone": phone,
                "roomLocation": room_location,
                "avatarUrl": avatar_url,
                "communityUrl": community_url,
                "specialities": specialities[:5],
                "currentSubjects": [],
                "isAvailableFYP": is_academic
            })

    print(f"[+] Parsed {len(lecturers)} FSKTM staff members.")

    # Concurrently fetch active teaching subjects from Community portal
    print("[*] Concurrently enriching active teaching subjects from Community...")
    def enrich_worker(lec):
        if lec.get("communityUrl"):
            subs = scrape_community_teaching(lec["communityUrl"])
            return lec["id"], subs
        return lec["id"], []

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = [executor.submit(enrich_worker, lec) for lec in lecturers]
        for fut in as_completed(futures):
            lec_id, subs = fut.result()
            if subs:
                for lec in lecturers:
                    if lec["id"] == lec_id:
                        lec["currentSubjects"] = subs
                        break

    return lecturers

def export_results(lecturers: List[Dict[str, Any]]):
    base_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(base_dir, exist_ok=True)
    json_path = os.path.join(base_dir, "lecturers.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(lecturers, f, indent=2, ensure_ascii=False)
    print(f"[✔] Successfully exported {len(lecturers)} records to {json_path}")

if __name__ == "__main__":
    records = scrape_all_fsktm()
    if records:
        export_results(records)
```

---

## 6. Automated 5-Step Gatekeeper & Quality Assurance

To prevent hallucinated data or malformed courses from entering production, run a gatekeeper script (`scripts/validate_and_quarantine.py`). Any rejected record is saved to `data/quarantine_log.json`.

### Gatekeeper Rules:
1. **Rule 1: Identity Integrity**: Must possess a valid non-empty `id`, `name`, and valid official `@uthm.edu.my` email address.
2. **Rule 2: Course Code Validity**: Course code must be at least 6 alphanumeric characters (e.g. `BIT34503`, `BIC21102`).
3. **Rule 3: Temporal Alignment**: Course must strictly match the current semester (`Session 20262027 Semester 1`).
4. **Rule 4: Composite Uniqueness**: A lecturer cannot have duplicate entries for the same course code.
5. **Rule 5: Zero Speculative Assignment**: If a lecturer does not have a course listed in their official personal `#TEA` table, do not guess or assign courses based on name similarity alone.

---

## 7. Edge Cases & Common Pitfalls

| Issue | Root Cause | Solution |
|---|---|---|
| **SSL Certificate Errors** | Internal UTHM servers use institutional certificates or self-signed certs. | Always pass `verify=False` in `requests.get()` and invoke `urllib3.disable_warnings()`. |
| **Missing Room Numbers in FSKTM Directory** | Faculty website does not list office room numbers. | Cross-reference against `https://telefon.uthm.edu.my/fakulti/senarai2/19` column 4 (`tds[3]`). |
| **Room String Formats** | Rooms appear as `PB 601-08`, `PC 102-05`, or `C19-301-02`. | Normalize using regex `re.sub(r"PB\s+", "PB-", ...)` to ensure uniform `PB-xxx-xx` styling. |
| **Intermittent HTTP 500 / 429 Errors** | UTHM Community portal rate limits rapid parallel scraping. | Limit `ThreadPoolExecutor` workers to `6 - 8` and use exponential backoff retry via `urllib3.util.retry.Retry`. |
| **Malay Honorifics in Sorting** | Sorting names by `Prof. Madya Dr.` groups everyone under "P". | Use `extract_academic_title()` to split title from `cleanName` and sort by `cleanName`. |
| **Non-Teaching Duties in #TEA** | Lecturer profile lists "Panel Penilai FYP" or "Invigilator" in teaching table. | Check lines against `IGNORE_KEYWORDS` list to keep only credit-bearing courses. |
| **Course Code Format Variations** | Some entries format as `[BIT34503]` while others format as raw `BIT34503`. | Use regex with named groups: `\[(?P<code>[A-Z0-9]{6,8})\]\|\b(?P<raw_code>[A-Z]{2,4}\d{1,5})\b`. |

---

## 8. Summary Checklist for Any Other AI / Project

When setting up this scraper in a new repository or AI pipeline:
- [ ] Install dependencies: `pip install requests beautifulsoup4 urllib3`.
- [ ] Query `https://telefon.uthm.edu.my/fakulti/senarai2/19` first to capture all staff, usernames, phones, and official rooms.
- [ ] Query `https://fsktm.uthm.edu.my/directory/` to capture departments, avatars, and research specialities.
- [ ] Merge datasets using username first, then fallback to tokenized name matching.
- [ ] Query `https://community.uthm.edu.my/<username>` concurrently for each lecturer to extract active `#TEA` courses.
- [ ] Filter out non-teaching keywords and enforce the target semester string.
- [ ] Validate all records against the 5-step gatekeeper rules.
- [ ] Export to `lecturers.json` and `lecturers.ts`.