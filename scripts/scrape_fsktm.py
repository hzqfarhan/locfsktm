#!/usr/bin/env python3
"""
FSKTM Faculty & Teaching Subject Scraper (Full Pipeline with Telefon Room Directory)
===================================================================================
1. https://fsktm.uthm.edu.my/directory/ (Directory, Roles, Photos, Specialities)
2. https://telefon.uthm.edu.my/fakulti/senarai2/19 (Exact Office Room & Phone Numbers)
3. https://community.uthm.edu.my/<username> (Active Teaching Experience Table #TEA)

Outputs:
    src/data/lecturers.json
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
SESSION_REGEX = re.compile(r"(?:Session|Sesi)\s*2026[/\-]?2027", re.IGNORECASE)
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

                    # Match strictly 2026/2027 semester sessions
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

                    # Session string
                    sess_m = re.search(r"(?:Session|Sesi)\s*\d{4}[/\-]?\d{4}\s*(?:Semester|Sem)\s*\d", desc_val, re.IGNORECASE)
                    session_str = sess_m.group(0) if sess_m else "Semasa"

                    if code not in seen_codes:
                        seen_codes.add(code)
                        subjects.append({
                            "code": code,
                            "name": name_clean,
                            "session": session_str,
                            "year": "2025/2026",
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
        if any(k in htext.lower() for k in ["office", "department", "division", "pejabat", "jabatan"]):
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

            # Avatar URL & Staff ID (photofetch.md specification)
            img_el = row.find("img")
            faculty_avatar_url = urljoin(DIRECTORY_URL, img_el["src"]) if img_el and img_el.get("src") else ""
            staff_id = ""
            if faculty_avatar_url:
                sid_m = re.search(r'/([A-Z0-9]{4,6})-', faculty_avatar_url, re.IGNORECASE)
                if sid_m:
                    staff_id = sid_m.group(1).upper()

            manual_sids = {"nureize": "00694", "helmy": "01299"}
            if not staff_id and uname in manual_sids:
                staff_id = manual_sids[uname]

            avatar_url = f"https://community.uthm.edu.my/images/profiles/{staff_id}.jpg" if staff_id else faculty_avatar_url
            fallback_avatar_url = faculty_avatar_url

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
                "staffId": staff_id,
                "avatarUrl": avatar_url,
                "fallbackAvatarUrl": fallback_avatar_url,
                "communityUrl": community_url,
                "specialities": specialities[:5],
                "currentSubjects": [],
                "isAvailableFYP": is_academic
            })

    # Also add any Telefon records that have a room but weren't in the web directory
    for tel in telefon_records:
        if not tel["room"]:
            continue
        tel_uname = tel["username"]
        already_exists = any(l["username"] == tel_uname or (l["roomLocation"] and l["roomLocation"] == tel["room"]) for l in lecturers)
        if not already_exists:
            title_str, clean_n = extract_academic_title(tel["name"])
            lec_id = f"fsktm-{slugify(clean_n) or slugify(tel_uname)}"
            lecturers.append({
                "id": lec_id,
                "name": tel["name"],
                "cleanName": clean_n,
                "title": title_str,
                "role": tel["role"] or "Pensyarah",
                "facultyCode": "FSKTM",
                "facultyName": "Fakulti Sains Komputer dan Teknologi Maklumat",
                "department": "Fakulti Sains Komputer dan Teknologi Maklumat",
                "username": tel_uname,
                "email": f"{tel_uname}@uthm.edu.my" if tel_uname else "",
                "phone": tel["phone"],
                "roomLocation": tel["room"],
                "avatarUrl": "",
                "communityUrl": f"https://community.uthm.edu.my/{tel_uname}" if tel_uname else "",
                "specialities": [],
                "currentSubjects": [],
                "isAvailableFYP": True
            })

    print(f"[+] Total merged lecturers: {len(lecturers)}.")

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
    base_dir = os.path.join(os.path.dirname(__file__), "..", "src", "data")
    os.makedirs(base_dir, exist_ok=True)
    json_path = os.path.join(base_dir, "lecturers.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(lecturers, f, indent=2, ensure_ascii=False)
    print(f"[OK] Successfully exported {len(lecturers)} records to {json_path}")

if __name__ == "__main__":
    records = scrape_all_fsktm()
    if records:
        export_results(records)
